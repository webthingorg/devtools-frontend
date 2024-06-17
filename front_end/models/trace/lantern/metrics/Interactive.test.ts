// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-nocheck

import {TraceLoader} from '../../../../testing/TraceLoader.js';
import * as Lantern from '../lantern.js';
import {getComputationDataFromFixture} from '../testing/MetricTestUtils.js';

// import {assertMatchesJSONSnapshot} from '../../../../../test/shared/snapshots.js';

function assertMatchesJSONSnapshot() {
  // TODO: why isn't "assertMatchesJSONSnapshot" working? get 404 for snapshots.js
}

const {Interactive, FirstContentfulPaint, LargestContentfulPaint} = Lantern.Metrics;

describe('Metrics: Lantern TTI', () => {
  let trace;
  let iframeTrace;
  before(async function() {
    trace = {
      traceEvents: await TraceLoader.rawEvents(this, 'lantern/progressive-app/trace.json.gz'),
    };
    iframeTrace = {
      traceEvents: await TraceLoader.rawEvents(this, 'lantern/iframe/trace.json.gz'),
    };
  });

  it('should compute predicted value', async () => {
    const data = await getComputationDataFromFixture({trace});
    const result = await Interactive.compute(data, {
      lcpResult: await LargestContentfulPaint.compute(data, {
        fcpResult: await FirstContentfulPaint.compute(data),
      }),
    });

    assertMatchesJSONSnapshot({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    });
    assert.strictEqual(result.optimisticEstimate.nodeTimings.size, 14);
    assert.strictEqual(result.pessimisticEstimate.nodeTimings.size, 31);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });

  it('should compute predicted value on iframes with substantial layout', async () => {
    const data = await getComputationDataFromFixture({
      trace: iframeTrace,
    });
    const result = await Interactive.compute(data, {
      lcpResult: await LargestContentfulPaint.compute(data, {
        fcpResult: await FirstContentfulPaint.compute(data),
      }),
    });

    assertMatchesJSONSnapshot({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    });
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });
});
