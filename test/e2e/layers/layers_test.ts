// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {expectError, type ErrorExpectation} from '../../conductor/events.js';
import {
  getBrowserAndPages,
  getResourcesPath,
  goToResource,
  waitFor,
  waitForFunction,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getCurrentUrl} from '../helpers/layers-helpers.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

let errorException: ErrorExpectation;

describe('The Layers Panel', async () => {
  beforeEach(async () => {
    errorException = expectError('Unable to create texture');
  });

  afterEach(async () => {
    errorException.drop();
  });

  it('should keep the currently inspected url as an attribute', async () => {
    const targetUrl = 'layers/default.html';
    await goToResource(targetUrl);

    await openPanelViaMoreTools('Layers');

    await waitFor('[aria-label="layers"]:not([test-current-url=""])');

    await waitForFunction(async () => {
      return await getCurrentUrl() === `${getResourcesPath()}/${targetUrl}`;
    });
  });

  it('should update the layers view when going offline', async () => {
    const {target} = getBrowserAndPages();
    await openPanelViaMoreTools('Layers');

    const targetUrl = 'layers/default.html';
    await goToResource(targetUrl, {waitUntil: 'networkidle0'});
    await waitFor('[aria-label="layers"]:not([test-current-url=""])');
    assert.strictEqual(await getCurrentUrl(), `${getResourcesPath()}/${targetUrl}`);

    const session = await target.target().createCDPSession();
    await session.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await target.reload({waitUntil: 'networkidle0'});
    await waitFor(`[aria-label="layers"]:not([test-current-url="${targetUrl}"])`);
    assert.strictEqual(await getCurrentUrl(), 'chrome-error://chromewebdata/');
  });
});
