// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, getHostedModeServerPort} from '../../shared/helper.js';
import {doubleClickSourceTreeItem, getStorageItemsData, navigateToApplicationTab} from '../helpers/application-helpers.js';

const COOKIES_SELECTOR = '[aria-label="Cookies"]';
const STORAGE_SELECTOR = '[aria-label="Storage"]';
const CLEAR_SITE_DATA_BUTTON_SELECTOR = '#storage-view-clear-button';
const INCLUDE_3RD_PARTY_COOKIES_SELECTOR = '[aria-label="Include 3rd party cookies"]';

let DOMAIN_SELECTOR: string;

describe('The Application Tab', async () => {
  before(async () => {
    DOMAIN_SELECTOR = `${COOKIES_SELECTOR} + ol > [aria-label="https://localhost:${getHostedModeServerPort()}"]`;
  });

  afterEach(async () => {
    const {target} = getBrowserAndPages();
    const cookies = await target.cookies();
    await target.deleteCookie(...cookies);
  });

  it('deletes only first party cookies when clearing site data', async () => {
    const {target} = getBrowserAndPages();
    // This sets a new cookie foo=bar
    await navigateToApplicationTab(target, 'cross_origin_cookies');

    await doubleClickSourceTreeItem(COOKIES_SELECTOR);
    await doubleClickSourceTreeItem(DOMAIN_SELECTOR);

    const dataGridRowValuesBefore = await getStorageItemsData(['name', 'value']);
    assert.deepEqual(dataGridRowValuesBefore.length, 3);

    await doubleClickSourceTreeItem(STORAGE_SELECTOR);
    await click(CLEAR_SITE_DATA_BUTTON_SELECTOR);

    await doubleClickSourceTreeItem(COOKIES_SELECTOR);
    await doubleClickSourceTreeItem(DOMAIN_SELECTOR);

    const dataGridRowValuesAfter = await getStorageItemsData(['name', 'value']);
    assert.deepEqual(dataGridRowValuesAfter.length, 1);
  });

  it('deletes only first party cookies when clearing site data', async () => {
    const {target} = getBrowserAndPages();
    // This sets a new cookie foo=bar
    await navigateToApplicationTab(target, 'cross_origin_cookies');

    await doubleClickSourceTreeItem(COOKIES_SELECTOR);
    await doubleClickSourceTreeItem(DOMAIN_SELECTOR);

    const dataGridRowValuesBefore = await getStorageItemsData(['name', 'value']);
    assert.deepEqual(dataGridRowValuesBefore.length, 3);

    await doubleClickSourceTreeItem(STORAGE_SELECTOR);
    await click(INCLUDE_3RD_PARTY_COOKIES_SELECTOR);
    await click(CLEAR_SITE_DATA_BUTTON_SELECTOR);

    await doubleClickSourceTreeItem(COOKIES_SELECTOR);
    await doubleClickSourceTreeItem(DOMAIN_SELECTOR);

    const dataGridRowValuesAfter = await getStorageItemsData(['name', 'value']);
    assert.deepEqual(dataGridRowValuesAfter.length, 0);
  });

  //
});
