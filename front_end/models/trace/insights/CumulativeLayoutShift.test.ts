// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {TraceLoader} from '../../../testing/TraceLoader.js';
import * as TraceModel from '../trace.js';

import {type CumulativeLayoutShift} from './InsightRunners.js';
import * as Insights from './insights.js';

async function setupTraceData(testContext: Mocha.Suite|Mocha.Context|null, traceFile: string) {
  const {Meta, Animations} = await TraceLoader.traceEngine(testContext, traceFile);
  const data = {
    Meta,
    Animations,
  } as TraceModel.Handlers.Types.EnabledHandlerDataWithMeta<typeof TraceModel.Handlers.ModelHandlers>;

  return data;
}

describe('CumulativeLayoutShift', function() {
  describe('non composited animations', function() {
    it('gets the correct non composited animations', async function() {
      const data = await setupTraceData(this, 'non-composite-animation.json.gz');
      const context = {
        frameId: data.Meta.mainFrameId,
        navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
      };
      const {animationFailures} =
          TraceModel.Insights.InsightRunners.CumulativeLayoutShift.generateInsight(data, context);
      const expected: CumulativeLayoutShift.NoncompositedAnimationFailures[] = [
        {
          name: 'simple-animation',
          failureReasons: [Insights.Types.AnimationFailureReasons.UNSUPPORTED_CSS_PROPERTY],
          unsupportedProperties: ['color'],
        },
        {
          name: 'top',
          failureReasons: [Insights.Types.AnimationFailureReasons.UNSUPPORTED_CSS_PROPERTY],
          unsupportedProperties: ['top'],
        },
      ];
      assert.deepStrictEqual(animationFailures, expected);
    });
    it('no non composited images', async function() {
      const data = await setupTraceData(this, 'lcp-images.json.gz');
      const context = {
        frameId: data.Meta.mainFrameId,
        navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
      };
      const {animationFailures} =
          TraceModel.Insights.InsightRunners.CumulativeLayoutShift.generateInsight(data, context);
      assert.isEmpty(animationFailures);
    });
  });
});
