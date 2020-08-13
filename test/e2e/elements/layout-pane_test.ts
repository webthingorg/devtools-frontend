// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, click, enableExperiment, goToResource, step, waitFor} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, expandSelectedNodeRecursively, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const MORE_TABS_SELECTOR = '[aria-label="More tabs"]';
const LAYOUT_SELECTOR = '[aria-label="Layout"]';
const INACTIVE_GRID_ADORNER_SELECTOR = '[aria-label="Enable grid mode"]';
const ACTIVE_GRID_ADORNER_SELECTOR = '[aria-label="Disable grid mode"]';

const getNodeContent = (node: Element) => node.textContent;

describe('Layout Pane in the Elements Tab', async function() {
  it('displays Layout pane', async () => {
    await enableExperiment('cssGridFeatures');
    await goToResource('elements/css-grid.html');

    await step('Prepare elements tab', async () => {
      await waitForElementsStyleSection();
      await assertContentOfSelectedElementsNode('<body>\u200B');
      await expandSelectedNodeRecursively();
    });

    await step('Check adorners before modifying overlays via Layout pane', async () => {
      const inactiveGridAdorners = await $$(INACTIVE_GRID_ADORNER_SELECTOR);
      const inactiveContent = await Promise.all(inactiveGridAdorners.map(n => n.evaluate(getNodeContent)));
      assert.deepEqual(
          inactiveContent,
          [
            'grid',
          ],
          'did not have exactly 1 Grid adorner in the inactive state');
    });

    await step('Open Layout pane', async () => {
      await waitFor(MORE_TABS_SELECTOR);
      await click(MORE_TABS_SELECTOR);
      await waitFor(LAYOUT_SELECTOR);
      await click(LAYOUT_SELECTOR);
    });

    await step('Click grid element in Layout pane', async () => {
      await waitFor('.elements input[type=checkbox]');
      await click('.elements input[type=checkbox]');
    });

    await step('Check adorners after modifying overlays via Layout pane', async () => {
      const activeGridAdorners = await $$(ACTIVE_GRID_ADORNER_SELECTOR);
      const activeContent = await Promise.all(activeGridAdorners.map(n => n.evaluate(getNodeContent)));
      assert.deepEqual(
          activeContent,
          [
            'grid',
          ],
          'did not have exactly 1 Grid adorner in the active state');
    });
  });
});
