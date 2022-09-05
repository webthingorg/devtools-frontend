// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Sidebar} from './components/Sidebar/index.js';
import {Tests} from './components/Tests/Tests.js';
import {store, StoreEvent, SuiteStatus} from './store.js';

store.on(StoreEvent.RUN_STARTED, () => console.log('Run started'));
store.on(StoreEvent.RUN_ENDED, () => console.log('Run ended'));
store.on(StoreEvent.SUITE_ADDED, () => console.log('Suite added', store.getState()));
store.on(StoreEvent.SUITE_UPDATED, () => console.log('Suite updated', store.getState()));
store.on(StoreEvent.TEST_ADDED, () => console.log('Test added', store.getState()));
store.on(StoreEvent.TEST_UPDATED, () => console.log('Test updated', store.getState()));

class App extends HTMLElement {
  static tagName = 'runner-ui-app';

  #eventSource?: EventSource;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.#render();

    this.#listenReporterEvents();
  }

  #listenReporterEvents() {
    this.#eventSource?.close();
    this.#eventSource = new EventSource('http://localhost:9999/listen');
    this.#eventSource.onmessage = evt => {
      const data = JSON.parse(JSON.parse(evt.data));
      if (data) {
        switch (data.event) {
          case 'run-begin':
            store.setRunStarted();
            break;
          case 'run-end':
          case 'aborted':
            store.setRunEnded();
            break;
          case 'suite-begin':
            store.addSuite({
              ...data.params,
              status: SuiteStatus.RUNNING,
            });
            break;
          case 'suite-end':
            store.updateSuite({
              ...data.params,
              status: SuiteStatus.FINISHED,
            });
            break;
          case 'test-begin':
            store.addTest(data.params);
            break;
          case 'test-end':
            store.updateTest(data.params);
            break;
        }
      }
    };
  }

  #render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <link rel="stylesheet" href="app.css">
      <div class="container">
        <${Sidebar.tagName}></${Sidebar.tagName}>
        <${Tests.tagName}></${Tests.tagName}>
      </div>
    `;
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }
}

customElements.define(App.tagName, App);

document.querySelector('#runAllTests')?.addEventListener('click', async () => {
  await fetch('http://localhost:9999/execute?command=runAllTests');
});
document.querySelector('#abort')?.addEventListener('click', async () => {
  await fetch('http://localhost:9999/execute?command=abort');
});
