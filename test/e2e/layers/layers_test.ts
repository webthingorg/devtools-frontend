// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, resourcesPath, timeout, waitFor} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

async function getCurrentUrl() {
  await waitFor('[aria-label="layers"]');
  const element = await $('[aria-label="layers"]');
  return element.evaluate(e => e.getAttribute('test-current-url'));
}

describe('The Layers Panel', async () => {
  it('should keep the currently inspected url as an attribute', async () => {
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/layers/default.html`;
    await target.goto(targetUrl);

    await openPanelViaMoreTools('Layers');

    const url = await getCurrentUrl();
    assert.equal(url, targetUrl);
  });

  it('[crbug.com/1053901] should update the layers view when going offline', async () => {
    const {target} = getBrowserAndPages();
    await openPanelViaMoreTools('Layers');

    const targetUrl1 = `${resourcesPath}/layers/default.html`;
    await target.goto(targetUrl1);
    await timeout(50);
    assert.equal(await getCurrentUrl(), targetUrl1);

    const session = await target.target().createCDPSession();
    await session.send(
        'Network.emulateNetworkConditions', {offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0});
    await target.reload();
    await timeout(50);
    assert.equal(await getCurrentUrl(), 'chrome-error://chromewebdata/');
  });
});
