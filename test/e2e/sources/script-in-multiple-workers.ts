// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, getElementPosition, resetPages, resourcesPath, $} from '../helper.js';

describe('Multi-Workers', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('loads scripts exactly once', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/pages/multi-workers.html`);

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

    let pane = await frontend.waitForSelector('.navigator-tabbed-pane div[aria-label="Page panel"] div.vbox');
    let tree = (await $('.tree-outline', pane)).asElement();
    // Check that all 10 workers have appeared
    let workers = await tree.$$eval('.navigator-worker-tree-item span.tree-element-title', nodes => nodes.map(n => n.innerHTML));
    assert.sameMembers(workers, ["multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js"]);

    // Navigate down to a worker and open the script
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowDown');
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    await tree.press('ArrowRight');
    await tree.press('ArrowDown');
    await tree.press('Enter');

    // Look at source tabs
    let sourceTabPane = await frontend.waitForSelector('#sources-panel-sources-view .tabbed-pane');
    let sourceTabs = (await $('.tabbed-pane-header-tabs', sourceTabPane)).asElement();
    let openSources = await sourceTabs.$$eval('.tabbed-pane-header-tab', nodes => nodes.map(n => n.getAttribute('aria-label')));
    assert.sameMembers(openSources, ['multi-workers.js']);

    // Reload page
    await target.goto(`${resourcesPath}/pages/multi-workers.html`);

    // Check workers again
    pane = await frontend.waitForSelector('.navigator-tabbed-pane div[aria-label="Page panel"] div.vbox');
    tree = (await $('.tree-outline', pane)).asElement();
    workers = await tree.$$eval('.navigator-worker-tree-item span.tree-element-title', nodes => nodes.map(n => n.innerHTML));
    assert.sameMembers(workers, ["multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js", "multi-workers.js"]);

    // Look at source tabs again
    sourceTabPane = await frontend.waitForSelector('#sources-panel-sources-view .tabbed-pane');
    sourceTabs = (await $('.tabbed-pane-header-tabs', sourceTabPane)).asElement();
    openSources = await sourceTabs.$$eval('.tabbed-pane-header-tab', nodes => nodes.map(n => n.getAttribute('aria-label')));
    assert.sameMembers(openSources, ['multi-workers.js']);
  });
});
