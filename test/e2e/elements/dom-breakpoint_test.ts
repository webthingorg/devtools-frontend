// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {retrieveAlertString} from '../helpers/accessibility-helpers.js';
import {expandSelectedNodeRecursively, waitForContentOfSelectedElementsNode, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const prepareElementsTab = async () => {
  await waitForElementsStyleSection();
  await waitForContentOfSelectedElementsNode('<body>\u200B');
  await expandSelectedNodeRecursively();
};

async function setSubtreeModificationBreakpoint() {
  const {frontend} = getBrowserAndPages();
  const selectedNode = await waitFor('.parent.selected');
  await click(selectedNode, {clickOptions: {button: 'right'}});

  // Navigate to "Break on" context menu option
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');
  await frontend.keyboard.press('ArrowDown');

  // Expand submenu
  await frontend.keyboard.press('ArrowRight');

  // Select "Break on" > "subtree modifications"
  await frontend.keyboard.press('Enter');
}

describe('DOM breakpoints in Elements tab', async function() {
  // This test relies on the context menu which takes a while to appear, so we bump the timeout a bit.
  this.timeout(50000);

  it('Setting DOM breakpoint triggers alert element', async () => {
    await goToResource('elements/adornment.html');
    await prepareElementsTab();
    await setSubtreeModificationBreakpoint();
    const alertString = await retrieveAlertString();
    assert.deepEqual(alertString, 'Breakpoint set: subtree modifications');
  });
});
