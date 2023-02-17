// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Common from '../../../../../front_end/core/common/common.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
const Throttler = Common.Throttler.Throttler;

describe('Throttler class', () => {
  it('is able to schedule a process as soon as possible', async () => {
    let result = 'original value';

    async function assignVar1() {
      result = 'new value';
    }

    const throttler = new Throttler(10);
    const promiseTest = throttler.schedule(assignVar1, true);

    assert.strictEqual(result, 'original value', 'process was not scheduled correctly');
    await promiseTest;
    assert.strictEqual(result, 'new value', 'process was not scheduled correctly');
  });

  it('is able to schedule two processes as soon as possible', async () => {
    let result = 'original value';

    async function assignVar1() {
      result = 'new value 1';
    }

    async function assignVar2() {
      result = 'new value 2';
    }

    const throttler = new Throttler(10);
    const promiseTest = throttler.schedule(assignVar1, true);
    void throttler.schedule(assignVar2, true);

    assert.strictEqual(result, 'original value', 'process was not scheduled correctly');
    await promiseTest;
    assert.strictEqual(result, 'new value 2', 'process was not scheduled correctly');
  });
});

describeWithMockConnection('Simple Throttler', () => {
  class MockTimeoutControl implements Common.Throttler.SimpleThrottler.TimeoutControlForTest {
    callback: (() => void)|undefined = undefined;

    setTimeout(callback: () => void, _timeout: number): number {
      this.callback = callback;
      return 1;
    }

    clearTimeout(id: number|undefined) {
      console.assert(!id || id === 1);
      this.callback = undefined;
    }

    tick(): void {
      assertNotNullOrUndefined(this.callback);
      this.callback();
      this.callback = undefined;
    }

    timeoutActive(): boolean {
      return Boolean(this.callback);
    }
  }

  it('flushes on true condition', async () => {
    let finishedTaskCount: number = 0;
    const timeoutControl = new MockTimeoutControl();
    const throttler = Common.Throttler.SimpleThrottler.makeSimpleThrottler(200, () => true, timeoutControl);

    throttler(() => {
      finishedTaskCount++;
    });

    assert.strictEqual(finishedTaskCount, 1);
  });

  it('uses timeout on false condition', async () => {
    let finishedTaskCount: number = 0;
    const timeoutControl = new MockTimeoutControl();
    const throttler = Common.Throttler.SimpleThrottler.makeSimpleThrottler(200, () => false, timeoutControl);

    throttler(() => {
      finishedTaskCount++;
    });

    assert.strictEqual(finishedTaskCount, 0);
    assert.isTrue(timeoutControl.timeoutActive());
    timeoutControl.tick();
    assert.isFalse(timeoutControl.timeoutActive());
    assert.strictEqual(finishedTaskCount, 1);
  });

  it('flushes after condition becomes true', async () => {
    let finishedTaskCount: number = 0;
    const timeoutControl = new MockTimeoutControl();
    const throttler = Common.Throttler.SimpleThrottler.makeSimpleThrottler(
        200, (tasks: Common.Throttler.SimpleThrottler.ThrottleTask[]) => {
          return tasks.length >= 2;
        }, timeoutControl);

    // Submit a task. The task is only queued (because the flushing condition only triggers after two tasks).
    throttler(() => {
      finishedTaskCount++;
    });

    assert.strictEqual(finishedTaskCount, 0);
    assert.isTrue(timeoutControl.timeoutActive());

    // Once we submit a second task, the throttler flushes.
    throttler(() => {
      finishedTaskCount++;
    });

    // Check that the throttler flushes and deactivates the timeout.
    assert.strictEqual(finishedTaskCount, 2);
    assert.isFalse(timeoutControl.timeoutActive());
  });
});
