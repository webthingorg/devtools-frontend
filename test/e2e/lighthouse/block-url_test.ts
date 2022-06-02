// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import * as path from 'path';

import {waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

import type * as puppeteer from 'puppeteer';
interface TableItem {
  [p: string]: undefined|string|number|boolean;
}

// This test will fail (by default) in headful mode, as the target page never gets painted.
// To resolve this when debugging, just make sure the target page is visible during the lighthouse run.

describe('The Lighthouse Tab', async function() {
  // The tests in this suite are particularly slow
  this.timeout(60_000);

  it('is open by default when devtools initializes', async () => {
    await navigateToLighthouseTab();
  });

  it('block requests specified in DevTools BlockedURLsPane.', async () => {
    const {frontend} = await navigateToLighthouseTab('lighthouse/lighthouse-basic.html');

    // Start blocking
    await frontend.evaluate(() => {
      // @ts-ignore layout test global
      const networkManager = self.SDK.multitargetNetworkManager;
      networkManager.setBlockingEnabled(true);
      networkManager.setBlockedPatterns([{enabled: true, url: '*.css'}]);
    });

    const panel = await waitFor('.lighthouse-start-view-fr');

    // Only leave Performance checked
    const checkboxes = await panel.$$('[is=dt-checkbox]');
    checkboxes.forEach(async elemHandle => {
      await elemHandle.evaluate(elem => {
        // @ts-ignore ToolbarCheckbox type
        elem.checkboxElement.checked = (elem.checkboxElement.ariaLabel === 'Performance');
      });
    });

    // Start the LH run
    const button = await panel.$('button');
    if (!button) {
      assert.fail('no button');
    }
    await button.click();

    // Wait for LH to finish, then grab the network requests.
    async function retrieveLhrNetworkRequests(frontend: puppeteer.Page): Promise<TableItem[]> {
      // Install function to receive LHR.
      const lhrRequestsPromise = new Promise(async resolve => {
        // @ts-expect-error
        await frontend.exposeFunction('onLhrReceived', lighthouseResult => {
          resolve(lighthouseResult.audits['network-requests'].details.items);
          return;
        });
      });

      await frontend.evaluate(() => {
        // @ts-expect-error using the `UI` global
        UI.panels.lighthouse.controller.addEventListener('LighthouseResultReceived', evt => {
          // @ts-expect-error call exposed pptrFunction
          window.onLhrReceived(evt.data.lighthouseResult);
        });
      });
      return lhrRequestsPromise as Promise<TableItem[]>;
    }

    const requests = await retrieveLhrNetworkRequests(frontend);
    const trimmedRequests = requests.map((item: TableItem) => {
      return {
        url: typeof item.url === 'string' && path.basename(item.url),
        statusCode: item.statusCode,
      };
    });

    assert.deepEqual(trimmedRequests, [
      {url: 'lighthouse-basic.html', statusCode: 200},
      {url: 'lighthouse-basic.css', statusCode: -1},  // statuCode === -1 means the request failed
    ]);

    await frontend.evaluate(() => {
      // @ts-ignore layout test global
      const networkManager = globalThis.SDK.multitargetNetworkManager;
      networkManager.setBlockingEnabled(false);
      networkManager.setBlockedPatterns([]);
    });
  });
});
