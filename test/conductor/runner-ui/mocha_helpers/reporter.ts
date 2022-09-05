// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Mocha from 'mocha';

import {mochaServerBridge} from './bridge.js';

declare module 'mocha' {
  interface Runnable {
    artifacts: any;
  }
}

const {
  EVENT_RUN_BEGIN,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_TEST_END,
  EVENT_RUN_END,
} = Mocha.Runner.constants;

function getTestStatus(test: Mocha.Test) {
  switch (true) {
    case test.isFailed():
      return 'fail';
    case test.isPassed():
      return 'pass';
    case test.isPending():
      return 'skipped';
  }

  return 'run';
}

function getErrorInfo(test: Mocha.Test) {
  if (!test.err) {
    return;
  }

  return {
    name: test.err.name,
    message: test.err.message,
    cause: test.err.cause,
    stack: test.err.stack,
    diff: {
      expected: (test.err as any).expected,
      actual: (test.err as any).actual,
    },
  };
}

function getTestInfo(test: Mocha.Test, statusOverride?: string) {
  return {
    title: test.fullTitle(),
    suite: test.parent?.fullTitle(),
    status: statusOverride || getTestStatus(test),
    file: test.file,
    err: getErrorInfo(test),
    duration: test.duration,
    type: test.type,
    artifacts: test.artifacts,
    titlePath: test.titlePath(),
  };
}

function getSuiteInfo(suite: Mocha.Suite) {
  return {
    title: suite.fullTitle(),
    tests: suite.tests.map(test => getTestInfo(test, 'waiting')),
    root: suite.root,
    file: suite.file,
    titlePath: suite.titlePath(),
  };
}

class RunnerUiReporter extends Mocha.reporters.Spec {
  constructor(runner: Mocha.Runner, options?: Mocha.MochaOptions) {
    super(runner, options);

    runner.on(EVENT_RUN_BEGIN, () => this.emitEvent.call(this, 'run-begin', {
      total: runner.total,
    }));
    runner.on(EVENT_RUN_END, () => this.emitEvent.call(this, 'run-end', {
      stats: runner.stats,
    }));
    runner.on(EVENT_SUITE_BEGIN, suite => this.emitEvent.call(this, 'suite-begin', getSuiteInfo(suite)));
    runner.on(EVENT_SUITE_END, suite => this.emitEvent.call(this, 'suite-end', getSuiteInfo(suite)));
    runner.on(EVENT_TEST_BEGIN, test => this.emitEvent.call(this, 'test-begin', getTestInfo(test)));
    runner.on(EVENT_TEST_END, test => this.emitEvent.call(this, 'test-end', getTestInfo(test)));
  }

  private async emitEvent(eventName: string, params: object) {
    mochaServerBridge.sendToServerProcess(`${JSON.stringify({
      event: eventName,
      params,
    })}||||`);
  }
}

exports = module.exports = RunnerUiReporter;
