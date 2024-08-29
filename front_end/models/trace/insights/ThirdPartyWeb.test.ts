// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {TraceLoader} from '../../../testing/TraceLoader.js';
import type * as TraceModel from '../trace.js';

export async function processTrace(testContext: Mocha.Suite|Mocha.Context|null, traceFile: string) {
  const {traceData, insights} = await TraceLoader.traceEngine(testContext, traceFile);
  if (!insights) {
    throw new Error('No insights');
  }

  return {data: traceData, insights};
}

function getInsight(insights: TraceModel.Insights.Types.TraceInsightData, navigationId: string) {
  const navInsights = insights.get(navigationId);
  if (!navInsights) {
    throw new Error('missing navInsights');
  }
  const insight = navInsights.ThirdPartyWeb;
  if (insight instanceof Error) {
    throw insight;
  }
  return insight;
}

describe('ThirdPartyWeb', function() {
  it('categorizes third party web requests (simple)', async () => {
    const {data, insights} = await processTrace(this, 'load-simple.json.gz');
    assert.strictEqual(insights.size, 1);
    const insight = getInsight(insights, data.Meta.navigationsByNavigationId.keys().next().value);

    const result = [...insight.entityByRequest.entries()].map(([request, entity]) => {
      return [request.args.data.url, entity.name];
    });
    assert.deepEqual(result, [
      ['http://localhost:8080/', 'localhost'],
      ['https://fonts.googleapis.com/css2?family=Orelega+One&display=swap', 'Google Fonts'],
      ['http://localhost:8080/styles.css', 'localhost'],
      ['http://localhost:8080/blocking.js', 'localhost'],
      ['http://localhost:8080/module.js', 'localhost'],
      ['https://fonts.gstatic.com/s/orelegaone/v1/3qTpojOggD2XtAdFb-QXZFt93kY.woff2', 'Google Fonts'],
    ]);
  });

  it('categorizes third party web requests (complex)', async () => {
    const {data, insights} = await processTrace(this, 'lantern/paul/trace.json.gz');
    assert.strictEqual(insights.size, 1);
    const insight = getInsight(insights, data.Meta.navigationsByNavigationId.keys().next().value);

    const result = [...insight.entityByRequest.values()].map(entity => entity.name);
    assert.deepEqual([...new Set(result)], [
      'paulirish.com',
      'Google Tag Manager',
      'Google Fonts',
      'Google Analytics',
      'Disqus',
      'Firebase',
    ]);
  });
});
