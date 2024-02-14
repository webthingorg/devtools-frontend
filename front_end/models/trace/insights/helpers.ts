// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Handlers from '../handlers/handlers.js';
import {NavigationInsightContext} from './types.js';

export function getNavigationBounds(
    data: Handlers.Types.EnabledHandlerDataWithMeta<typeof Handlers.ModelHandlers>, context: NavigationInsightContext) {
  const frameNavigations = data.Meta.navigationsByFrameId.get(context.frameId);
  if (!frameNavigations) {
    throw new Error(`Frame with id "${context.frameId}" could not be found`);
  }

  const frameNavigationsSorted = [...frameNavigations];
  frameNavigationsSorted.sort((a, b) => a.ts - b.ts);

  let startTs: number|undefined;
  let endTs: number|undefined;

  for (const nav of frameNavigationsSorted) {
    if (nav.args.data?.navigationId === context.navigationId) {
      startTs = nav.ts;
    } else if (startTs) {
      endTs = nav.ts;
      break;
    }
  }

  if (!startTs) {
    throw new Error(`Navigation with id "${context.navigationId}" could not be found`);
  }
  if (!endTs) {
    endTs = data.Meta.traceBounds.max;
  }

  return {startTs, endTs};
}
