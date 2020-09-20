// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

import {$$, click, closePanelTab, getBrowserAndPages, goToResource, typeText, waitFor, waitForNone} from '../../shared/helper.js';
import {openCommandMenu} from './quick_open-helpers.js';
import {openPanelViaMoreTools} from './settings-helpers.js';

export const APPLICATION_TAB_SELECTOR = '#tab-resources';
const APPLICATION_PANEL_TITLE = 'Application';
const APPLICATION_PANEL_CONTENT = 'div[aria-label="Application panel"]';

export async function navigateToApplicationTab(target: puppeteer.Page, testName: string) {
  await goToResource(`application/${testName}.html`);
  await click('#tab-resources');
  // Make sure the application navigation list is shown
  await waitFor('.storage-group-list-item');
}

export async function doubleClickSourceTreeItem(selector: string) {
  await waitFor(selector);
  await click(selector, {clickOptions: {clickCount: 2}});
}

export async function getDataGridData(selector: string, columns: string[]) {
  // Wait for Storage data-grid to show up
  await waitFor(selector);

  const dataGridNodes = await $$('.data-grid-data-grid-node');
  const dataGridRowValues = await Promise.all(dataGridNodes.map(node => node.evaluate((row: Element, columns) => {
    const data: {[key: string]: string|null} = {};
    for (const column of columns) {
      data[column] = row.querySelector(`.${column}-column`)!.textContent;
    }
    return data;
  }, columns)));

  return dataGridRowValues;
}

export async function applicationTabExists() {
  await waitFor(APPLICATION_TAB_SELECTOR);
}

export async function applicationTabDoesNotExist() {
  await waitForNone(APPLICATION_TAB_SELECTOR);
}

export async function applicationPanelContentIsLoaded() {
  await waitFor(APPLICATION_PANEL_CONTENT);
}

export async function closeApplicationTab() {
  await closePanelTab(APPLICATION_TAB_SELECTOR);
  await applicationTabDoesNotExist();
}

export async function openApplicationPanelFromMoreTools() {
  await openPanelViaMoreTools(APPLICATION_PANEL_TITLE);
  await applicationTabExists();
  await applicationPanelContentIsLoaded();
}

export async function openApplicationPanelFromCommandMenu() {
  const {frontend} = getBrowserAndPages();
  await openCommandMenu();
  await typeText('Show Application');
  await frontend.keyboard.press('Enter');
  await applicationTabExists();
  await applicationPanelContentIsLoaded();
}
