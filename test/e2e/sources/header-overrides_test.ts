// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, click, enableExperiment, goToResource, pressKey, typeText, waitFor} from '../../shared/helper.js';
// import {click, enableExperiment, goToResource, typeText, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToNetworkTab, selectRequestByName, waitForSomeRequestsToAppear} from '../helpers/network-helpers.js';
import {clickOnContextMenu, openSourcesPanel} from '../helpers/sources-helpers.js';

const MORE_TABS_SELECTOR = '[aria-label="More tabs"]';
const OVERRIDES_TAB_SELECTOR = '[aria-label="Overrides"]';
const ENABLE_OVERRIDES_SELECTOR = '[aria-label="Select folder for overrides"]';

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

    await click(MORE_TABS_SELECTOR);
    await click(OVERRIDES_TAB_SELECTOR);
    await click(ENABLE_OVERRIDES_SELECTOR);
    await waitFor('[aria-label="Clear configuration"]');
    // await new Promise(() => {});

    await clickOnContextMenu('[aria-label="overrides, fs"]', 'New file');
    await waitFor('.being-edited');
    await typeText('.headers\n');
    await click('.add-block');
    await waitFor('.editable.apply-to');
    await typeText('*.html\n');
    await typeText('aaa\n');
    await typeText('bbb');
    await pressKey('s', {control: true});

    await navigateToNetworkTab('empty.html');
    await waitForSomeRequestsToAppear(1);
    await selectRequestByName('empty.html');
    const networkView = await waitFor('.network-item-view');
    const headersTabHeader = await waitFor('[aria-label=Headers][role="tab"]', networkView);
    await click(headersTabHeader);
    await waitFor('[aria-label=Headers][role=tab][aria-selected=true]', networkView);
    const headersView = await waitFor('.request-headers-view');
    const headersOutline = await $$('[role=treeitem]:not(.hidden)', headersView);
    const textContents =
        await Promise.all(headersOutline.map(line => line.evaluate(message => message.textContent || '')));
    // const found = array1.find(element => element > 10);

    // const foo = await headersOutline[5].evaluate(el => el.textContent || '');
    // assert.isTrue(foo.startsWith('Response Headers'), `response headers heading not found: ${foo}`);
    // const bar = await headersOutline[6].evaluate(el => el.textContent || '');
    // assert.strictEqual(bar, 'aaa: bbb', `aaa header not found: ${bar}`);
    assert.isTrue(textContents.includes('aaa: bbb'), `cannot find overridden header: ${textContents}`);

    // await new Promise(() => {});
  });
});
