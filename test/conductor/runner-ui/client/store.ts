// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export enum SuiteStatus {
  RUNNING = 'running',
  FINISHED = 'finished',
}

export interface Suite {
  title: string;
  tests: Test[];
  root: boolean;
  file: string;
  titlePath: string[];
  status: SuiteStatus;
}

export enum TestStatus {
  FAILED = 'fail',
  PASSED = 'pass',
  SKIPPED = 'skipped',
  RUNNING = 'run',
  WAITING = 'waiting',
}

// TODO(ergunsh): For now
export type Artifacts = any;

// TODO(ergunsh): For now
export type TestError = any;

export interface Test {
  // Full title
  title: string;
  // Full title
  suite: string;
  status: TestStatus;
  file: string;
  err: TestError;
  duration?: number;
  artifacts: Artifacts;
  titlePath: string[];
}

export enum RunStatus {
  RUNNING = 'running',
  WAITING = 'waiting',
}

export interface State {
  status: RunStatus;
  suites: Suite[];
  tests: Test[];
}

export interface ComputedState {
  passedTestCount: number;
  failedTestCount: number;
  skippedTestCount: number;
}

export enum StoreEvent {
  RUN_STARTED = 'run-started',
  TEST_ADDED = 'test-added',
  TEST_UPDATED = 'test-updated',
  SUITE_ADDED = 'suite-added',
  SUITE_UPDATED = 'suite-updated',
  RUN_ENDED = 'run-ended',
}

class Store {
  #state: State = {
    status: RunStatus.WAITING,
    suites: [],
    tests: [],
  };

  #computedState: ComputedState = {
    passedTestCount: 0,
    failedTestCount: 0,
    skippedTestCount: 0,
  };

  #handlers: Map<StoreEvent, Function[]> = new Map();

  on(event: StoreEvent, handler: Function) {
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, []);
    }

    this.#handlers.get(event)!.push(handler);
  }

  off(event: StoreEvent, handler: Function) {
    if (!this.#handlers.has(event)) {
      return;
    }

    const arr = this.#handlers.get(event);
    this.#handlers.set(event, arr?.filter(fn => fn != handler) || []);
  }

  #emit(event: StoreEvent, params?: object) {
    (this.#handlers.get(event) || []).forEach(handler => {
      handler(params);
    });
  }

  getState() {
    return this.#state;
  }

  getComputedState() {
    return this.#computedState;
  }

  setRunStarted() {
    this.#state = {
      status: RunStatus.WAITING,
      suites: [],
      tests: [],
    };

    this.#computedState = {
      passedTestCount: 0,
      failedTestCount: 0,
      skippedTestCount: 0,
    };

    this.#state.status = RunStatus.RUNNING;
    this.#emit(StoreEvent.RUN_STARTED);
  }

  setRunEnded() {
    this.#state.status = RunStatus.WAITING;
    this.#emit(StoreEvent.RUN_ENDED);
  }

  addSuite(suite: Suite) {
    this.#state.suites.push(suite);
    this.#emit(StoreEvent.SUITE_ADDED, {suite});
  }

  updateSuite(suite: Suite) {
    const suiteIndex = this.#state.suites.findIndex(s => s.title === suite.title);
    this.#state.suites[suiteIndex] = suite;
    this.#emit(StoreEvent.SUITE_UPDATED, {suite});
  }

  addTest(test: Test) {
    this.#state.tests.push(test);

    if (test.status === TestStatus.PASSED) {
      this.#computedState.passedTestCount++;
    }

    if (test.status === TestStatus.FAILED) {
      this.#computedState.failedTestCount++;
    }

    if (test.status === TestStatus.SKIPPED) {
      this.#computedState.skippedTestCount++;
    }

    this.#emit(StoreEvent.TEST_ADDED, {test});
  }

  updateTest(test: Test) {
    const testIndex = this.#state.tests.findIndex(t => t.title === test.title);
    if (testIndex === -1) {
      this.addTest(test);
    } else {
      this.#state.tests[testIndex] = test;
      if (test.status === TestStatus.PASSED) {
        this.#computedState.passedTestCount++;
      }

      if (test.status === TestStatus.FAILED) {
        this.#computedState.failedTestCount++;
      }

      if (test.status === TestStatus.SKIPPED) {
        this.#computedState.skippedTestCount++;
      }
      this.#emit(StoreEvent.TEST_UPDATED, {test});
    }
  }
}

const store = new Store();
export {store};
