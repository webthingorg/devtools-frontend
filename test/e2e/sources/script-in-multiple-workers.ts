// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {getBrowserAndPages, getElementPosition, resetPages, resourcesPath, $} from '../../shared/helper.js';

describe('Multi-Workers', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  async function openSourcesTab(frontend: puppeteer.Page) {
    // Locate the button for switching to the sources tab.
    const sourcesTabButtonLocation = await getElementPosition('#tab-sources');
    if (!sourcesTabButtonLocation) {
      assert.fail('Unable to locate sources tab button.');
    }

    // Click on the button and wait for the sources to load. The reason we use this method
    // rather than elementHandle.click() is because the frontend attaches the behavior to
    // a 'mousedown' event (not the 'click' event). To avoid attaching the test behavior
    // to a specific event we instead locate the button in question and ask Puppeteer to
    // click on it instead.
    await frontend.mouse.click(sourcesTabButtonLocation.x, sourcesTabButtonLocation.y);
  }

  async function openConsoleTab(frontend: puppeteer.Page) {
    // Locate the button for switching to the console tab.
    const consoleTabButtonLocation = await getElementPosition('#tab-console');
    if (!consoleTabButtonLocation) {
      assert.fail('Unable to locate console tab button.');
    }

    await frontend.mouse.click(consoleTabButtonLocation.x, consoleTabButtonLocation.y);
  }

  async function validateNavigationTree(frontend: puppeteer.Page) {
    // Verifies all workers appear in tree, returns tree.
    const pane = await frontend.waitForSelector('.navigator-tabbed-pane div[aria-label="Page panel"] div.vbox');
    const tree = (await $('.tree-outline', pane)).asElement()!;
    // Check that all 10 workers have appeared
    const workers = await tree.$$eval('.navigator-worker-tree-item span.tree-element-title', nodes => nodes.map(n => n.innerHTML));
    const expectedWorkers = new Array(10).fill('multi-workers.js');
    assert.deepEqual(workers, expectedWorkers);
    return tree;
  }

  async function validateSourceTabs(frontend: puppeteer.Page) {
    // Verifies there is exactly one source open.
    const sourceTabPane = await frontend.waitForSelector('#sources-panel-sources-view .tabbed-pane');
    const sourceTabs = (await $('.tabbed-pane-header-tabs', sourceTabPane)).asElement();
    if (!sourceTabs) {
      assert.fail('Unable to locate source tabs');
      return;
    }
    const openSources = await sourceTabs.$$eval('.tabbed-pane-header-tab', nodes => nodes.map(n => n.getAttribute('aria-label')));
    assert.deepEqual(openSources, ['multi-workers.js']);
  }

  it('loads scripts exactly once on reload', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/pages/multi-workers.html`);

    await openSourcesTab(frontend);

    const tree = await validateNavigationTree(frontend);

    // Navigate down to one of the workers
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    // Expand worker
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    // Expand domain
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    // Expand folder
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    // Open script
    await tree.press('Enter');

    // Look at source tabs
    await validateSourceTabs(frontend);

    // Reload page
    await target.goto(`${resourcesPath}/pages/multi-workers.html`);

    // Check workers again
    await validateNavigationTree(frontend);

    // Look at source tabs again
    await validateSourceTabs(frontend);
  });

  it('loads scripts exactly once on break', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/pages/multi-workers.html`);

    await openSourcesTab(frontend);

    await validateNavigationTree(frontend);

    // Open console tab
    await openConsoleTab(frontend);

    {
      // Send message to a worker by evaluating in the console
      const console = await frontend.waitForSelector('.console-prompt-editor-container');
      await console.type('workers[3].postMessage({});\n');// workers[4].postMessage({}); workers[5].postMessage({});\n');

      // Should automatically switch to sources tab.

      // Validate that we are paused
      await frontend.waitForSelector('.paused-message');
      const toolbar = await frontend.waitForSelector('.scripts-debug-toolbar');

      // Look at source tabs
      await validateSourceTabs(frontend);

      // Continue
      await toolbar.press('F8');
    }

    await openConsoleTab(frontend);
    const console = await frontend.waitForSelector('.console-prompt-editor-container');

    // Switch back to top execution context
    const consoleToolbar = await frontend.waitForSelector('.console-main-toolbar');
    const dropdown = (await $('[aria-label^="JavaScript context:"]', consoleToolbar)).asElement();
    if (!dropdown) {
      assert.fail('Unable to locate dropdown');
      return;
    }
    await dropdown.press('Space');
    await frontend.keyboard.press('Home');//dropdown.press('Home');
    await frontend.keyboard.press('Space');//dropdown.press('Space');

    // Send message to a different worker
    await console.click();
    await console.type('workers[7].postMessage({});\n');

    // Validate that we are paused
    await frontend.waitForSelector('.paused-message');

    // Look at source tabs
    await validateSourceTabs(frontend);
  });
});
