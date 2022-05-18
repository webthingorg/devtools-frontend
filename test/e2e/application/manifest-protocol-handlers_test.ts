// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type * as puppeteer from 'puppeteer';

import {click, getBrowserAndPages, waitFor, waitForElementWithTextContent} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getTrimmedTextContent, navigateToApplicationTab} from '../helpers/application-helpers.js';

const MANIFEST_SELECTOR = '[aria-label="Manifest"]';
const DROPDOWN_SELECTOR = '#protocol-select';
const STATUS_MESSAGE_SELECTOR = '.status';

describe('Protocol Handlers', async function() {
  this.timeout(20000);
  it('dropdown shows correct protocols and protocols are selectable', async function() {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, 'app-manifest-protocol');
    await click(MANIFEST_SELECTOR);
    const protocolOption = 'web+pwinter://';  // Second option in dropdown
    const protocolDropdown = await waitFor(DROPDOWN_SELECTOR) as puppeteer.ElementHandle<HTMLSelectElement>;
    const optionToSelect = await waitForElementWithTextContent(protocolOption, protocolDropdown);
    const optionValue = await optionToSelect.evaluate(opt => opt.getAttribute('value'));
    if (!optionValue) {
      throw new Error(`Could not find ${protocolOption} in dropdown`);
    }
    await protocolDropdown.select(optionValue);
  });

  it('shows protocols detected status message', async function() {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, 'app-manifest-protocol');
    await click(MANIFEST_SELECTOR);
    const textValue = await getTrimmedTextContent(STATUS_MESSAGE_SELECTOR);
    const expected =
        'Found valid protocol handler registration in the manifest. With the installed PWA, test the registered protocols.';
    assert.strictEqual(textValue[0], expected);
  });

  it('shows protocols not detected status message', async function() {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, 'app-manifest-id');
    await click(MANIFEST_SELECTOR);
    const textValue = await getTrimmedTextContent(STATUS_MESSAGE_SELECTOR);
    const expected =
        'Define protocol handlers in the manifest to register your app as a handler for custom protocols when your PWA is installed.';
    assert.strictEqual(textValue[0], expected);
  });
});
