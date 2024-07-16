// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../core/common/common.js';
import type * as Platform from '../../../core/platform/platform.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import * as Bindings from '../../../models/bindings/bindings.js';
import type * as TraceEngine from '../../../models/trace/trace.js';

export class TimelineNetworkRequest {
  #request: SDK.NetworkRequest.NetworkRequest|null;
  constructor(networkRequest: TraceEngine.Types.TraceEvents.SyntheticNetworkRequest) {
    const url = networkRequest.args.data.url as Platform.DevToolsPath.UrlString;
    const urlWithoutHash = Common.ParsedURL.ParsedURL.urlWithoutHash(url) as Platform.DevToolsPath.UrlString;
    const resource =
        Bindings.ResourceUtils.resourceForURL(url) || Bindings.ResourceUtils.resourceForURL(urlWithoutHash);
    this.#request = resource?.request ?? null;
  }

  get request(): SDK.NetworkRequest.NetworkRequest|null {
    return this.#request;
  }
}
