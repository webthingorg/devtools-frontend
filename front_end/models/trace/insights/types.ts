// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Handlers from '../handlers/handlers.js';

import type * as InsightsRunners from './InsightRunners.js';

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
export type NavigationInsightData<EnabledModelHandlers extends {[key: string]: Handlers.Types.TraceEventHandler}> = {
  [I in keyof EnabledInsightRunners<EnabledModelHandlers>]: ReturnType<EnabledInsightRunners<EnabledModelHandlers>[I]>;
};

/**
 * Contains insights for the entire trace. Insights are grouped by `navigationId`.
 */
export type TraceInsightData<EnabledModelHandlers extends {[key: string]: Handlers.Types.TraceEventHandler}> =
    Map<string, NavigationInsightData<EnabledModelHandlers>>;

/**
 * Maps each enabled insight name to its generate function. Insights that are disabled (i.e. missing one or more dependencies) will be unset.
 */
export type EnabledInsightRunners<EnabledModelHandlers extends {[key: string]: Handlers.Types.TraceEventHandler}> = {
  [I in keyof InsightRunnersType]:
      [
        Handlers.Types.EnabledHandlerDataWithMeta<EnabledModelHandlers>,
      ] extends [Parameters<InsightRunnersType[I]['generateInsight']>[0]]
      // This is a more general `generateInsight` type for any insight that has all its dependencies met. This avoids the need to do type narrowing when `generateInsight` is invoked.
      ?
      (traceParsedData: Handlers.Types.EnabledHandlerDataWithMeta<EnabledModelHandlers>,
       context: NavigationInsightContext) => ReturnType<InsightRunnersType[I]['generateInsight']>:
      never;
};

/**
 * Represents the narrow set of dependencies defined by an insight's `deps()` function. `Meta` is always included regardless of `deps()`.
 */
export type RequiredData<D extends() => Array<keyof typeof Handlers.ModelHandlers>> =
    Handlers.Types.EnabledHandlerDataWithMeta<Pick<typeof Handlers.ModelHandlers, ReturnType<D>[number]>>;
