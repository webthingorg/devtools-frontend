// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, click, getBrowserAndPages, getElementPosition, resetPages, timeout, waitFor} from '../../shared/helper.js';

describe('Rendering pane', () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('includes UI for simulating vision deficiencies', async () => {
    const {frontend} = getBrowserAndPages();

    // TODO(mathias): Extract this into an `openPanelViaMoreTools` helper.
    const moreToolsSelector = '[aria-label="More tools"]';
    const contextMenuItemSelector = '.soft-context-menu-item[aria-label="Rendering"]';
    const renderingPanelSelector = '.view-container[aria-label="Rendering panel"]';

    // Head to the triple dot menu.
    await click('.toolbar-button[aria-label="Customize and control DevTools"]');

    // Hover over the "More Tools" option.
    const moreTools = await getElementPosition(moreToolsSelector);
    await frontend.mouse.move(moreTools.x, moreTools.y);

    // The menu is set to appear after 150ms, so wait here. The menu itself does
    // not have a particular selector onto which we can attach, hence the timeout.
    await timeout(200);

    // Choose the Rendering pane and wait for it.
    await click(contextMenuItemSelector);
    await waitFor(renderingPanelSelector);

    const option = await $('option[value="achromatopsia"]');
    const actual = await option.evaluate(node => {
      const select = node.closest('select');
      return select.textContent;
    });
    const expected = [
      'No emulation',
      'Blurred vision',
      'Protanopia',
      'Deuteranopia',
      'Tritanopia',
      'Achromatopsia',
    ].join('');
    assert.deepEqual(actual, expected);
  });
});
