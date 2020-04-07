// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Given} from 'cucumber';
import * as puppeteer from 'puppeteer';
import {click, getBrowserAndPages, resetPages, resourcesPath, store, waitFor} from '../../shared/helper.js';

const SESSION_STORAGE_SELECTOR = '[aria-label="Session Storage"]';
const DOMAIN_SELECTOR = `${SESSION_STORAGE_SELECTOR} + ol > [aria-label="http://localhost:8090"]`;

async function navigateToApplicationTab(target: puppeteer.Page, testName: string) {
  await target.goto(`${resourcesPath}/application/${testName}.html`);
  await click('#tab-resources');
  // Make sure the application navigation list is shown
  await waitFor('.storage-group-list-item');
}

async function doubleClickSourceTreeItem(selector: string) {
  await waitFor(selector);
  await click(selector, {clickOptions: {clickCount: 2}});
}

Given('that the browser is set up', async () => {
  resetPages;
});

Given('navigate to session-storage resource and open Application tab', async () => {
  const {target} = getBrowserAndPages();
  // const {target} = getBrowserAndPages();
  // await navigateToApplicationTab(target, 'session-storage');
});

Given('open the domain storage', async () => {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

Given('check that storage data values are correct', async () => {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});
