// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as MockEnvironment from '../../../../front_end/mock_environment/mock_environment.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';

MockEnvironment.SetupEnvironment.initializeGlobalVars();

export function createTarget({id = 'test', name = 'test', type = SDK.SDKModel.Type.Frame} = {}) {
  return MockEnvironment.SetupEnvironment.createTarget({id, name, type});
}


export function describeWithEnvironment(title: string, fn: (this: Mocha.Suite) => void, opts: {reset: boolean} = {
  reset: true,
}) {
  return describe(`env-${title}`, () => {
    before(async () => await MockEnvironment.SetupEnvironment.initializeGlobalVars(opts));
    after(async () => await MockEnvironment.SetupEnvironment.deinitializeGlobalVars());
    describe(title, fn);
  });
}
