// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, step} from '../../shared/helper.js';
import {beforeEach, describe, it} from '../../shared/mocha-extensions.js';
import {doubleClickSourceTreeItem, navigateToApplicationTab} from '../helpers/application-helpers.js';
import {checkIfTabInDrawer, checkIfTabInMainPanel, moveTabToDrawer} from '../helpers/cross-tool-helper.js';
import {getAllRequestNames, getSelectedRequestName} from '../helpers/network-helpers.js';
import {closeConsoleDrawer} from '../helpers/quick_open-helpers.js';

const NETWORK_TAB_SELECTOR = '#tab-network';
const SERVICE_WORKER_ROW_SELECTOR = '[aria-label="Service Workers"]';
const TEST_HTML_FILE = 'service-worker-network';
const SERVICE_WORKER_NETWORK_SELECTOR = '[aria-label="Network requests"]';

describe('The Application Tab', async () => {
  beforeEach(async () => {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, TEST_HTML_FILE);
    await doubleClickSourceTreeItem(SERVICE_WORKER_ROW_SELECTOR);
  });

  it('click on Network for registered service worker should open Network panel in console drawer and closing should move it back',
     async () => {
       await step('Click on network button in service worker should open network panel in drawer', async () => {
         const {target} = getBrowserAndPages();
         await target.reload({waitUntil: 'domcontentloaded'});
         await click(SERVICE_WORKER_NETWORK_SELECTOR);
         const networkTabInDrawer = await checkIfTabInDrawer(NETWORK_TAB_SELECTOR);
         assert.isTrue(networkTabInDrawer);
       });

       await step('Check if network panel contains intercepted requests', async () => {
         const requests = await getAllRequestNames();
         const selectedRequest = await getSelectedRequestName();
         assert.lengthOf(requests, 1);
         assert.strictEqual(selectedRequest, 'main.css');
       });

       await step('Close console drawer and network tab should move back to main panel', async () => {
         await closeConsoleDrawer();
         const networkTabInMainPanel = await checkIfTabInMainPanel(NETWORK_TAB_SELECTOR);
         assert.isTrue(networkTabInMainPanel);
       });

       await step('Check if network panel contains all requests', async () => {
         await click('#tab-network');
         const requests = await getAllRequestNames();
         assert.lengthOf(requests, 3);
       });
     });

  it('If network panel is already in drawer, it should not be moved back after closing the drawer', async () => {
    await step('Move network panel to bottom', async () => {
      await moveTabToDrawer(NETWORK_TAB_SELECTOR);
      const networkTabInDrawer = await checkIfTabInDrawer(NETWORK_TAB_SELECTOR);
      assert.isTrue(networkTabInDrawer);
    });

    await step('Go back to application tab and close console drawer', async () => {
      const {target} = getBrowserAndPages();
      await navigateToApplicationTab(target, TEST_HTML_FILE);
      await doubleClickSourceTreeItem(SERVICE_WORKER_ROW_SELECTOR);
      await closeConsoleDrawer();
    });

    await step('Click on network button should show network panel in drawer', async () => {
      await click(SERVICE_WORKER_NETWORK_SELECTOR);
      const networkTabInDrawer = await checkIfTabInDrawer(NETWORK_TAB_SELECTOR);
      assert.isTrue(networkTabInDrawer);
    });

    await step('Close console drawer and network tab should not be in main panel', async () => {
      await closeConsoleDrawer();
      const tabDoesNotExist = await checkIfTabInMainPanel(NETWORK_TAB_SELECTOR);
      assert.isFalse(tabDoesNotExist);
    });
  });
});
