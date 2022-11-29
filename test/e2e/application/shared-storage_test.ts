// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
  getTestServerPort,
  goToResource,
  step,
} from '../../shared/helper.js';
import {
  describe,
  it,
} from '../../shared/mocha-extensions.js';
import {
  doubleClickSourceTreeItem,
  getStorageItemsData,
  navigateToApplicationTab,
} from '../helpers/application-helpers.js';
import {
  getDataGrid,
  getInnerTextOfDataGridCells,
} from '../helpers/datagrid-helpers.js';

const SHARED_STORAGE_SELECTOR = '[aria-label="Shared Storage"].parent';
let DOMAIN: string;
let DOMAIN_SELECTOR: string;

describe('The Application Tab', async () => {
  before(async () => {
    DOMAIN = `https://localhost:${getTestServerPort()}`;
    DOMAIN_SELECTOR = `${SHARED_STORAGE_SELECTOR} + ol > [aria-label="${DOMAIN}"]`;
  });

  it('shows Shared Storage keys and values', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to shared-storage resource and open Application tab', async () => {
      await navigateToApplicationTab(target, 'shared-storage');
    });

    await step('open the domain storage', async () => {
      await doubleClickSourceTreeItem(SHARED_STORAGE_SELECTOR);
      await doubleClickSourceTreeItem(DOMAIN_SELECTOR);
    });

    await step('check that storage data values are correct', async () => {
      const dataGridRowValues = await getStorageItemsData(['key', 'value']);
      assert.deepEqual(dataGridRowValues, [
        {
          key: 'firstKey',
          value: 'firstValue',
        },
        {
          key: 'secondKey',
          value: '{"field":"complexValue","primitive":2}',
        },
      ]);
    });
  });

  it('shows Shared Storage events', async () => {
    const {target} = getBrowserAndPages();

    await step('navigate to shared-storage resource and open Application tab', async () => {
      // Events are not recorded because tracking is not yet enabled.
      await navigateToApplicationTab(target, 'shared-storage');
    });

    await step('open the events view', async () => {
      await doubleClickSourceTreeItem(SHARED_STORAGE_SELECTOR);
    });

    await step('navigate to shared-storage resource so that events will be recorded', async () => {
      // Events are recorded because tracking is enabled.
      await goToResource('application/shared-storage.html');
    });

    await step('check that event values are correct', async () => {
      const dataGrid = await getDataGrid();
      const innerText = await getInnerTextOfDataGridCells(dataGrid, 2, false);

      assert.strictEqual(innerText[0][1], 'documentSet');
      assert.strictEqual(innerText[0][2], DOMAIN);
      assert.strictEqual(innerText[0][3], '{"key":"firstKey","value":"firstValue"}');
      assert.strictEqual(innerText[1][1], 'documentSet');
      assert.strictEqual(innerText[1][2], DOMAIN);
      assert.strictEqual(
          innerText[1][3], '{"key":"secondKey","value":"{\\"field\\":\\"complexValue\\",\\"primitive\\":2}"}');
    });
  });
});
