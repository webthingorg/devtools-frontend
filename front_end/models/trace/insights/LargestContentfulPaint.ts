
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
  ttfb: Types.Timing.MilliSeconds;
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
  renderDelay: Types.Timing.MilliSeconds;
}

function breakdownPhases(
    nav: Types.TraceEvents.TraceEventNavigationStart, mainRequest: Types.TraceEvents.SyntheticNetworkRequest,
    lcpMs: Types.Timing.MilliSeconds, lcpRequest?: Types.TraceEvents.SyntheticNetworkRequest): LCPPhases {
  const mainResTiming = mainRequest.args.data.timing;
  if (!mainResTiming) {
    throw new Error('no timing for main resource');
  }
  const headersTiming =
      mainResTiming.receiveHeadersStart ? mainResTiming.receiveHeadersStart : mainResTiming.receiveHeadersEnd;
  const timestamp = Helpers.Timing.secondsToMicroseconds(mainResTiming.requestTime) +
      Helpers.Timing.millisecondsToMicroseconds(headersTiming);

  const timing = Types.Timing.MicroSeconds(timestamp - nav.ts);
  const ttfb = Helpers.Timing.microSecondsToMilliseconds(timing);
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

function findLCPResource(
    traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext,
    lcpEvent: Types.TraceEvents.TraceEventLargestContentfulPaintCandidate): Types.TraceEvents.SyntheticNetworkRequest|
    undefined {
  const lcpNodeId = lcpEvent.args.data?.nodeId;
  if (!lcpNodeId) {
    throw new Error('no lcp node id');
  }

  const imagePaint = traceParsedData.LargestImagePaint.get(lcpNodeId);
  if (!imagePaint) {
    return undefined;
  }

  const lcpUrl = imagePaint.args.data?.imageUrl;
  if (!lcpUrl) {
    throw new Error('no lcp url');
  }
  // Look for the LCP resource.
  const lcpResource = traceParsedData.NetworkRequests.byTime.find(req => {
    const nav =
        Helpers.Trace.getNavigationForTraceEvent(req, context.frameId, traceParsedData.Meta.navigationsByFrameId);
    return (nav?.args.data?.navigationId === context.navigationId) && (req.args.data.url === lcpUrl);
  });

  if (!lcpResource) {
    throw new Error('no lcp resource found');
  }

  return lcpResource;
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

  const lcpResource = findLCPResource(traceParsedData, context, lcpEvent);

  const mainReq = networkRequests.byTime.find(req => req.args.data.requestId === context.navigationId);
  if (!mainReq) {
    return {lcpMs, warnings: [InsightWarning.NO_DOCUMENT_REQUEST]};
  }

  // LCP is text.
  if (!lcpResource) {
    return {
      lcpMs,
      phases: breakdownPhases(nav, mainReq, lcpMs),
    };
  }

  return {
    lcpMs,
    phases: breakdownPhases(nav, mainReq, lcpMs, lcpResource),
  };
}
