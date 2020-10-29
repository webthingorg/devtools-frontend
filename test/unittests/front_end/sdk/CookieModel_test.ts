// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TestConnection from '../helpers/TestConnection.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';

describe('CookieModel', () => {
  it('can be instantiated without issues', async () => {
    TestConnection.enableTestConnection();
    TestConnection.setResponseHandler('Network.getCookies', () => {
      return {cookies: []};
    });

    const target = SDK.SDKModel.TargetManager.instance({forceNew: true})
                       .createTarget('test', 'test', SDK.SDKModel.Type.Node, null);
    const model = new SDK.CookieModel.CookieModel(target);
    const cookies = await model.getCookies(['https://www.google.com']);
    assert.isArray(cookies);
  });
});
