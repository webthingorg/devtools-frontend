// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type * as puppeteer from 'puppeteer';

import {waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getTrimmedTextContent,
  navigateToManifestInApplicationTab,
} from '../helpers/application-helpers.js';

const DROPDOWN_SELECTOR = '.protocol-select';
const STATUS_MESSAGE_SELECTOR = '.status';

describe('Protocol Handlers', async function() {
  this.timeout(20000);

  it('dropdown shows correct protocols and protocols are selectable', async function() {
    await navigateToManifestInApplicationTab('app-manifest-protocol');
    const protocolDropdown = await waitFor(DROPDOWN_SELECTOR) as puppeteer.ElementHandle<HTMLSelectElement>;
    const expectedOptions = ['web+coffee', 'web+pwinter'];
    const optionsValues = await protocolDropdown.evaluate(el => {
      return [...el.options].map(option => option.value);
    });
    assert.sameMembers(expectedOptions, optionsValues);
  });

  it('shows protocols detected status message', async function() {
    await navigateToManifestInApplicationTab('app-manifest-protocol');
    const textValue = await getTrimmedTextContent(STATUS_MESSAGE_SELECTOR);
    const expected =
        'Found valid protocol handler registration in the manifest. With the app installed, test the registered protocols.';
    assert.strictEqual(textValue[0], expected);
  });

  it('shows protocols not detected status message', async function() {
    await navigateToManifestInApplicationTab('app-manifest-id');
    const textValue = await getTrimmedTextContent(STATUS_MESSAGE_SELECTOR);
    const expected =
        'Define protocol handlers in the manifest to register your app as a handler for custom protocols when your app is installed.';
    assert.strictEqual(textValue[0], expected);
  });
});
