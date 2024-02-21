// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import type * as Types from '../types/types.js';

import {type NavigationInsightContext} from './types.js';

export function deps(): Array<keyof typeof Handlers.ModelHandlers> {
  return ['Meta', 'NetworkRequests'];
}

export function generateInsight(context: NavigationInsightContext):
    {renderBlockingRequests: Types.TraceEvents.SyntheticNetworkRequest[]} {
  const networkRequestsData = Handlers.ModelHandlers.NetworkRequests.data();
  const metaData = Handlers.ModelHandlers.Meta.data();

  const renderBlockingRequests = [];
  for (const req of networkRequestsData.byTime) {
    if (req.args.data.frame !== context.frameId) {
      continue;
    }

    const navigation = Helpers.Trace.getNavigationForTraceEvent(req, context.frameId, metaData.navigationsByFrameId);
    if (navigation?.args.data?.navigationId !== context.navigationId) {
      continue;
    }

    if (req.args.data.renderBlocking !== 'blocking') {
      continue;
    }

    renderBlockingRequests.push(req);
  }

  return {
    renderBlockingRequests,
  };
}
