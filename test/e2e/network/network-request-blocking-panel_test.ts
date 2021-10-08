// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {expect} from 'chai';
import type {ElementHandle} from 'puppeteer';

import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';
import {waitFor, waitForElementWithTextContent, waitForNone} from '../../shared/helper.js';

async function navigateToNetworkRequestBlockingTab() {
  await openPanelViaMoreTools('Network request blocking');
}

async function checkboxIsChecked(element: ElementHandle<HTMLInputElement>): Promise<boolean> {
  return await element.evaluate(node => node.checked);
}

describe('Network request blocking panel', async () => {
  it('pattern list inactive but scrollable when blocking disabled', async () => {
    await navigateToNetworkRequestBlockingTab();
    for (let i = 0; i < 20; i++) {
      const plusButton = await waitFor('[aria-label="Add pattern"]');
      await plusButton.click();
      const inputField = await waitFor('.blocked-url-edit-value > input');
      await inputField.type(i.toString());
      const addButton = await waitForElementWithTextContent('Add');
      await addButton.click();
    }
    const networkRequestBlockingCheckbox = await waitFor('input[aria-label="Enable network request blocking"]');
    expect(await checkboxIsChecked(networkRequestBlockingCheckbox)).to.equal(true);
    await networkRequestBlockingCheckbox.click();
    expect(await checkboxIsChecked(networkRequestBlockingCheckbox)).to.equal(false);

    await waitForNone('button[aria-label="Edit"]');
    await waitForNone('button[aria-label="Remove"]');

    const fstListItem = await waitFor('.widget > .list > .list-item > .blocked-url');
    const fstCheckbox = await waitFor('.widget > .list > .list-item > .blocked-url > .blocked-url-checkbox');
    expect(await checkboxIsChecked(fstCheckbox)).to.equal(true);
    await fstListItem.click();
    expect(await checkboxIsChecked(fstCheckbox)).to.equal(true);

    const listItem = await waitForElementWithTextContent('19');
    listItem.evaluate(el => el.scrollIntoView(true));
  });
});
