// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, getBrowserAndPages, getTestServerPort, goToResource, pressKey, waitFor, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {doubleClickSourceTreeItem, getReportValues, navigateToApplicationTab} from '../helpers/application-helpers.js';

const TOP_FRAME_SELECTOR = '[aria-label="top"]';
const WEB_WORKERS_SELECTOR = '[aria-label="Web Workers"]';
const SERVICE_WORKERS_SELECTOR = '[aria-label="top"] ~ ol [aria-label="Service Workers"]';

describe('The Application Tab', async () => {
  it('shows details for a frame when clicked on in the frame tree', async () => {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, 'frame-tree');
    await click('#tab-resources');
    await doubleClickSourceTreeItem(TOP_FRAME_SELECTOR);

    await waitForFunction(async () => {
      const fieldValues = await getReportValues();
      const expected = [
        `https://localhost:${getTestServerPort()}/test/e2e/resources/application/frame-tree.html`,
        '',
        `https://localhost:${getTestServerPort()}`,
        '<#document>',
        '',
        'YesLocalhost is always a secure context',
        'No',
        'None',
        'UnsafeNone',
        'available, transferable⚠️ will require cross-origin isolated context in the future',
      ];
      return JSON.stringify(fieldValues) === JSON.stringify(expected);
    });
  });

  it('shows dedicated workers in the frame tree', async () => {
    const {target} = getBrowserAndPages();
    await goToResource('application/frame-tree.html');
    await click('#tab-resources');
    await doubleClickSourceTreeItem(TOP_FRAME_SELECTOR);
    // DevTools is not ready yet when the worker is being initially attached.
    // We therefore need to reload the page to see the worker in DevTools.
    await target.reload();
    await doubleClickSourceTreeItem(WEB_WORKERS_SELECTOR);
    await waitFor(`${WEB_WORKERS_SELECTOR} + ol li:first-child`);
    pressKey('ArrowDown');

    await waitForFunction(async () => {
      const fieldValues = await getReportValues();
      const expected = [
        `https://localhost:${getTestServerPort()}/test/e2e/resources/application/dedicated-worker.js`,
        'Web Worker',
        'None',
      ];
      return JSON.stringify(fieldValues) === JSON.stringify(expected);
    });
  });

  it('shows service workers in the frame tree', async () => {
    await goToResource('application/service-worker-network.html');
    await click('#tab-resources');
    await doubleClickSourceTreeItem(TOP_FRAME_SELECTOR);
    await doubleClickSourceTreeItem(SERVICE_WORKERS_SELECTOR);
    await waitFor(`${SERVICE_WORKERS_SELECTOR} + ol li:first-child`);
    pressKey('ArrowDown');

    await waitForFunction(async () => {
      const fieldValues = await getReportValues();
      const expected = [
        `https://localhost:${getTestServerPort()}/test/e2e/resources/application/service-worker.js`,
        'Service Worker',
        '',
      ];
      return JSON.stringify(fieldValues) === JSON.stringify(expected);
    });
  });
});
