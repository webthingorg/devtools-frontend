// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {waitFor, getBrowserAndPages} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('IndexedDB warning', async function() {
  it('displays when important data may affect performance', async () => {
    {
      const {frontend} =  getBrowserAndPages();
      const warningElem = await frontend.$('.lighthouse-warning-text');
      if (warningElem) {
        const [text,classlist] = await warningElem.evaluate(node => [node.textContent?.trim(), node.classList]);
        console.log('ok', classlist, text);
      }
    }
    await navigateToLighthouseTab('empty.html');
    {
      const {frontend} =  getBrowserAndPages();
      const warningElem = await frontend.$('.lighthouse-warning-text');
      if (warningElem) {
        const [text,classlist] = await warningElem.evaluate(node => [node.textContent?.trim(), node.classList]);
        console.log('ok2', classlist, text);
      }
    }
    let warningElem = await waitFor('.lighthouse-warning-text.hidden');
    const warningText1 = await warningElem.evaluate(node => node.textContent?.trim());
    assert.strictEqual(warningText1, '');

    {
      const {frontend} =  getBrowserAndPages();
      const warningElem = await frontend.$('.lighthouse-warning-text');
      if (warningElem) {
        const [text,classlist] = await warningElem.evaluate(node => [node.textContent?.trim(), node.classList]);
        console.log('ok3', classlist, text);
      }
    }

    await navigateToLighthouseTab('lighthouse/lighthouse-storage.html');

    {
      const {frontend} =  getBrowserAndPages();
      const warningElem = await frontend.$('.lighthouse-warning-text');
      if (warningElem) {
        const [text,classlist] = await warningElem.evaluate(node => [node.textContent?.trim(), node.classList]);
        console.log('o4', classlist, text);
      }
    }
    warningElem = await waitFor('.lighthouse-warning-text:not(.hidden)');
        {
      const {frontend} =  getBrowserAndPages();
      const warningElem = await frontend.$('.lighthouse-warning-text');
      if (warningElem) {
        const [text,classlist] = await warningElem.evaluate(node => [node.textContent?.trim(), node.classList]);
        console.log('ok5', classlist, text);
      }
    }
    const expected =
        'There may be stored data affecting loading performance in this location: IndexedDB. Audit this page in an incognito window to prevent those resources from affecting your scores.';
    const warningText2 = await warningElem.evaluate(node => node.textContent?.trim());
    assert.strictEqual(warningText2, expected);

    // await new Promise(() => {});
  });
});
