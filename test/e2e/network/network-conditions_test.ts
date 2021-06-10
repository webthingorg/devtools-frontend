// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type {ElementHandle, Page} from 'puppeteer';
import {getBrowserAndPages, pressKey, typeText, waitFor, waitForAria} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToNetworkTab} from '../helpers/network-helpers.js';

describe('The Network Tab', async function() {
  beforeEach(async () => {
    await navigateToNetworkTab('empty.html');
  });

  async function openNetworkConditions(sectionClassName: string) {
    const networkConditionsButton = await waitForAria('More network conditions…');
    await networkConditionsButton.click();
    return await waitFor(sectionClassName);
  }

  async function assertDisabled(checkbox: ElementHandle<Element>, expected: boolean) {
    const disabled = await checkbox.evaluate(el => el.disabled);
    assert.strictEqual(disabled, expected);
  }

  async function assertChecked(checkbox: ElementHandle<Element>, expected: boolean) {
    const checked = await checkbox.evaluate(el => el.checked);
    assert.strictEqual(checked, expected);
  }

  async function getUserAgentMetadataFromTarget(target: Page) {
    const getUserAgentMetaData = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = <any>navigator;
      return {
        brands: nav.userAgentData.brands,
        mobile: nav.userAgentData.mobile,
        ...(await nav.userAgentData.getHighEntropyValues([
          'uaFullVersion',
          'architecture',
          'model',
          'platform',
          'platformVersion',
        ])),
      };
    };
    const getUserAgentMetaDataStr = `(${getUserAgentMetaData.toString()})()`;
    return await target.evaluate(getUserAgentMetaDataStr);
  }

  async function tabForwardFrontend() {
    const {frontend} = getBrowserAndPages();
    await frontend.keyboard.press('Tab');
  }

  it('can change accepted content encodings', async () => {
    const section = await openNetworkConditions('.network-config-accepted-encoding');
    const autoCheckbox = await waitForAria('Use browser default', section);
    const deflateCheckbox = await waitForAria('deflate', section);
    const gzipCheckbox = await waitForAria('gzip', section);
    const brotliCheckbox = await waitForAria('br', section);
    await brotliCheckbox.evaluate(el => el.scrollIntoView(true));
    await assertChecked(autoCheckbox, true);
    await assertChecked(deflateCheckbox, true);
    await assertChecked(gzipCheckbox, true);
    await assertChecked(brotliCheckbox, true);
    await assertDisabled(autoCheckbox, false);
    await assertDisabled(deflateCheckbox, true);
    await assertDisabled(gzipCheckbox, true);
    await assertDisabled(brotliCheckbox, true);
    await autoCheckbox.click();
    await assertChecked(autoCheckbox, false);
    await assertChecked(deflateCheckbox, true);
    await assertChecked(gzipCheckbox, true);
    await assertChecked(brotliCheckbox, true);
    await assertDisabled(autoCheckbox, false);
    await assertDisabled(deflateCheckbox, false);
    await assertDisabled(gzipCheckbox, false);
    await assertDisabled(brotliCheckbox, false);
    await brotliCheckbox.click();
    await assertChecked(autoCheckbox, false);
    await assertChecked(deflateCheckbox, true);
    await assertChecked(gzipCheckbox, true);
    await assertChecked(brotliCheckbox, false);
    await assertDisabled(autoCheckbox, false);
    await assertDisabled(deflateCheckbox, false);
    await assertDisabled(gzipCheckbox, false);
    await assertDisabled(brotliCheckbox, false);
    await autoCheckbox.click();
    await assertChecked(autoCheckbox, true);
    await assertChecked(deflateCheckbox, true);
    await assertChecked(gzipCheckbox, true);
    await assertChecked(brotliCheckbox, false);
    await assertDisabled(autoCheckbox, false);
    await assertDisabled(deflateCheckbox, true);
    await assertDisabled(gzipCheckbox, true);
    await assertDisabled(brotliCheckbox, true);
  });

  it('can override userAgentMetadata', async () => {
    const {target, browser} = getBrowserAndPages();
    const fullVersion = (await browser.version()).split('/')[1];
    const majorVersion = fullVersion.split('.', 1)[0];
    const fixedVersionUAValue =
        'Mozilla/5.0 (Linux; U; Android 4.0.2; en-us; Galaxy Nexus Build/ICL53F) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30';
    const dynamicVersionUAValue =
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Safari/537.36'.replace(
            '%s', fullVersion);
    const noMetadataVersionUAValue = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';

    const fixedVersionUserAgentMetadataExpected = {
      'brands': [
        {'brand': 'Not A;Brand', 'version': '99'},
        {'brand': 'Chromium', 'version': majorVersion},
        {'brand': 'Google Chrome', 'version': majorVersion},
      ],
      'uaFullVersion': fullVersion,
      'platform': 'Android',
      'platformVersion': '4.0.2',
      'architecture': '',
      'model': 'Galaxy Nexus',
      'mobile': true,
    };
    const dynamicVersionUserAgentMetadataExpected = {
      'brands': [
        {'brand': 'Not A;Brand', 'version': '99'},
        {'brand': 'Chromium', 'version': majorVersion},
        {'brand': 'Google Chrome', 'version': majorVersion},
      ],
      'uaFullVersion': fullVersion,
      'platform': 'Windows',
      'platformVersion': '10.0',
      'architecture': 'x86',
      'model': '',
      'mobile': false,
    };
    const noMetadataVersionUserAgentMetadataExpected = {
      'brands': [],
      'mobile': false,
      'uaFullVersion': '',
      'platform': '',
      'platformVersion': '',
      'architecture': '',
      'model': '',
    };
    const section = await openNetworkConditions('.network-config-ua');
    const autoCheckbox = await waitForAria('Use browser default', section);
    const uaDropdown = await waitFor('[aria-label="User agent"]', section);
    await assertChecked(autoCheckbox, true);
    await autoCheckbox.click();
    await assertChecked(autoCheckbox, false);

    await uaDropdown.click();
    await uaDropdown.select(fixedVersionUAValue);
    await uaDropdown.click();
    const fixedVersionUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(fixedVersionUserAgentMetadata, fixedVersionUserAgentMetadataExpected);

    await uaDropdown.click();
    await uaDropdown.select(dynamicVersionUAValue);
    await uaDropdown.click();
    const dynamicVersionUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(dynamicVersionUserAgentMetadata, dynamicVersionUserAgentMetadataExpected);

    await uaDropdown.click();
    await uaDropdown.select(noMetadataVersionUAValue);
    await uaDropdown.click();
    const noMetadataVersionUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(noMetadataVersionUserAgentMetadata, noMetadataVersionUserAgentMetadataExpected);
  });

  it('restores default userAgentMetadata', async () => {
    const {target, browser} = getBrowserAndPages();
    const fullVersion = (await browser.version()).split('/')[1];
    const customUAValue =
        `Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${
            fullVersion} Mobile Safari/537.36`;
    const section = await openNetworkConditions('.network-config-ua');
    const autoCheckbox = await waitForAria('Use browser default', section);
    const uaDropdown = await waitFor('[aria-label="User agent"]', section);
    await assertChecked(autoCheckbox, true);

    const defaultUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    await autoCheckbox.click();
    await assertChecked(autoCheckbox, false);

    await uaDropdown.click();
    await uaDropdown.select(customUAValue);
    await uaDropdown.click();
    const customUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.notDeepEqual(defaultUserAgentMetadata, customUserAgentMetadata);

    await autoCheckbox.click();
    await assertChecked(autoCheckbox, true);
    const restoredUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(defaultUserAgentMetadata, restoredUserAgentMetadata);
  });

  it('can apply customized userAgentMetadata', async () => {
    const {target} = getBrowserAndPages();
    const section = await openNetworkConditions('.network-config-ua');
    const autoCheckbox = await waitForAria('Use browser default', section);
    const uaDropdown = await waitFor('[aria-label="User agent"]', section);
    await assertChecked(autoCheckbox, true);

    await autoCheckbox.click();
    await assertChecked(autoCheckbox, false);

    // Choose "Custom..." UA, Move focus to UA string and enter test value
    await uaDropdown.select('custom');
    const userAgent = await waitFor('[aria-label="Enter a custom user agent"]');
    await userAgent.click();
    await userAgent.type('Test User Agent String');
    await tabForwardFrontend();  // focus help button
    await pressKey('Space');     // open client hints section
    await tabForwardFrontend();  // focus help link
    await tabForwardFrontend();  // focus brand name
    await typeText('Test Brand 1');
    await tabForwardFrontend();  // focus brand version
    await typeText('99');
    await tabForwardFrontend();  // focus delete brand button
    await tabForwardFrontend();  // focus add brand button
    await pressKey('Enter');     // add a second brand

    await typeText('Test Brand 2');
    await tabForwardFrontend();  // focus brand version
    await typeText('100');
    await tabForwardFrontend();  // focus delete brand button
    await tabForwardFrontend();  // focus add brand button
    await pressKey('Enter');     // add a third brand

    await typeText('Test Brand 3');
    await tabForwardFrontend();  // focus brand version
    await typeText('101');
    await tabForwardFrontend();  // focus delete brand button
    await tabForwardFrontend();  // focus add brand button
    await tabForwardFrontend();  // focus browser full version
    await typeText('99.99');
    await tabForwardFrontend();  // focus platform name
    await typeText('Test Platform');
    await tabForwardFrontend();  // focus platform version
    await typeText('10');
    await tabForwardFrontend();  // focus architecture
    await typeText('Test Architecture');
    await tabForwardFrontend();  // focus device model
    await typeText('Test Model');
    await tabForwardFrontend();  // focus mobile checkbox
    await pressKey('Space');
    await tabForwardFrontend();  // focus update button
    await pressKey('Enter');
    const userAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(userAgentMetadata, {
      'brands': [
        {'brand': 'Test Brand 1', 'version': '99'},
        {'brand': 'Test Brand 2', 'version': '100'},
        {'brand': 'Test Brand 3', 'version': '101'},
      ],
      'uaFullVersion': '99.99',
      'platform': 'Test Platform',
      'platformVersion': '10',
      'architecture': 'Test Architecture',
      'model': 'Test Model',
      'mobile': true,
    });

    // Delete a brand
    const brand = await waitFor('[aria-label="Brand"]', section);  // move focus back to first brand
    await brand.click();
    await tabForwardFrontend();  // focus brand version
    await tabForwardFrontend();  // focus delete brand button
    await pressKey('Enter');

    // Edit a value
    const platformVersion = await waitFor('[aria-label="Platform version"]', section);
    await platformVersion.click();
    await typeText('11');

    // Update
    await tabForwardFrontend();  // focus architecture
    await tabForwardFrontend();  // focus device model
    await tabForwardFrontend();  // focus mobile checkbox
    await tabForwardFrontend();  // focus update button
    await pressKey('Enter');
    const updatedUserAgentMetadata = await getUserAgentMetadataFromTarget(target);
    assert.deepEqual(updatedUserAgentMetadata, {
      'brands': [
        {'brand': 'Test Brand 2', 'version': '100'},
        {'brand': 'Test Brand 3', 'version': '101'},
      ],
      'uaFullVersion': '99.99',
      'platform': 'Test Platform',
      'platformVersion': '1011',
      'architecture': 'Test Architecture',
      'model': 'Test Model',
      'mobile': true,
    });
  });
});
