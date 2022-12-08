// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../core/sdk/sdk.js';
import type * as Handlers from '../handlers/handlers.js';
import type * as Protocol from '../../../generated/protocol.js';
import {getSDK} from './utils.js';

const cache = new Map<Handlers.Types.TraceParseData, Map<Protocol.DOM.BackendNodeId, SDK.DOMModel.DOMNode|null>>();

// eslint-disable-next-line @typescript-eslint/naming-convention
export function _TEST_clearCache(): void {
  cache.clear();
}

export async function forNodeId(
    modelData: Handlers.Types.TraceParseData, nodeId: Protocol.DOM.BackendNodeId): Promise<SDK.DOMModel.DOMNode|null> {
  const fromCache = cache.get(modelData)?.get(nodeId);
  if (fromCache !== undefined) {
    return fromCache;
  }

  const SDK = await getSDK();
  const target = SDK.TargetManager.TargetManager.instance().mainFrameTarget();
  const domModel = target?.model(SDK.DOMModel.DOMModel);
  if (!domModel) {
    return null;
  }

  const domNodesMap = await domModel.pushNodesByBackendIdsToFrontend(new Set([nodeId]));
  const result = domNodesMap?.get(nodeId) || null;

  const cacheForModel = cache.get(modelData) || new Map<Protocol.DOM.BackendNodeId, SDK.DOMModel.DOMNode|null>();
  cacheForModel.set(nodeId, result);
  cache.set(modelData, cacheForModel);

  return result;
}
