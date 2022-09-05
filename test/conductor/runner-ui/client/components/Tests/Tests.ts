// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {store, StoreEvent, Suite, TestStatus, type Test} from '../../store.js';

interface State {
  tests: Test[];
}

const escapeHtml = (unsafe: string) => {
  return unsafe.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
};

class SingleTest extends HTMLElement {
  static tagName = 'runner-ui-test';

  #props: {
    title: () => string | null,
    status: () => string | null,
    duration: () => string | null,
    artifacts?: any,
    errorInfo?: any,
  } = {
    title: () => this.getAttribute('title'),
    status: () => this.getAttribute('status'),
    duration: () => this.getAttribute('duration'),
    artifacts: undefined,
    errorInfo: undefined,
  };

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.#render();
  }

  static get observedAttributes() {
    return ['title', 'status', 'duration', 'artifacts'];
  }

  attributeChangedCallback() {
    this.#render();
  }

  get artifacts() {
    return this.#props.artifacts;
  }

  set artifacts(artifacts: any) {
    this.#props.artifacts = artifacts;
    this.#render();
  }

  get errorInfo() {
    return this.#props.errorInfo;
  }

  set errorInfo(errorInfo: any) {
    this.#props.errorInfo = errorInfo;
    this.#render();
  }

  #renderScreenshotArtifacts() {
    if (!this.#props.artifacts?.screenshots) {
      return '';
    }

    return `
      <p class="artifact-title">Screenshots:</p>
      <div class="screenshot-artifacts">
        <div class="screenshot-artifact">
          <p>Frontend screenshot</p>
          <a href="${this.#props.artifacts.screenshots.frontend}" target="_blank"><img src="${
        this.#props.artifacts.screenshots.frontend}"></a>
        </div>
        <div class="screenshot-artifact">
          <p>Target screenshot</p>
          <a href="${this.#props.artifacts.screenshots.target}" target="_blank"><img src="${
        this.#props.artifacts.screenshots.target}"></a>
        </div>
      </div>
    `;
  }

  #renderPendingStackTracesArtifact() {
    if (!this.#props.artifacts?.stacks[0]) {
      return '';
    }

    return `
      <div class="pending-stack-traces">
        <p class="artifact-title">Pending async operations:</p>
        <pre>${escapeHtml(this.#props.artifacts.stacks[0])}</pre>
      </div>
    `;
  }

  #renderDiff(diff: {expected: string, actual: string}) {
    if (!diff.expected || !diff.actual) {
      return '';
    }

    return `
    <div style="display: flex;">
      <div>
        Expected:
        <pre>${diff.expected}</pre>
      </div>
      <div>
        Actual:
        <pre>${diff.actual}</pre>
      </div>
    </div>
    `;
  }

  #renderErrorInfo() {
    if (!this.#props.errorInfo) {
      return '';
    }

    return `
      <div class="error-info">
        <pre>${this.#props.errorInfo.stack || this.#props.errorInfo.message}</pre>
        ${this.#renderDiff(this.#props.errorInfo.diff)}
      </div>
    `;
  }

  #render() {
    const statusClass = this.#props.status() === TestStatus.FAILED ? 'failed' :
        this.#props.status() === TestStatus.PASSED                 ? 'passed' :
        this.#props.status() === TestStatus.SKIPPED                ? 'skipped' :
                                                                     undefined;

    const hasDetailContent = this.#props.artifacts || this.#props.errorInfo;
    const classes = [
      'test',
      ...(hasDetailContent ? ['has-detail-content'] : []),
      ...(statusClass ? [statusClass] : []),
    ].join(' ');

    const durationStr = this.#props.duration() ? ` - ${this.#props.duration()}ms` : '';
    this.shadowRoot!.innerHTML = `
      <link rel="stylesheet" href="./components/Tests/SingleTest.css">
      <details class="${classes}">
        <summary>${this.#props.title()}${durationStr}</summary>
        ${
        hasDetailContent ? `<div class="detail-content">
            ${this.#renderErrorInfo()}
            ${this.#renderPendingStackTracesArtifact()}
            ${this.#renderScreenshotArtifacts()}
          </div>` :
                           ''}
      </details>
    `;
  }
}

class Tests extends HTMLElement {
  static tagName = 'runner-ui-tests';

  #state: State = {
    tests: [],
  };

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.#render();

    this.#listenToStoreEvents();
  }

  #listenToStoreEvents() {
    store.on(StoreEvent.RUN_STARTED, () => {
      this.#render();
    });

    store.on(StoreEvent.TEST_ADDED, ({test}: {test: Test}) => {
      this.#addTest(test);
      this.#updateTestStats();
    });

    store.on(StoreEvent.TEST_UPDATED, ({test}: {test: Test}) => {
      this.#updateTest(test);
      this.#updateTestStats();
    });
  }

  #updateTestStats() {
    this.shadowRoot!.querySelector('.passed-test-count')!.innerHTML = `${store.getComputedState().passedTestCount}`;
    this.shadowRoot!.querySelector('.failed-test-count')!.innerHTML = `${store.getComputedState().failedTestCount}`;
    this.shadowRoot!.querySelector('.skipped-test-count')!.innerHTML = `${store.getComputedState().skippedTestCount}`;
  }

  #addTest(test: Test) {
    const container = this.shadowRoot!.querySelector('.container');
    const template = document.createElement('template');
    template.innerHTML = `
      <${SingleTest.tagName} title="${test.title}" status=${test.status}></${SingleTest.tagName}>
    `;
    container?.appendChild(template.content.cloneNode(true));
  }

  #updateTest(test: Test) {
    const renderedTest = this.shadowRoot!.querySelector(`[title="${test.title}"]`) as SingleTest | undefined;
    if (!renderedTest) {
      return;
    }

    renderedTest.artifacts = test.artifacts;
    renderedTest.errorInfo = test.err;
    renderedTest.setAttribute('title', test.title);
    renderedTest.setAttribute('status', test.status);
    renderedTest.setAttribute('duration', String(test.duration));
  }

  #render() {
    this.shadowRoot!.innerHTML = `
      <link rel="stylesheet" href="./components/Tests/Tests.css">
      <div class="container passed skipped failed">
        <div class="heading">
          <h3>Tests</h3>
          <div class="filters">
            <label><input type="checkbox" value="passed" checked><span class="passed-test-count">0</span> Passed</label>
            <label><input type="checkbox" value="skipped" checked><span class="skipped-test-count">0</span> Skipped</label>
            <label><input type="checkbox" value="failed" checked><span class="failed-test-count">0</span> Failed</label>
          </div>
        </div>
        <div class="no-tests"></div>
      </div>
    `;

    this.shadowRoot!.querySelectorAll('input[type="checkbox"]')
        .forEach(checkbox => checkbox.addEventListener('change', ev => {
          const target = ev.target as HTMLInputElement;
          this.shadowRoot!.querySelector('.container')?.classList.toggle(target.value, target.checked);
        }));
  }
}

customElements.define(SingleTest.tagName, SingleTest);
customElements.define(Tests.tagName, Tests);

export {Tests};
