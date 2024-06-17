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

const {SpeedIndex, FirstContentfulPaint} = Lantern.Metrics;

const defaultThrottling = Lantern.Simulation.Constants.throttling.mobileSlow4G;

describe('Metrics: Lantern Speed Index', () => {
  let trace;
  before(async function() {
    trace = {
      traceEvents: await TraceLoader.rawEvents(this, 'lantern/progressive-app/trace.json.gz'),
    };
  });

  it('should compute predicted value', async () => {
    const data = await getComputationDataFromFixture({trace});
    // TODO: observedSpeedIndex is from the Speedline library, and is used for optimistic
    // mode. At the moment callers must pass the result into Lantern.
    const observedSpeedIndex = 379.04474997520487;
    const result = await SpeedIndex.compute(data, {
      fcpResult: await FirstContentfulPaint.compute(data),
      observedSpeedIndex,
    });

    assertMatchesJSONSnapshot({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    });
  });

  it('should compute predicted value for different settings', async () => {
    const settings = {throttlingMethod: 'simulate', throttling: {...defaultThrottling, rttMs: 300}};
    const data = await getComputationDataFromFixture({trace, settings});
    const observedSpeedIndex = 379.04474997520487;
    const result = await SpeedIndex.compute(data, {
      fcpResult: await FirstContentfulPaint.compute(data),
      observedSpeedIndex,
    });

    assertMatchesJSONSnapshot({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    });
  });

  it('should not scale coefficients at default', async () => {
    const result = SpeedIndex.getScaledCoefficients(defaultThrottling.rttMs);
    expect(result).to.deep.equal(SpeedIndex.COEFFICIENTS);
  });

  it('should scale coefficients back', async () => {
    const result = SpeedIndex.getScaledCoefficients(5);
    expect(result).to.deep.equal({intercept: 0, pessimistic: 0.5, optimistic: 0.5});
  });

  it('should scale coefficients forward', async () => {
    const result = SpeedIndex.getScaledCoefficients(300);
    assertMatchesJSONSnapshot(result);
  });
});
