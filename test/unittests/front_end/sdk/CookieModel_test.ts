// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TestConnection from '../helpers/TestConnection.js';
import {CookieModel} from '../../../../front_end/sdk/CookieModel.js';

describe('CookieModel', () => {
  beforeEach(() => {
    TestConnection.enable();
  });

  it('can retrieve cookies', async () => {
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

    const target = TestConnection.createTarget();
    const model = new CookieModel(target);
    const cookies = await model.getCookies(['https://www.google.com']);
    assert.isArray(cookies);
    assert.lengthOf(cookies, 1);
    assert.strictEqual(cookies[0].domain(), '.example.com');
  });
});
