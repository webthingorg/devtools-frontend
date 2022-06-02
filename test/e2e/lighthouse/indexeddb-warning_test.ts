
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {waitFor, waitForElementWithTextContent} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('IndexedDB warning', async function() {
  it('displays when important data may affect performance', async () => {
    await navigateToLighthouseTab('lighthouse/lighthouse-basic.html');
    let panel = await waitFor('.lighthouse-start-view-fr');

    const warningText1 = await panel.$eval('.lighthouse-warning-text', node => node.textContent?.trim());
    assert.strictEqual(warningText1, '');

    await navigateToLighthouseTab('lighthouse/lighthouse-storage.html');
    panel = await waitFor('.lighthouse-start-view-fr');

    // Twiddle checkbox to trigger recomputePageAuditability
    await panel.$eval('[is=dt-checkbox]', elem => {
      // @ts-ignore ToolbarCheckbox type
      elem.checkboxElement.checked = false;
      // @ts-ignore ToolbarCheckbox type
      elem.checkboxElement.checked = true;
    });

    const expected =
        'There may be stored data affecting loading performance in this location: IndexedDB. Audit this page in an incognito window to prevent those resources from affecting your scores.';
    const warningElem = await waitForElementWithTextContent(expected, panel);

    const warningText2 = await warningElem.evaluate(node => node.textContent?.trim());
    assert.strictEqual(warningText2, expected);
  });
});
