// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';
import type * as puppeteer from 'puppeteer';

import {click, waitForAria, getBrowserAndPages, goToResource, pressKey, typeText, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {waitForDomNodeToBeVisible} from '../helpers/elements-helpers.js';
import {openDeviceToolbar, selectDevice, reloadDockableFrontEnd, selectEdit, selectTestDevice} from '../helpers/emulation-helpers.js';

const ADD_DEVICE_BUTTON_SELECTOR = '#custom-device-add-button';
const FOCUSED_DEVICE_NAME_FIELD_SELECTOR = '#custom-device-name-field:focus';
const EDITOR_ADD_BUTTON_SELECTOR = '.editor-buttons > button:first-child';
const FOCUSED_SELECTOR = '*:focus';

async function elementTextContent(element: puppeteer.ElementHandle): Promise<string> {
  return await element.evaluate(node => node.textContent || '');
}

async function targetTextContent(selector: string): Promise<string> {
  const {target} = getBrowserAndPages();
  const handle = await target.waitForSelector(selector);
  if (!handle) {
    assert.fail(`targetTextContent: could not find element for ${selector}`);
  }
  return elementTextContent(handle);
}

export const tabForwardFrontend = async () => {
  const {frontend} = getBrowserAndPages();
  await frontend.keyboard.press('Tab');
};

describe('Custom devices', async () => {
  beforeEach(async function() {
    await reloadDockableFrontEnd();
    await goToResource('emulation/custom-ua-ch.html');
    await waitFor('.tabbed-pane-left-toolbar');
    await openDeviceToolbar();
  });

  it('can add and then edit a custom device with UA-CH emulation', async () => {
    await selectEdit();
    const add = await waitFor(ADD_DEVICE_BUTTON_SELECTOR);
    await click(add);
    await waitFor(FOCUSED_DEVICE_NAME_FIELD_SELECTOR);
    await typeText('Test device');

    await tabForwardFrontend();  // Focus width.
    await tabForwardFrontend();  // Focus height.
    await tabForwardFrontend();  // Focus DPR.
    await typeText('1.0');

    await tabForwardFrontend();  // Focus UA string.
    await typeText('Test device browser 1.0');

    await tabForwardFrontend();  // Focus device type.
    await tabForwardFrontend();  // Focus folder.
    await pressKey('Space');

    await tabForwardFrontend();  // Focus help button
    await tabForwardFrontend();  // Focus brand browser.
    await typeText('Test browser');

    await tabForwardFrontend();  // Focus brand version.
    await typeText('1.0');

    await tabForwardFrontend();  // Focus delete button.
    await tabForwardFrontend();  // Focus Add brand button.
    await pressKey('Space');

    await typeText('Friendly Dragon');
    await tabForwardFrontend();  //  Focus second row brand version.
    await typeText('1.1');

    await tabForwardFrontend();  // Focus second row delete button.
    await tabForwardFrontend();  // Focus Add browser button.
    await tabForwardFrontend();  // Focus full version.
    await typeText('1.1.2345');

    await tabForwardFrontend();  // Focus platform.
    await typeText('Cyborg');

    await tabForwardFrontend();  // Focus platform version.
    await typeText('C-1');

    await tabForwardFrontend();  // Focus architecture.
    await typeText('Bipedal');

    await tabForwardFrontend();  // Focus device model.
    await typeText('C-1-Gardener');

    await tabForwardFrontend();  // Focus add button.

    const finishAdd = await waitFor(FOCUSED_SELECTOR);
    const finishAddText = await elementTextContent(finishAdd);
    assert.strictEqual(finishAddText, 'Add');
    await click(finishAdd);

    // Select the device in the menu.
    await selectTestDevice();

    // Reload the test page, and verify things working.
    const {target} = getBrowserAndPages();
    await target.reload();

    waitForDomNodeToBeVisible('#res-dump-done');
    assert.strictEqual(await targetTextContent('#res-ua'), 'Test device browser 1.0');
    assert.strictEqual(await targetTextContent('#res-mobile'), 'true');
    assert.strictEqual(await targetTextContent('#res-num-brands'), '2');
    assert.strictEqual(await targetTextContent('#res-brand-0-name'), 'Test browser');
    assert.strictEqual(await targetTextContent('#res-brand-0-version'), '1.0');
    assert.strictEqual(await targetTextContent('#res-brand-1-name'), 'Friendly Dragon');
    assert.strictEqual(await targetTextContent('#res-brand-1-version'), '1.1');
    assert.strictEqual(await targetTextContent('#res-platform'), 'Cyborg');
    assert.strictEqual(await targetTextContent('#res-platform-version'), 'C-1');
    assert.strictEqual(await targetTextContent('#res-architecture'), 'Bipedal');
    assert.strictEqual(await targetTextContent('#res-model'), 'C-1-Gardener');
    assert.strictEqual(await targetTextContent('#res-ua-full-version'), '1.1.2345');

    // Focus the first item in the device list, which should be the custom entry,
    // and then click the edit button that should appear.
    const firstDevice = await waitFor('.devices-list-item');
    await firstDevice.focus();

    const editButton = await waitFor('.toolbar-button[aria-label="Edit"]');
    await editButton.click();

    // Make sure the device name field is what's focused.
    await waitFor(FOCUSED_DEVICE_NAME_FIELD_SELECTOR);

    // Skip over to the version field.
    for (let i = 0; i < 15; ++i) {
      if (i === 7) {
        await pressKey('ArrowRight');
      }
      await tabForwardFrontend();
    }

    // Change the value.
    await typeText('1.1.5');

    // Save the changes.
    await pressKey('Enter');

    // Reload the test page, and verify things working.
    await target.reload();

    waitForDomNodeToBeVisible('#res-dump-done');
    assert.strictEqual(await targetTextContent('#res-ua'), 'Test device browser 1.0');
    assert.strictEqual(await targetTextContent('#res-mobile'), 'true');
    assert.strictEqual(await targetTextContent('#res-num-brands'), '2');
    assert.strictEqual(await targetTextContent('#res-brand-0-name'), 'Test browser');
    assert.strictEqual(await targetTextContent('#res-brand-0-version'), '1.0');
    assert.strictEqual(await targetTextContent('#res-brand-1-name'), 'Friendly Dragon');
    assert.strictEqual(await targetTextContent('#res-brand-1-version'), '1.1');
    assert.strictEqual(await targetTextContent('#res-platform'), 'Cyborg');
    assert.strictEqual(await targetTextContent('#res-platform-version'), 'C-1');
    assert.strictEqual(await targetTextContent('#res-architecture'), 'Bipedal');
    assert.strictEqual(await targetTextContent('#res-model'), 'C-1-Gardener');
    assert.strictEqual(await targetTextContent('#res-ua-full-version'), '1.1.5');
  });

  it('can add and properly display a device with a custom resolution', async () => {
    await selectEdit();
    const add = await waitFor(ADD_DEVICE_BUTTON_SELECTOR);
    await click(add);
    await waitFor(FOCUSED_DEVICE_NAME_FIELD_SELECTOR);
    await typeText('Prime numbers');

    await tabForwardFrontend();  // Focus width.
    await typeText('863');
    await tabForwardFrontend();  // Focus height.
    await typeText('1223');
    await tabForwardFrontend();  // Focus DPR.
    await typeText('1.0');
    await tabForwardFrontend();  // Focus UA string.
    await typeText('Test device browser 1.0');

    const finishAdd = await waitFor(EDITOR_ADD_BUTTON_SELECTOR);
    const finishAddText = await elementTextContent(finishAdd);
    assert.strictEqual(finishAddText, 'Add');
    await click(finishAdd);

    // Select the device in the menu.
    await selectDevice('Prime numbers');

    const zoomButton = await waitForAria('Zoom');
    assert.strictEqual(await elementTextContent(zoomButton), '51%');
  });
});
