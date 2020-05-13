// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, timeout} from '../../shared/helper.js';
import {getTotalTimeFromSummary, navigateToPerformanceTab, startRecording, stopRecording} from '../helpers/performance-helpers.js';

describe('The Performance panel', () => {
  it('can start and stop a new recording', async () => {
    const {target} = getBrowserAndPages();
    await navigateToPerformanceTab(target, 'empty');

    const PROFILE_WAIT_TIME = 500;

    await startRecording();
    await timeout(PROFILE_WAIT_TIME);
    await stopRecording();

    // Check that the recording shown lasts at least PROFILE_WAIT_TIME.
    const totalTime = await getTotalTimeFromSummary();
    assert.isTrue(totalTime > PROFILE_WAIT_TIME, 'The recording was created successfully');
  });
});
