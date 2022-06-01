// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import * as path from 'path';

import {goToResource, getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async function() {
  // The tests in this suite are particularly slow
  this.timeout(30_000);

  it('is open by default when devtools initializes', async () => {
    await navigateToLighthouseTab();
  });

  it('Lighthouse block requests specified in DevTools BlockedURLsPane.', async () => {
    await navigateToLighthouseTab();
    await goToResource('lighthouse/lighthouse-basic.html');
    const {frontend} = getBrowserAndPages();

    const panel = await waitFor('.lighthouse-start-view-fr');
    await frontend.evaluate(() => {
      // @ts-ignore globalThis
      const networkManager = globalThis.SDK.multitargetNetworkManager;
      networkManager.setBlockingEnabled(true);
      networkManager.setBlockedPatterns([{enabled: true, url: '*.css'}]);
    });

    const button = await panel.$('button');
    if (!button) {
      return assert.fail('no button');
    }
    await button.click();
    // Wait for LH to complete and report to come up
    await waitFor('.lh-devtools');

    const {requestsMade, requestsBlocked} = await frontend.evaluate(() => {
        const requestsMade = [];
        const requestsBlocked = [];
        // @ts-ignore globalThis
        const lhr = globalThis.__lighthouseResult;
        for (const item of lhr.audits['network-requests'].details.items) {
          if (item.statusCode === -1) {
            requestsBlocked.push(item.url);
          } else {
            requestsMade.push(item.url);
          }
        }
        return {requestsMade, requestsBlocked};
    });


    assert.deepEqual(requestsMade.map(s => path.basename(s)), [
      'lighthouse-basic.html',
    ]);

    assert.deepEqual(requestsBlocked.map(s => path.basename(s)), [
      'lighthouse-basic.css',
    ]);

    await frontend.evaluate(() => {
      // @ts-ignore globalThis
      const networkManager = globalThis.SDK.multitargetNetworkManager;
      networkManager.setBlockingEnabled(false);
      networkManager.setBlockedPatterns([]);
    });
    return;
  });
});
