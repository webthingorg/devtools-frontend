// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import type * as Types from '../types/types.js';

import {type NavigationInsightContext} from './types.js';

export function findLCPRequest(
    traceParsedData: Pick<Handlers.Types.TraceParseData, 'Meta'|'NetworkRequests'|'LargestImagePaint'>,
    context: NavigationInsightContext, lcpEvent: Types.TraceEvents.TraceEventLargestContentfulPaintCandidate):
    Types.TraceEvents.SyntheticNetworkRequest|null {
  const lcpNodeId = lcpEvent.args.data?.nodeId;
  if (!lcpNodeId) {
    throw new Error('no lcp node id');
  }

  const imagePaint = traceParsedData.LargestImagePaint.get(lcpNodeId);
  if (!imagePaint) {
    return null;
  }

  const lcpUrl = imagePaint.args.data?.imageUrl;
  if (!lcpUrl) {
    throw new Error('no lcp url');
  }
  // Look for the LCP request.
  const lcpRequest = traceParsedData.NetworkRequests.byTime.find(req => {
    const nav =
        Helpers.Trace.getNavigationForTraceEvent(req, context.frameId, traceParsedData.Meta.navigationsByFrameId);
    return (nav?.args.data?.navigationId === context.navigationId) && (req.args.data.url === lcpUrl);
  });

  if (!lcpRequest) {
    throw new Error('no lcp request found');
  }

  return lcpRequest;
}
