// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {default as Throttler} from '../../../../front_end/common/Throttler.js';

describe('Throttler class', () => {
  it('is able to be instantiated successfully', () => {
    const throttler = new Throttler(10);
    assert.equal(throttler._timeout, 10, 'timeout value is not correct');
    assert.isFalse(throttler._isRunningProcess, 'isRunningProcess value is not correct');
    assert.isFalse(throttler._asSoonAsPossible, 'asSoonAsPossible value is not correct');
    assert.isNull(throttler._process, 'process value is not correct');
    assert.equal(throttler._lastCompleteTime, 0, 'lastCompleteTime value is not correct');
    assert.instanceOf(throttler._schedulePromise, Promise, 'schedulePromise type is not correct');
  });

  it('is able to schedule a process as soon as possible', () => {
    let result = 'original value';

    function assignVar1(resolve: Function) {
      result = 'new value';
    }

    const throttler = new Throttler(10);
    const promiseTest = throttler.schedule(assignVar1, true);
    promiseTest.then(() => {
      assert.equal(result, 'new value', 'process was not scheduled correctly');
    });

    assert.equal(result, 'original value', 'process was not scheduled correctly');
  });

  it('is able to schedule two processes as soon as possible', () => {
    let result = 'original value';

    function assignVar1(resolve: Function) {
      result = 'new value 1';
    }

    function assignVar2(resolve: Function) {
      result = 'new value 2';
    }

    const throttler = new Throttler(10);
    const promiseTest = throttler.schedule(assignVar1, true);
    throttler.schedule(assignVar2, true);
    promiseTest.then(() => {
      assert.equal(result, 'new value 2', 'process was not scheduled correctly');
    });

    assert.equal(result, 'original value', 'process was not scheduled correctly');
  });
});
