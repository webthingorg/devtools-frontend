// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {store, StoreEvent, TestStatus, type Suite, type Test} from '../../store.js';

interface State {
  running: boolean;
  failedSuites: {[key: string]: boolean};
  passedTestCount: number;
  failedTestCount: number;
  skippedTestCount: number;
}

class Sidebar extends HTMLElement {
  static tagName = 'runner-ui-sidebar';

  #state: State = {
    running: false,
    failedSuites: {},
    passedTestCount: 0,
    failedTestCount: 0,
    skippedTestCount: 0,
  };

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.#render();

    this.#listenStoreEvents();
  }

  #listenStoreEvents() {
    store.on(StoreEvent.RUN_STARTED, () => {
      this.#state = {
        running: true,
        failedSuites: {},
        passedTestCount: 0,
        failedTestCount: 0,
        skippedTestCount: 0,
      };

      this.#render();
      this.#updateTestStats();
      this.#updateActionButtons();
    });

    store.on(StoreEvent.RUN_ENDED, () => {
      this.#state = {
        running: false,
        failedSuites: {},
        passedTestCount: 0,
        failedTestCount: 0,
        skippedTestCount: 0,
      };

      this.#updateActionButtons();
      this.#removeRunningClassFromSuite();
    });

    store.on(StoreEvent.SUITE_ADDED, ({suite}: {suite: Suite}) => {
      this.#removeRunningClassFromSuite();
      this.#addSuite(suite);
    });

    store.on(StoreEvent.SUITE_UPDATED, ({suite}: {suite: Suite}) => {
      this.#updateSuiteStatus(suite.title);
    });

    store.on(StoreEvent.TEST_ADDED, ({test}: {test: Test}) => {
      this.#updateTestStats();
    });

    store.on(StoreEvent.TEST_UPDATED, ({test}: {test: Test}) => {
      if (test.status === TestStatus.FAILED) {
        this.#state.failedSuites[test.suite] = true;
        this.#updateSuiteStatus(test.suite);
      }

      this.#updateTestStats();
    });
  }

  #updateSuiteStatus(suiteTitle: string) {
    const suiteListItem = this.shadowRoot!.querySelector(`[data-suite-title="${suiteTitle}"]`);
    if (!suiteListItem) {
      return;
    }

    const isFailed = suiteTitle in this.#state.failedSuites;
    suiteListItem.classList.add(isFailed ? 'has-failed-test' : 'all-passed');
  }

  #updateTestStats() {
    this.shadowRoot!.querySelector('#passed-test-count')!.innerHTML = `${store.getComputedState().passedTestCount}`;
    this.shadowRoot!.querySelector('#failed-test-count')!.innerHTML = `${store.getComputedState().failedTestCount}`;
    this.shadowRoot!.querySelector('#skipped-test-count')!.innerHTML = `${store.getComputedState().skippedTestCount}`;
  }

  #updateActionButtons() {
    if (this.#state.running) {
      this.shadowRoot!.querySelector('#abort')?.classList.remove('hidden');
      this.shadowRoot!.querySelector('#runAllTests')?.classList.add('hidden');
      this.shadowRoot!.querySelector('#runFailedTests')?.classList.add('hidden');
    } else {
      this.shadowRoot!.querySelector('#abort')?.classList.add('hidden');
      this.shadowRoot!.querySelector('#runAllTests')?.classList.remove('hidden');
      this.shadowRoot!.querySelector('#runFailedTests')?.classList.remove('hidden');
    }
  }

  #addSuite(suite: Suite) {
    if (!suite.title) {
      return;
    }

    const suiteTemplate = document.createElement('template');
    suiteTemplate.innerHTML = `
      <li data-suite-title="${suite.title}" class="running">${suite.title}</li>
    `;
    this.shadowRoot!.querySelector('.suites-container ul')!.appendChild(suiteTemplate.content.cloneNode(true));
  }

  #removeRunningClassFromSuite() {
    this.shadowRoot!.querySelector('.running')?.classList.remove('running');
  }

  async #handleRunAllTestsClick() {
    await fetch('http://localhost:9999/execute?command=runAllTests');
  }

  async #handleAbortClick() {
    await fetch('http://localhost:9999/execute?command=abort');
  }

  async #handleRunFailedTestsClick() {
    const failedTests = store.getState().tests.filter(test => test.status === TestStatus.FAILED);
    const fgrep = JSON.stringify(failedTests.map(failedTest => failedTest.title));
    console.log('fgrep', fgrep);
    await fetch(`http://localhost:9999/execute?command=runTest&params=${encodeURIComponent(fgrep)}`);
  }

  #render() {
    this.shadowRoot!.innerHTML = `
      <link rel="stylesheet" href="./components/Sidebar/Sidebar.css">
      <div class="container">
        <h1 class="logo">
          Runner UI for DevTools
        </h1>
        <div class="test-stats">
          <span id="passed-test-count">0</span> Passed
          <span id="skipped-test-count">0</span> Skipped
          <span id="failed-test-count">0</span> Failed
        </div>
        <div class="buttons-container">
          <button id="runAllTests">Run all tests</button>
          <button id="runFailedTests">Run failed tests</button>
          <button id="abort" class="hidden">Cancel run</button>
        </div>
        <div class="suites-container">
          <h2>Test Suites</h2>
          <ul>
            <li class="selected">All suites</li>
          </ul>
        </div>
      </div>
    `;

    this.shadowRoot!.querySelector('#runAllTests')?.addEventListener('click', () => {
      this.#handleRunAllTestsClick();
    });

    this.shadowRoot!.querySelector('#runFailedTests')?.addEventListener('click', () => {
      this.#handleRunFailedTestsClick();
    });

    this.shadowRoot!.querySelector('#abort')?.addEventListener('click', () => {
      this.#handleAbortClick();
    });
  }
}

customElements.define(Sidebar.tagName, Sidebar);

export {Sidebar};
