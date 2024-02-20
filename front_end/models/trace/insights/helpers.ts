// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Handlers from '../handlers/handlers.js';
import {TraceEventNavigationStart} from '../types/TraceEvents.js';
import {NavigationInsightContext} from './types.js';

export function getNavigationBounds(
    data: Handlers.Types.EnabledHandlerDataWithMeta<typeof Handlers.ModelHandlers>, context: NavigationInsightContext) {
  const navigation = data.Meta.navigationsByNavigationId.get(context.navigationId);
  if (!navigation) {
    throw new Error(`Navigation with id "${context.navigationId}" could not be found`);
  }

  const startTs = navigation.ts;

  const frameNavigations = data.Meta.navigationsByFrameId.get(context.frameId);
  if (!frameNavigations) {
    throw new Error(`Frame with id "${context.frameId}" could not be found`);
  }

  const navIndex = frameNavigations.findIndex(n => n.args.data?.navigationId === context.navigationId);
  const nextNavigation = frameNavigations[navIndex + 1] as TraceEventNavigationStart|undefined;
  const endTs = nextNavigation?.ts || data.Meta.traceBounds.max;

  return {startTs, endTs};
}
