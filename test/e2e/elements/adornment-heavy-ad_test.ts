// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, getBrowserAndPages, goToResource} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, expandSelectedNodeRecursively, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const INACTIVE_HEAVY_AD_ADORNER_SELECTOR = '[aria-label="HeavyAd adorner"]';

const prepareElementsTab = async () => {
  await waitForElementsStyleSection();
  await assertContentOfSelectedElementsNode('<body>\u200B');
  await expandSelectedNodeRecursively();
};

describe.only('Adornment for Heavy Ad in the Elements Tab', async () => {
  it('displays Heavy Ad adorners and they can be toggled', async () => {
    await goToResource('elements/adornment-heavy-ad.html');
    const {target} = getBrowserAndPages();
    await target.reload();
    await goToResource('elements/adornment-heavy-ad.html');

    await prepareElementsTab();
    const inactiveGridAdorners = await $$(INACTIVE_HEAVY_AD_ADORNER_SELECTOR);
    const getNodesContent = (nodes: HTMLElement[]) => nodes.map((node: HTMLElement) => node.textContent);
    const inactiveContent = await inactiveGridAdorners.evaluate(getNodesContent);
    await new Promise(() => {});
    assert.deepEqual(
        inactiveContent,
        [
          'HeavyAd',
        ],
        'did not have exactly 1 HeavyAd adorner in the inactive state');
  });
});
