// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';

async function parseAndFinalizeData(testContext: Mocha.Suite|Mocha.Context|null, traceFile: string) {
  const traceEvents = await TraceLoader.rawEvents(testContext, traceFile);
  TraceModel.Handlers.ModelHandlers.Meta.initialize();
  TraceModel.Handlers.ModelHandlers.NetworkRequests.initialize();
  for (const event of traceEvents) {
    TraceModel.Handlers.ModelHandlers.Meta.handleEvent(event);
    TraceModel.Handlers.ModelHandlers.NetworkRequests.handleEvent(event);
  }
  await TraceModel.Handlers.ModelHandlers.Meta.finalize();
  await TraceModel.Handlers.ModelHandlers.NetworkRequests.finalize();

  const data = {
    Meta: TraceModel.Handlers.ModelHandlers.Meta.data(),
    NetworkRequests: TraceModel.Handlers.ModelHandlers.NetworkRequests.data(),
  } as TraceModel.Handlers.Types.EnabledHandlerDataWithMeta<typeof TraceModel.Handlers.ModelHandlers>;

  return data;
}

describe.only('RenderBlockingRequests', function() {
  describe('error handling', () => {
  });

  it('finds render blocking requests', async () => {
    const data = await parseAndFinalizeData(this, 'load-simple.json.gz');
    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: data.Meta.navigationsByNavigationId.keys().next().value,
    };

    const {renderBlockingRequests} = TraceModel.Insights.InsightRunners.RenderBlockingRequests.generateInsight(data, context);
    assert.equal(renderBlockingRequests.length, 2);
    assert.deepEqual(renderBlockingRequests.map(r => r.args.data.url), [
      'https://fonts.googleapis.com/css2?family=Orelega+One&display=swap',
      'http://localhost:8080/styles.css',
    ]);
  });

  it('considers only the navigation specified by the context', async () => {
    const data = await parseAndFinalizeData(this, 'multiple-navigations.json.gz');

    const navigations = Array.from(data.Meta.navigationsByNavigationId.values());

    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: navigations[1].args.data?.navigationId || '',
    };

    const {renderBlockingRequests} = TraceModel.Insights.InsightRunners.RenderBlockingRequests.generateInsight(data, context);
    assert(renderBlockingRequests.length > 0, 'no render blocking requests found');

    assert(
      renderBlockingRequests.every(r => r.args.data.syntheticData.sendStartTime > navigations[1].ts),
      'a result is not contained by the nav bounds');
    assert(
      renderBlockingRequests.every(r => r.args.data.syntheticData.finishTime < navigations[2].ts),
      'a result is not contained by the nav bounds');
  });

  it('considers only the frame specified by the context', async () => {
    const data = await parseAndFinalizeData(this, 'render-blocking-in-iframe.json.gz');

    const navigations = Array.from(data.Meta.navigationsByNavigationId.values());

    const context = {
      frameId: data.Meta.mainFrameId,
      navigationId: navigations[0].args.data?.navigationId || '',
    };

    const {renderBlockingRequests} = TraceModel.Insights.InsightRunners.RenderBlockingRequests.generateInsight(data, context);
    assert(renderBlockingRequests.length > 0, 'no render blocking requests found');

    assert(
      renderBlockingRequests.every(r => r.args.data.frame === context.frameId),
      'a result is not from the main frame');
  });
});
