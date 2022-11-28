// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
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

const SHARED_STORAGE_SELECTOR = '[aria-label="Shared Storage"].parent';
let DOMAIN_SELECTOR: string;

describe('The Application Tab', async () => {
  before(async () => {
    DOMAIN_SELECTOR = `${SHARED_STORAGE_SELECTOR} + ol > li`;
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
});
