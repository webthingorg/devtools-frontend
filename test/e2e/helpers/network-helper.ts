// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

import {$, $$, click, getBrowserAndPages, resourcesPath, waitFor, waitForFunction} from '../../shared/helper.js';

const REQUEST_LIST_SELECTOR = '.network-log-grid .data';

/**
 * Select the Network tab in DevTools
 */
export async function navigateToNetworkTab(target: puppeteer.Page, testName: string) {
  await target.goto(`${resourcesPath}/network/${testName}`);
  await click('#tab-network');
  // Make sure the network tab is shown on the screen
  await waitFor('.network-log-grid');
}

/**
 * Wait until a certain number of requests are shown in the request list.
 * @param requestNumber The expected number of requests to wait for.
 * @param selector Optional. The selector to use to get the list of requests.
 */
export async function waitForSomeRequests(requestNumber: number, selector = '.name-column') {
  const {frontend} = getBrowserAndPages();

  await frontend.waitForFunction((requestNumber: number, selector: string) => {
    return document.querySelectorAll(selector).length >= requestNumber + 1;
  }, {}, requestNumber, REQUEST_LIST_SELECTOR + ' ' + selector);
}

export async function getAllRequestNames() {
  const requests = await $$(REQUEST_LIST_SELECTOR + ' .name-column');
  return await requests.evaluate((nodes: Element[]) => {
    return nodes.map(request => request.childNodes[1].textContent);
  });
}

export async function getSelectedRequestName() {
  const request = await $(REQUEST_LIST_SELECTOR + ' tr.selected .name-column');
  return await request.evaluate((node: Element) => {
    return node && node.childNodes[1].textContent;
  });
}

export async function selectRequest(index: number) {
  const list = await $(REQUEST_LIST_SELECTOR);
  const request = await list.evaluateHandle((root: Element, index: number) => {
    return root.querySelectorAll('.data-grid-data-grid-node')[index];
  }, index);
  await click(request);
}

export async function waitForSelectedRequestChange(initialRequestName: string|null) {
  await waitForFunction(async () => {
    const name = await getSelectedRequestName();
    return name !== initialRequestName;
  }, 'The selected request did not change');
}
