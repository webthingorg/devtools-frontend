
// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {type InsightError, type NavigationInsightContext, type RequiredData} from './types.js';

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

  const lcpStartTs = Types.Timing.MicroSeconds(lcpRequest.args.data.syntheticData.sendStartTime - nav.ts);
  const resourceStart = Helpers.Timing.microSecondsToMilliseconds(lcpStartTs);

  const lcpReqEndTs = Types.Timing.MicroSeconds(lcpRequest.args.data.syntheticData.finishTime - nav.ts);
  const resourceEnd = Helpers.Timing.microSecondsToMilliseconds(lcpReqEndTs);

  let loadDelay, loadTime;
  if (resourceStart && resourceEnd) {
    loadDelay = Types.Timing.MilliSeconds(resourceStart - ttfb);
    loadTime = Types.Timing.MilliSeconds(resourceEnd - resourceStart);
    renderDelay = Types.Timing.MilliSeconds(lcpMs - resourceEnd);
  }

  return {
    ttfb,
    loadDelay,
    loadTime,
    renderDelay,
  };
}

export function generateInsight(traceParsedData: RequiredData<typeof deps>, context: NavigationInsightContext):
    {lcpMs?: Types.Timing.MilliSeconds, phases?: LCPPhases, insightError?: InsightError} {
  const networkRequests = traceParsedData.NetworkRequests;

  const nav = traceParsedData.Meta.navigationsByNavigationId.get(context.navigationId);
  if (!nav) {
    throw new Error('no navigation found');
  }

  const frameMetrics = traceParsedData.PageLoadMetrics.metricScoresByFrameId.get(context.frameId);
  if (!frameMetrics) {
    return {insightError: {message: 'no lcp metric'}};
  }

  const navMetrics = frameMetrics.get(context.navigationId);
  if (!navMetrics) {
    return {insightError: {message: 'no lcp metric'}};
  }
  const lcpMetric = navMetrics?.get(Handlers.ModelHandlers.PageLoadMetrics.MetricName.LCP);

  if (!lcpMetric) {
    return {insightError: {message: 'no lcp metric'}};
  }

  const lcpEvent = lcpMetric.event;
  if (!lcpEvent || lcpEvent?.name !== 'largestContentfulPaint::Candidate') {
    return {insightError: {message: 'no lcp metric'}};
  }

  const lcpTiming = Helpers.Timing.timeStampForEventAdjustedByClosestNavigation(
      lcpEvent,
      traceParsedData.Meta.traceBounds,
      traceParsedData.Meta.navigationsByNavigationId,
      traceParsedData.Meta.navigationsByFrameId,
  );

  const lcpMs = Helpers.Timing.microSecondsToMilliseconds(lcpTiming);
  if (!lcpMs) {
    return {lcpMs, insightError: {message: 'no lcp timing'}};
  }

  const lcpNodeId = lcpEvent.args.data?.nodeId;
  if (!lcpNodeId) {
    return {lcpMs, insightError: {message: 'lcp node id not found'}};
  }

  const imagePaint = traceParsedData.LargestImagePaint.get(lcpNodeId);

  const mainFrameUrl = traceParsedData.Meta.mainFrameURL;
  const mainReq = networkRequests.byTime.find(req => req.args.data.url === mainFrameUrl);
  if (!mainReq) {
    return {lcpMs, insightError: {message: 'document loader request not found'}};
  }

  if (!imagePaint) {
    return {
      lcpMs,
      phases: breakdownPhases(nav, mainReq, lcpMs),
    };
  }

  const lcpUrl = imagePaint.args.data?.imageUrl;
  if (!lcpUrl) {
    return {lcpMs, insightError: {message: 'no lcp resource url'}};
  }
  // Look for the LCP resource.
  let lcpRequest;
  for (const req of networkRequests.byTime) {
    if (req.args.data.url === lcpUrl) {
      lcpRequest = req;
    }
  }
  if (!lcpRequest) {
    return {lcpMs, insightError: {message: 'no lcp resource request'}};
  }

  const phases = breakdownPhases(nav, mainReq, lcpMs, lcpRequest);

  return {
    lcpMs,
    phases,
  };
}
