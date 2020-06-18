// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {Page} from 'puppeteer';

import {getBrowserAndPages, goToResource} from '../../shared/helper.js';
import {focusElementsTree, getAllPropertiesFromComputedPane, getContentOfComputedPane, navigateToSidePane, waitForComputedPaneChange, waitForElementsComputedSection} from '../helpers/elements-helpers.js';

describe('The Computed pane', async () => {
  // The test cases here are very similar, a node gets selected, and some styles in the computed pane are asserted.
  // This is why they are listed in an array below, so that we don't have to repeat the testing logic every time.
  // Also, this makes sure only one node is tested per test case, which keeps the tests running fast and avoiding
  // timeouts.
  const TESTS = [
    {
      description: 'can display a simple color property value',
      resource: 'elements/simple-styled-page.html',
      selectNode: async (frontend: Page) => {
        // Select the H1 element by pressing down once.
        await frontend.keyboard.press('ArrowDown');
      },
      expectedPropertyCount: 10,
      assertProperties: [{
        name: 'color',
        value: 'rgb(255, 0, 102)',
      }],
    },
    {
      description: 'can display a simple background-color property value',
      resource: 'elements/simple-styled-page.html',
      selectNode: async (frontend: Page) => {
        // Select the H2 element by pressing down twice.
        await frontend.keyboard.press('ArrowDown');
        await frontend.keyboard.press('ArrowDown');
      },
      expectedPropertyCount: 11,
      assertProperties: [{
        name: 'background-color',
        value: 'rgb(255, 215, 0)',
      }],
    },
  ];

  for (const {description, resource, selectNode, expectedPropertyCount, assertProperties} of TESTS) {
    it(description, async () => {
      const {frontend} = getBrowserAndPages();

      await goToResource(resource);
      await navigateToSidePane('Computed');
      await waitForElementsComputedSection();

      // Note that navigating to the computed pane moved focus away from the elements pane. Restore it.
      await focusElementsTree();

      const content = await getContentOfComputedPane();
      await selectNode(frontend);
      await waitForComputedPaneChange(content);

      const properties = await getAllPropertiesFromComputedPane();
      assert.strictEqual(properties.length, expectedPropertyCount, 'The right number of properties was found');

      for (const {name, value} of assertProperties) {
        const property = properties.find(property => property && property.name === name);
        assert.isTrue(!!property, `The element has the ${name} computed property`);
        assert.strictEqual(property && property.value, value, `The property has the right value: ${value}`);
      }
    });
  }
});
