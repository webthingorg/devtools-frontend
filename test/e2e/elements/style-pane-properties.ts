// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, obtainDisplayedValuesForCurrentlySelectedNode, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const SECOND_PROPERTY_TO_REMOVE_SELECTOR = '.tree-outline li:nth-of-type(2) > .value';

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

    let displayedValues = await obtainDisplayedValuesForCurrentlySelectedNode();
    assert.equal(displayedValues.length, 3, 'incorrect number of displayed styles');

    // select second style's value and delete
    await click(SECOND_PROPERTY_TO_REMOVE_SELECTOR);
    await frontend.keyboard.press('Backspace');
    await frontend.keyboard.press('Enter');
    await waitForElementsStyleSection();

    // verify the second CSS property entry has been removed
    displayedValues = await obtainDisplayedValuesForCurrentlySelectedNode();
    assert.equal(displayedValues.length, 2, 'incorrect number of displayed styles');
  });
});
