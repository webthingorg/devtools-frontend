// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as InsightsRunners from './InsightRunners.js';

/**
 * Context for which navigation an insight should look at.
 */
export interface NavigationInsightContext {
  frameId: string;
  navigationId: string;
}

type InsightRunnersType = typeof InsightsRunners;

/**
 * Contains insights for a specific navigation.
 */
export type NavigationInsightData = {
  [I in keyof InsightRunnersType]: ReturnType<InsightRunnersType[I]['generateInsight']>;
}

/**
 * Contains insights for the entire trace. Insights are grouped by `navigationId`.
 */
export type TraceInsightData = Map<string, NavigationInsightData>
