// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import 'mocha-cakes-2';
import {step} from 'mocha-steps';

import * as puppeteer from 'puppeteer';

import {$$, click, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';

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

feature('The Application Tab', async () => {
  beforeEachScenario(async () => {
    await resetPages();
  });

  scenario('shows Session Storage keys and values', async () => {
    const {target} = getBrowserAndPages();

    step('navigate to session-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'session-storage');
    });

    step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SESSION_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
    });

    step('check that storage data values are correct', async () => {
      // Wait for Storage data-grid to show up
      await waitFor('.storage-view table');

      const dataGridNodes = await $$('.data-grid-data-grid-node');
      const dataGridRowValues = await dataGridNodes.evaluate(nodes => nodes.map((row: Element) => {
        return {
          key: row.querySelector('.key-column')!.textContent,
          value: row.querySelector('.value-column')!.textContent,
        };
      }));

      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
        {
          key: '',
          value: '',
        },
      ]);
    });
  });
});
