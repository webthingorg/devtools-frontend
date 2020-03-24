// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, obtainDisplayedCSSPropertyValuesForSelectedNode, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const FIRST_PROPERTY_NAME_SELECTOR = '.tree-outline li:nth-of-type(1) > .webkit-css-property';
const SECOND_PROPERTY_VALUE_SELECTOR = '.tree-outline li:nth-of-type(2) > .value';

const deletePropertyByBackspace = async (selector: string) => {
  const {frontend} = getBrowserAndPages();
  await click(selector);
  await frontend.keyboard.press('Backspace');
  await frontend.keyboard.press('Enter');
};

describe('The Elements Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('can remove a CSS property when its name or value is deleted', async () => {
    const {target, frontend} = getBrowserAndPages();

    await target.goto(`${resourcesPath}/elements/style-pane-properties.html`);
    await click('#tab-elements');

    // Sanity check to make sure we have the correct node selected after opening a file
    await assertContentOfSelectedElementsNode('<body>\u200B');

    // Select div that we will remove the CSS properties from
    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('<div id=\u200B"properties-to-delete">\u200B</div>\u200B');
    await waitForElementsStyleSection();
    {
      const displayedValues = await obtainDisplayedCSSPropertyValuesForSelectedNode();
      assert.deepEqual(
          displayedValues,
          [
            '10px',
            '20px',
            'block',
          ],
          'incorrectly displayed style after initialization');
    }

    // select second property's value and delete
    await deletePropertyByBackspace(SECOND_PROPERTY_VALUE_SELECTOR);
    await waitForElementsStyleSection();

    // verify the second CSS property entry has been removed
    {
      const displayedValues = await obtainDisplayedCSSPropertyValuesForSelectedNode();
      assert.deepEqual(
          displayedValues,
          [
            '10px',
            'block',
          ],
          'incorrectly displayed style after removing second property\'s value');
    }

    // select first property's name and delete
    await deletePropertyByBackspace(FIRST_PROPERTY_NAME_SELECTOR);
    await waitForElementsStyleSection();

    // verify the first CSS property entry has been removed
    {
      await waitForElementsStyleSection();
      const displayedValues = await obtainDisplayedCSSPropertyValuesForSelectedNode();
      assert.deepEqual(
          displayedValues,
          [
            'block',
          ],
          'incorrectly displayed style after removing first property\'s name');
    }
  });
});
