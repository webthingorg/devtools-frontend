// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as SDK from '../../../core/sdk/sdk.js';

let sdkInstance: typeof SDK|null = null;
export async function getSDK(): Promise<typeof SDK> {
  if (sdkInstance) {
    return sdkInstance;
  }
  // We have to lazily load this because it shouldn't execute in a worker
  // context. Importing SDK directly ends up with top level references to
  // `window` in the bundle, which errors in a worker.
  // And although we don't call this code within a worker, some of the
  // TraceModel is used within a worker context, and as such we need to make
  // sure we lazily import it so it doesn't get run within the worker.
  const sdk = await import('../../../core/sdk/sdk.js');
  sdkInstance = sdk;
  return sdk;
}
