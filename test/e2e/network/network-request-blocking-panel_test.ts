// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {expect} from 'chai';
import type {ElementHandle} from 'puppeteer';

import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';
import {getBrowserAndPages, waitFor, waitForAria, waitForElementWithTextContent, waitForFunction, waitForNone} from '../../shared/helper.js';

async function navigateToNetworkRequestBlockingTab() {
  await openPanelViaMoreTools('Network request blocking');
}

async function checkboxIsChecked(element: ElementHandle<HTMLInputElement>): Promise<boolean> {
  return await element.evaluate(node => node.checked);
}

async function isVisible(
    element: ElementHandle<HTMLInputElement>, container: ElementHandle<HTMLInputElement>): Promise<boolean> {
  const i = JSON.parse(await element.evaluate(e => JSON.stringify(e.getBoundingClientRect())));
  const l = JSON.parse(await container.evaluate(e => JSON.stringify(e.getBoundingClientRect())));

  return i.top <= l.top ? l.top - i.top <= i.height : i.bottom - l.bottom <= i.height;
}

async function disableNetworkRequestBlocking() {
  const networkRequestBlockingCheckbox = await waitForAria('Enable network request blocking');
  expect(await checkboxIsChecked(networkRequestBlockingCheckbox)).to.equal(true);
  await networkRequestBlockingCheckbox.click();
  expect(await checkboxIsChecked(networkRequestBlockingCheckbox)).to.equal(false);
}

describe('Network request blocking panel', async () => {
  beforeEach(async () => {
    await navigateToNetworkRequestBlockingTab();
    for (let i = 0; i < 20; i++) {
      const plusButton = await waitForAria('Add pattern');
      await plusButton.click();
      const inputField = await waitFor('.blocked-url-edit-value > input');
      await inputField.type(i.toString());
      const addButton = await waitForAria('Add');
      await addButton.click();
    }
  });

  it('pattern list inactive when blocking disabled', async () => {
    await disableNetworkRequestBlocking();

    await waitForNone('button[aria-label="Edit"]');
    await waitForNone('button[aria-label="Remove"]');

    const fstListItem = await waitFor('.blocked-url');
    const fstCheckbox = await waitFor('.widget > .list > .list-item > .blocked-url > .blocked-url-checkbox');
    expect(await checkboxIsChecked(fstCheckbox)).to.equal(true);
    await fstListItem.click();
    expect(await checkboxIsChecked(fstCheckbox)).to.equal(true);
  });

  it('pattern scrollable when blocking disabled', async () => {
    await disableNetworkRequestBlocking();

    const list = await waitFor('.list');
    const listBB = await list.boundingBox();
    if (listBB) {
      const {frontend} = getBrowserAndPages();
      // +20 to move from the top left point so we are definitely scrolling
      // within the container
      await frontend.mouse.move(listBB.x + 20, listBB.y + 20);
      await frontend.mouse.wheel({deltaY: 450});
    }

    const lastListItem = await waitForElementWithTextContent('19');
    assert.isTrue(await waitForFunction(() => isVisible(lastListItem, list)));
  });
});
