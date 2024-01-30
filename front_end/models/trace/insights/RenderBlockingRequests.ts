// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Handlers from '../handlers/handlers.js';

function getNavigationBounds(
    data: Handlers.Types.EnabledHandlerDataWithMeta<typeof Handlers.ModelHandlers>, frameId: string,
    navigationId: string) {
  const frameNavigations = data.Meta.navigationsByFrameId.get(frameId);
  if (!frameNavigations) {
    throw new Error(`Frame with id "${frameId}" could not be found`);
  }

  const frameNavigationsSorted = [...frameNavigations];
  frameNavigationsSorted.sort((a, b) => a.ts - b.ts);

  let startTs: number|undefined;
  let endTs: number|undefined;

  for (const nav of frameNavigationsSorted) {
    if (nav.args.data?.navigationId === navigationId) {
      startTs = nav.ts;
    } else if (startTs) {
      endTs = nav.ts;
      break;
    }
  }

  if (!startTs) {
    throw new Error(`Navigation with id "${navigationId}" could not be found`);
  }
  if (!endTs) {
    endTs = data.Meta.traceBounds.max;
  }

  return {startTs, endTs};
}

export function generateInsight(
    data: Handlers.Types.EnabledHandlerDataWithMeta<typeof Handlers.ModelHandlers>, frameId: string,
    navigationId: string) {
  const frameMetrics = data.PageLoadMetrics.metricScoresByFrameId.get(frameId);
  const navMetrics = frameMetrics?.get(navigationId);
  const fcpMetric = navMetrics?.get(Handlers.ModelHandlers.PageLoadMetrics.MetricName.FCP);

  const {startTs, endTs} = getNavigationBounds(data, frameId, navigationId);

  const renderBlockingRequests = [];
  for (const req of data.NetworkRequests.byTime) {
    if (req.args.data.frame !== frameId) {
      continue;
    }

    const syntheticData = req.args.data.syntheticData;
    if (syntheticData.sendStartTime < startTs || syntheticData.finishTime > endTs) {
      continue;
    }

    if (req.args.data.renderBlocking !== 'blocking') {
      continue;
    }

    renderBlockingRequests.push(req);
  }

  const fcpTs = fcpMetric?.event?.ts;
  if (!fcpTs) {
    throw new Error('No FCP');
  }

  return {
    fcpMetric,
    fcpTiming: (fcpTs - startTs) / 1000,
    renderBlockingRequests,
  };
}
