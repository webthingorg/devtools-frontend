// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  $$,
  click,
  enableExperiment,
  goToResource,
  pressKey,
  typeText,
  waitFor,
  waitForFunction,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToNetworkTab, selectRequestByName, waitForSomeRequestsToAppear} from '../helpers/network-helpers.js';
import {clickOnContextMenu, openSourcesPanel} from '../helpers/sources-helpers.js';

const MORE_TABS_SELECTOR = '[aria-label="More tabs"]';
const OVERRIDES_TAB_SELECTOR = '[aria-label="Overrides"]';
const ENABLE_OVERRIDES_SELECTOR = '[aria-label="Select folder for overrides"]';
const CLEAR_CONFIGURATION_SELECTOR = '[aria-label="Clear configuration"]';
const OVERRIDES_FILESYSTEM_SELECTOR = '[aria-label="overrides, fs"]';
const FILE_TREE_NEW_FILE_SELECTOR = '[aria-label="NewFile, file"] .tree-element-title';
const NETWORK_VIEW_SELECTOR = '.network-item-view';
const HEADERS_TAB_SELECTOR = '[aria-label=Headers][role="tab"]';
const ACTIVE_HEADERS_TAB_SELECTOR = '[aria-label=Headers][role=tab][aria-selected=true]';
const HEADERS_VIEW_SELECTOR = '.request-headers-view';
const HEADERS_OUTLINE_SELECTOR = '[role=treeitem]:not(.hidden)';

describe('The Overrides Panel', async function() {
  this.timeout(10000);

  afterEach(async () => {
    await openSourcesPanel();
    await click('[aria-label="Clear configuration"]');
    await waitFor(ENABLE_OVERRIDES_SELECTOR);
  });

  it('can create header overrides', async () => {
    await enableExperiment('headerOverrides');
    await goToResource('empty.html');
    await openSourcesPanel();

    // Enable local overrides
    await click(MORE_TABS_SELECTOR);
    await click(OVERRIDES_TAB_SELECTOR);
    await click(ENABLE_OVERRIDES_SELECTOR);
    await waitFor(CLEAR_CONFIGURATION_SELECTOR);

    // Create a header override
    await clickOnContextMenu(OVERRIDES_FILESYSTEM_SELECTOR, 'New file');
    await waitFor('.being-edited');
    await typeText('.headers\n');
    await click('.add-block');
    await waitFor('.editable.apply-to');
    await typeText('*.html\n');
    await typeText('aaa\n');
    await typeText('bbb');
    const title = await waitFor(FILE_TREE_NEW_FILE_SELECTOR);
    let labelText = await title?.evaluate(el => el.textContent);
    assert.strictEqual(labelText, '*.headers');
    await pressKey('s', {control: true});
    await waitForFunction(async () => {
      labelText = await title?.evaluate(el => el.textContent);
      return labelText === '.headers';
    });

    // Navigate to page and open details for request
    await navigateToNetworkTab('hello.html');
    await waitForSomeRequestsToAppear(1);
    await selectRequestByName('hello.html');

    // Go to 'Headers' tab
    const networkView = await waitFor(NETWORK_VIEW_SELECTOR);
    const headersTabHeader = await waitFor(HEADERS_TAB_SELECTOR, networkView);
    await click(headersTabHeader);
    await waitFor(ACTIVE_HEADERS_TAB_SELECTOR, networkView);

    // Verify existence of overridden header
    const headersView = await waitFor(HEADERS_VIEW_SELECTOR);
    const headersOutline = await $$(HEADERS_OUTLINE_SELECTOR, headersView);
    const textContents =
        await Promise.all(headersOutline.map(line => line.evaluate(message => message.textContent || '')));

    assert.isTrue(textContents.includes('aaa: bbb'), `Cannot find overridden header in: ${textContents}`);
  });
});
