// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceModel from '../trace.js';
import {TraceLoader} from '../../../testing/TraceLoader.js';
import * as Types from '../types/types.js';

async function setupTraceData(testContext: Mocha.Suite|Mocha.Context|null, traceFile: string) {
  const {NetworkRequests, LargestImagePaint, Meta, PageLoadMetrics} =
      await TraceLoader.traceEngine(testContext, traceFile);
  const data = {
    NetworkRequests,
    LargestImagePaint,
    Meta,
    PageLoadMetrics,
  } as TraceModel.Handlers.Types.EnabledHandlerDataWithMeta<typeof TraceModel.Handlers.ModelHandlers>;

  return data;
}

describe('LargestContentfulPaint', function() {
  it('text largest contentful paint', async () => {
    const data = await setupTraceData(this, 'load-simple.json.gz');
    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
    };

    const insight = TraceModel.Insights.InsightRunners.LargestContentfulPaint.generateInsight(data, context);

    assert.strictEqual(insight.lcpMs, 472.307);

    const wantTtfb = Types.Timing.MilliSeconds(8.591);
    const wantRenderDelay = Types.Timing.MilliSeconds(463.716);
    assert.deepEqual(insight.phases, {ttfb: wantTtfb, renderDelay: wantRenderDelay});
  });
  it('image largest contentful paint', async () => {
    const data = await setupTraceData(this, 'lcp-images.json.gz');
    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
    };

    const insight = TraceModel.Insights.InsightRunners.LargestContentfulPaint.generateInsight(data, context);
    if (!insight.lcpMs) {
      throw new Error('No LCP timing');
    }

    assert.strictEqual(insight.lcpMs, 322.111);

    if (!insight.phases) {
      throw new Error('No LCP phases');
    }

    const phases = {
      ttfb: insight.phases.ttfb?.toFixed(2),
      loadTime: insight.phases.loadTime?.toFixed(2),
      loadDelay: insight.phases.loadDelay?.toFixed(2),
      renderDelay: insight.phases.renderDelay?.toFixed(2),
    };
    assert.deepEqual(
        phases, {ttfb: String(56.29), loadTime: String(104.87), loadDelay: String(28.44), renderDelay: String(132.51)});
  });
});
describe('LargestContentfulPaint warnings', function() {
  it('no lcp', async () => {
    const data = await setupTraceData(this, 'user-timings.json.gz');
    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
    };

    const insight = TraceModel.Insights.InsightRunners.LargestContentfulPaint.generateInsight(data, context);

    assert.strictEqual(insight.lcpMs, undefined);
    assert.strictEqual(insight.phases, undefined);
    assert.strictEqual(insight.warnings?.[0], 'NO_LCP');
  });
  it('no main document url', async () => {
    const data = await setupTraceData(this, 'about-blank-first.json.gz');
    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
    };

    const insight = TraceModel.Insights.InsightRunners.LargestContentfulPaint.generateInsight(data, context);

    assert.strictEqual(insight.lcpMs, undefined);
    assert.strictEqual(insight.phases, undefined);
    assert.strictEqual(insight.warnings?.[0], 'NO_DOCUMENT_REQUEST');
  });
});
