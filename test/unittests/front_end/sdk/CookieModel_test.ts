// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TestConnection from '../helpers/TestConnection.js';
import * as SDK from '../../../../front_end/sdk/sdk.js';

describe('CookieModel', () => {
  beforeEach(() => {
    TestConnection.enable({reset: true});
  });

  it('can be instantiated without issues', async () => {
    // CDP Connection mock: for Network.getCookies, respond with a single cookie.
    TestConnection.setResponseHandler('Network.getCookies', () => {
      return {
        cookies: [{
          domain: '.example.com',
          name: 'name',
          path: '/test',
          size: 23,
          value: 'value',
          expires: 42,
          httpOnly: false,
          secure: false,
          session: true,
          priority: 'Medium',
        }],
      };
    });

    const target = SDK.SDKModel.TargetManager.instance({forceNew: true})
                       .createTarget('test', 'test', SDK.SDKModel.Type.Node, null);
    const model = new SDK.CookieModel.CookieModel(target);
    const cookies = await model.getCookies(['https://www.google.com']);
    assert.isArray(cookies);
    assert.lengthOf(cookies, 1);
    assert.strictEqual(cookies[0].domain(), '.example.com');
  });
});
