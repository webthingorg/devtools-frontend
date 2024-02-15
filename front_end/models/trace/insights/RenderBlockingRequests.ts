// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Handlers from '../handlers/handlers.js';
import {getNavigationBounds} from './helpers.js';
import {NavigationInsightContext} from './types.js';

export function generateInsight(
    data: Handlers.Types.EnabledHandlerDataWithMeta<typeof Handlers.ModelHandlers>, context: NavigationInsightContext) {
  const {startTs, endTs} = getNavigationBounds(data, context);

  const renderBlockingRequests = [];
  for (const req of data.NetworkRequests.byTime) {
    if (req.args.data.frame !== context.frameId) {
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

  return {
    renderBlockingRequests,
  };
}
