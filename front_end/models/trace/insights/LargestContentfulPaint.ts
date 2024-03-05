
// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {type InsightResult, InsightWarning, type NavigationInsightContext, type RequiredData} from './types.js';

export function deps(): ['NetworkRequests', 'PageLoadMetrics', 'LargestImagePaint', 'Meta'] {
  return ['NetworkRequests', 'PageLoadMetrics', 'LargestImagePaint', 'Meta'];
}

export interface LCPPhases {
  /**
   * The time between when the user initiates loading the pate until when
   * the browser receives the first byte of the html response.
   */
  ttfb: Types.Timing.MilliSeconds|undefined;
  /**
   * The time between ttfb and the the LCP resource request being started.
   * For a text LCP, this is undefined given no resource is loaded.
   */
  loadDelay?: Types.Timing.MilliSeconds|undefined;
  /**
   * The time it takes to load the LCP resource.
   */
  loadTime?: Types.Timing.MilliSeconds|undefined;
  /**
   * The time between when the LCP resource finishes loading and when
   * the LCP element is rendered.
   */
  renderDelay: Types.Timing.MilliSeconds|undefined;
}

function breakdownPhases(
    nav: Types.TraceEvents.TraceEventNavigationStart, mainRequest: Types.TraceEvents.SyntheticNetworkRequest,
    lcpMs: Types.Timing.MilliSeconds, lcpRequest?: Types.TraceEvents.SyntheticNetworkRequest): LCPPhases {
  const headersEnd = mainRequest.args.data.timing?.receiveHeadersEnd;
  const ttfb = headersEnd ? headersEnd : Types.Timing.MilliSeconds(0);
  let renderDelay = Types.Timing.MilliSeconds(lcpMs - ttfb);

  if (!lcpRequest) {
    return {ttfb, renderDelay};
  }

  const lcpStartTs = Types.Timing.MicroSeconds(lcpRequest.ts - nav.ts);
  const resourceStart = Helpers.Timing.microSecondsToMilliseconds(lcpStartTs);

  const lcpReqEndTs = Types.Timing.MicroSeconds(lcpRequest.args.data.syntheticData.finishTime - nav.ts);
  const resourceEnd = Helpers.Timing.microSecondsToMilliseconds(lcpReqEndTs);

  const loadDelay = Types.Timing.MilliSeconds(resourceStart - ttfb);
  const loadTime = Types.Timing.MilliSeconds(resourceEnd - resourceStart);
  renderDelay = Types.Timing.MilliSeconds(lcpMs - resourceEnd);

  return {
    ttfb,
    loadDelay,
    loadTime,
    renderDelay,
  };
}

export function generateInsight(traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext):
    InsightResult<{lcpMs?: Types.Timing.MilliSeconds, phases?: LCPPhases}> {
  const networkRequests = traceParsedData.NetworkRequests;

  const nav = traceParsedData.Meta.navigationsByNavigationId.get(context.navigationId);
  if (!nav) {
    throw new Error('no trace navigation');
  }

  const frameMetrics = traceParsedData.PageLoadMetrics.metricScoresByFrameId.get(context.frameId);
  if (!frameMetrics) {
    throw new Error('no frame metrics');
  }

  const navMetrics = frameMetrics.get(context.navigationId);
  if (!navMetrics) {
    throw new Error('no navigation metrics');
  }
  const lcpEvent = navMetrics?.get(Handlers.ModelHandlers.PageLoadMetrics.MetricName.LCP)?.event;
  if (!lcpEvent || !Types.TraceEvents.isTraceEventLargestContentfulPaintCandidate(lcpEvent)) {
    return {warnings: [InsightWarning.NO_LCP]};
  }

  const lcpTiming = Helpers.Timing.timeStampForEventAdjustedByClosestNavigation(
      lcpEvent,
      traceParsedData.Meta.traceBounds,
      traceParsedData.Meta.navigationsByNavigationId,
      traceParsedData.Meta.navigationsByFrameId,
  );

  const lcpMs = Helpers.Timing.microSecondsToMilliseconds(lcpTiming);

  const lcpNodeId = lcpEvent.args.data?.nodeId;
  if (!lcpNodeId) {
    throw new Error('no lcp node id');
  }

  const imagePaint = traceParsedData.LargestImagePaint.get(lcpNodeId);

  const mainFrameUrl = traceParsedData.Meta.mainFrameURL;
  const mainReq = networkRequests.byTime.find(req => req.args.data.url === mainFrameUrl);
  if (!mainReq) {
    return {lcpMs, warnings: [InsightWarning.NO_DOCUMENT_REQUEST]};
  }

  // LCP is text.
  if (!imagePaint) {
    return {
      lcpMs,
      phases: breakdownPhases(nav, mainReq, lcpMs),
    };
  }

  const lcpUrl = imagePaint.args.data?.imageUrl;
  if (!lcpUrl) {
    throw new Error('no lcp url');
  }
  // Look for the LCP resource.
  let lcpRequest;
  for (const req of networkRequests.byTime) {
    if (req.args.data.url === lcpUrl) {
      lcpRequest = req;
    }
  }
  if (!lcpRequest) {
    throw new Error('no lcp request');
  }

  const phases = breakdownPhases(nav, mainReq, lcpMs, lcpRequest);

  return {
    lcpMs,
    phases,
  };
}
