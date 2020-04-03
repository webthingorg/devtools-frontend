// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {resetPages, timeout} from '../../shared/helper.js';
import {finishHeapsnapshotRecording, navigateToMemoryTab, selectAllocationInstrumentationOption, selectAllocationViewOnHeapsnapshot, startAllocationInstrumentation} from '../helpers/memory-helpers.js';

describe('Memory Tab', () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('can obtain a heapsnapshot', async () => {
    await navigateToMemoryTab({targetToInspect: 'heapsnapshot.html'});

    await selectAllocationInstrumentationOption();
    await startAllocationInstrumentation();

    // Collect a snapshot over some period of time
    await timeout(100);

    await finishHeapsnapshotRecording();
    await selectAllocationViewOnHeapsnapshot();
  });
});
