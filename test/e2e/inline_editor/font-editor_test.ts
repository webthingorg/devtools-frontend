// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {enableExperiment, getBrowserAndPages, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getFontEditorButtons, getHiddenFontEditorButtons, waitForContentOfSelectedElementsNode, waitForCSSPropertyValue} from '../helpers/elements-helpers.js';


async function goToTestPageAndSelectTestElement(path: string = 'inline_editor/fontEditor.html') {
  const {frontend} = getBrowserAndPages();

  await goToResource(path);
  await waitForContentOfSelectedElementsNode('<body>\u200B');

  await frontend.keyboard.press('ArrowDown');
  await waitForContentOfSelectedElementsNode(
      '<div id=\u200B"inspected" class=\u200B"test-inspected test-inspected2 test-inspected3">\u200BInspected div\u200B</div>\u200B');
}

async function openFontEditor(index: number) {
  const fontEditorButtons = await getFontEditorButtons();
  const fontEditorButton = fontEditorButtons[index];
  assert.exists(fontEditorButton);
  await fontEditorButtons[index].click();
  await waitFor('.font-selector-section');
}

describe('The font editor', async function() {
  beforeEach(async function() {
    await enableExperiment('fontEditor');
    await goToTestPageAndSelectTestElement();
    await waitForCSSPropertyValue('#inspected', 'color', 'red');
  });

  it('icon is displayed for sections containing font properties', async () => {
    const fontEditorButtons = await getFontEditorButtons();
    const hiddenFontEditorButtons = await getHiddenFontEditorButtons();
    assert.deepEqual(fontEditorButtons.length, 5);
    assert.deepEqual(hiddenFontEditorButtons.length, 2);
  });

  it('opens when button is clicked', async () => {
    await openFontEditor(0);
  });

  it('applies changes to the styles section', async () => {
    const {frontend} = getBrowserAndPages();
    await openFontEditor(0);
    const fontFamilySelector = await waitFor('[aria-label="Font Family"]');
    fontFamilySelector.focus();
    frontend.keyboard.press('Enter');
    frontend.keyboard.press('ArrowDown');
    frontend.keyboard.press('Enter');
    await waitForCSSPropertyValue('element.style', 'font-family', 'Times New Roman');
  });

  it('is properly converting units and applies changes to the styles section', async () => {
    const {frontend} = getBrowserAndPages();
    await openFontEditor(4);
    const fontSizeUnitInput = await waitFor('[aria-label="font-size Unit Input"]');
    fontSizeUnitInput.focus();
    frontend.keyboard.press('Enter');
    frontend.keyboard.press('ArrowDown');
    frontend.keyboard.press('Enter');
    await waitForCSSPropertyValue('.test-inspected', 'font-size', '0.6em');
  });
});
