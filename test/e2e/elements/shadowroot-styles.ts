// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, getBrowserAndPages, resetPages, resourcesPath, timeout, waitFor, waitForFunction} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode} from '../helpers/elements-helpers.js';

describe('The Elements Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('can show styles in shadow roots', async () => {
    const {target, frontend} = getBrowserAndPages();

    await target.goto(`${resourcesPath}/elements/shadow-roots.html`);

    // Wait for the file to be loaded and selectors to be shown
    await waitFor('.styles-selector');

    // Sanity check to make sure we have the correct node selected after opening a file
    await assertContentOfSelectedElementsNode('<body>\u200B');

    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('<div id=\u200B"host">\u200B…\u200B</div>\u200B');

    // Open the div (shows new nodes, but does not alter the selected node)
    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('<div id=\u200B"host">\u200B');

    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('#shadow-root (open)');

    // Open the shadow root (shows new nodes, but does not alter the selected node)
    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('#shadow-root (open)');

    // Wait for the shadow root to be uncollapsed in the panel
    // TODO(tvanderlippe): Is there a better way for waiting on the shadow root being uncollapsed?
    await timeout(50);

    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('<style>\u200B .red { color: red; } \u200B</style>\u200B');

    await frontend.keyboard.press('ArrowDown');
    await assertContentOfSelectedElementsNode('<div id=\u200B"inner" class=\u200B"red">\u200Bhi!\u200B</div>\u200B');

    await waitForFunction('Unable to find 3 style sections on page', async () => {
      const result = await $$('.styles-section');
      const numFound = await result.evaluate(array => array.length);

      return numFound === 3;
    });

    const selectorTexts =
        await (await $$('.styles-section')).evaluate((nodes: Element[]) => nodes.map(node => node.textContent));

    assert.deepEqual(selectorTexts, [
      'element.style {}',
      '<style>.red {}',
      'user agent stylesheetdiv {}',
    ]);
  });
});
