// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {clickNthChildOfSelectedElementNode, focusElementsTree, getCSSPropertyInRule, waitForContentOfSelectedElementsNode, waitForCSSPropertyValue} from '../helpers/elements-helpers.js';

describe('Grid Editor', async function() {
  beforeEach(async function() {
    await goToResource('elements/grid-editor.html');
    await waitForContentOfSelectedElementsNode('<body>\u200B');
    await focusElementsTree();
    await clickNthChildOfSelectedElementNode(1);
    await waitForCSSPropertyValue('#target', 'display', 'grid');
  });

  async function clickStylePropertyEditorButton() {
    const gridEditorButtons = await $$('[title="Open grid editor"]');
    assert.deepEqual(gridEditorButtons.length, 1);
    const gridEditorButton = gridEditorButtons[0];
    gridEditorButton.click();
    await waitFor('devtools-grid-editor');
  }

  async function clickFlexEditButton(selector: string) {
    await waitFor(selector);
    const buttons = await $$(selector);
    assert.strictEqual(buttons.length, 1);
    const button = buttons[0];
    button.click();
  }

  it('can be opened and grid styles can be edited', async () => {
    await clickStylePropertyEditorButton();

    // Clicking once sets the value.
    await clickFlexEditButton('[title="Add align-items: start"]');
    await waitForCSSPropertyValue('#target', 'align-items', 'start');

    // Clicking again removes the value.
    await clickFlexEditButton('[title="Remove align-items: start"]');
    // Wait for the button's title to be updated so that we know the change
    // was made.
    await waitFor('[title="Add align-items: start"]');
    const property = await getCSSPropertyInRule('#target', 'align-items');
    assert.isUndefined(property);
  });
});
