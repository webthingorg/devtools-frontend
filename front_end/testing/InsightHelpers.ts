// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceModel from '../models/trace/trace.js';

export function createContextForNavigation(
    parsedTrace: TraceModel.Handlers.Types.TraceParseData,
    navigation: TraceModel.Types.TraceEvents.TraceEventNavigationStart,
    frameId: string): TraceModel.Insights.Types.BoundedInsightContextWithNavigation {
  if (!navigation.args.data?.navigationId) {
    throw new Error('expected navigationId');
  }

  const navigationIndex = parsedTrace.Meta.mainFrameNavigations.indexOf(navigation);
  if (navigationIndex === -1) {
    throw new Error('unexpected navigation');
  }

  const min = navigation.ts;
  const max = navigationIndex + 1 < parsedTrace.Meta.mainFrameNavigations.length ?
      parsedTrace.Meta.mainFrameNavigations[navigationIndex + 1].ts :
      parsedTrace.Meta.traceBounds.max;
  const bounds = TraceModel.Helpers.Timing.traceWindowFromMicroSeconds(min, max);

  return {
    bounds,
    frameId,
    navigation,
    navigationId: navigation.args.data?.navigationId,
  };
}

export function getInsight<Key extends keyof TraceModel.Insights.Types.InsightResults>(
    insightKey: Key, insights: TraceModel.Insights.Types.TraceInsightData,
    navigation?: TraceModel.Types.TraceEvents.TraceEventNavigationStart):
    TraceModel.Insights.Types.InsightResults[Key] {
  let key;
  if (navigation) {
    if (!navigation.args.data?.navigationId) {
      throw new Error('expected navigationId');
    }
    key = navigation.args.data.navigationId;
  } else {
    key = TraceModel.Insights.Types.NO_NAVIGATION;
  }

  const boundedInsights = insights.get(key);
  if (!boundedInsights) {
    throw new Error('missing navInsights');
  }

  const insight = boundedInsights.data[insightKey];
  if (insight instanceof Error) {
    throw insight;
  }

  // For some reason typescript won't narrow the type by removing Error, so do it manually.
  return insight as TraceModel.Insights.Types.InsightResults[Key];
}

export function getFirstOrError<T>(iterator: IterableIterator<T>): T {
  const result = iterator.next();
  if (result.done || result.value === undefined) {
    throw new Error('iterator has zero values');
  }

  return result.value;
}

export function getFirst<T>(iterator: IterableIterator<T>): T|undefined {
  return iterator.next().value;
}
