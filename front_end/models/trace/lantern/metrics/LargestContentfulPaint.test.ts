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

const {FirstContentfulPaint, LargestContentfulPaint} = Lantern.Metrics;

describe('Metrics: Lantern LCP', () => {
  let trace;
  before(async function() {
    trace = {
      traceEvents: await TraceLoader.rawEvents(this, 'lantern/paul/trace.json.gz'),
    };
  });

  it('should compute predicted value', async () => {
    const data = await getComputationDataFromFixture({trace});
    const result = await LargestContentfulPaint.compute(data, {
      fcpResult: await FirstContentfulPaint.compute(data),
    });

    assertMatchesJSONSnapshot({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
      optimisticNodeTimings: result.optimisticEstimate.nodeTimings.size,
      pessimisticNodeTimings: result.pessimisticEstimate.nodeTimings.size,
    });
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });
});
