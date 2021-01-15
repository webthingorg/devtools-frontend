// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$, $$, click, enableExperiment, getBrowserAndPages, goToResource, step, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {checkIfTabExistsInDrawer, DRAWER_PANEL_SELECTOR} from '../helpers/cross-tool-helper.js';
import {addBreakpointForLine, clickOnContextMenu, openSourceCodeEditorForFile, PAUSE_BUTTON, RESUME_BUTTON, waitForSourceCodeLines} from '../helpers/sources-helpers.js';

const LINEAR_MEMORY_INSPECTOR_TAB_SELECTOR = '#tab-linear-memory-inspector';
const LINEAR_MEMORY_INSPECTOR_TABBED_PANE_SELECTOR = DRAWER_PANEL_SELECTOR + ' .tabbed-pane';
const LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR = '.tabbed-pane-header-tab';
const LINEAR_MEMORY_INSPECTOR_TAB_TITLE_SELECTOR = '.tabbed-pane-header-tab-title';

describe('Scope View', async () => {
  // Flaky on the Mac CQ bot.
  it.skip('[crbug.com/1166106] opens linear memory inspector', async () => {
    await enableExperiment('wasmDWARFDebugging');

    const {frontend, target} = getBrowserAndPages();
    const breakpointLine = 5;
    const numberOfLines = 7;

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('memory.wasm', 'wasm/memory.html');
    });

    await step(`add a breakpoint to line No.${breakpointLine}`, async () => {
      await addBreakpointForLine(frontend, breakpointLine);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitForSourceCodeLines(numberOfLines);
    });

    await step('expand the module scope', async () => {
      await click('[aria-label="Module"]');
    });

    await step('expand the memories list', async () => {
      await click('[data-object-property-name-for-test="memories"]');
    });

    await step('open linear memory inspector from context menu', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="$imports.memory"]', 'Inspect memory');
    });

    await step('check that linear memory inspector drawer is open', async () => {
      const drawerIsOpen = await checkIfTabExistsInDrawer(LINEAR_MEMORY_INSPECTOR_TAB_SELECTOR);
      assert.isTrue(drawerIsOpen);
    });

    await step('check that opened linear memory inspector has correct title', async () => {
      const lmiTabbedPane = await waitFor(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_SELECTOR);
      const titleElement = await $(LINEAR_MEMORY_INSPECTOR_TAB_TITLE_SELECTOR, lmiTabbedPane);
      assert.isNotNull(titleElement);
      const title = await frontend.evaluate(x => x.innerText, titleElement);

      assert.strictEqual(title, 'memory.wasm');
    });
  });

  it('opens one linear memory inspector per ArrayBuffer', async () => {
    await enableExperiment('wasmDWARFDebugging');

    const {frontend} = getBrowserAndPages();

    await step('navigate to a page', async () => {
      await goToResource('sources/memory-workers.html');
    });

    await step('wait for debugging to start', async () => {
      await waitFor(RESUME_BUTTON);
    });

    await step('open linear memory inspector from context menu', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="sharedMem"]', 'Inspect memory');
    });

    await step('check that linear memory inspector drawer is open', async () => {
      const drawerIsOpen = await checkIfTabExistsInDrawer(LINEAR_MEMORY_INSPECTOR_TAB_SELECTOR);
      assert.isTrue(drawerIsOpen);
    });

    const lmiTabbedPane = await waitFor(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_SELECTOR);
    await step('check that opened linear memory inspector has correct title', async () => {
      const titleElement = await $(LINEAR_MEMORY_INSPECTOR_TAB_TITLE_SELECTOR, lmiTabbedPane);
      assert.isNotNull(titleElement);
      const title = await frontend.evaluate(x => x.innerText, titleElement);

      assert.strictEqual(title, 'memory-worker2.js');
    });

    // Save this as we will select it multiple times
    const sharedBufferTab = await $(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR, lmiTabbedPane);
    if (!sharedBufferTab) {
      // Throw here to satisfy TypeScript
      throw new Error('Failed to get tab');
    }

    await step('open other buffer', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="memory2"]', 'Inspect memory');
      // Wait until two tabs are open
      await waitFor(
          LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR + ' + ' + LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR,
          lmiTabbedPane);
      // Shared buffer tab no longer active
      await waitFor('[aria-selected="false"]', sharedBufferTab);
    });

    await step('open first buffer again by way of its typed array', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="sharedArray"]', 'Inspect memory');
      // Shared buffer should be selected again
      await waitFor('[aria-selected="true"]', sharedBufferTab);
      // There should only be two tabs
      const tabs = await $$(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR, lmiTabbedPane);
      assert.strictEqual(tabs.length, 2);
    });

    await step('switch to other worker', async () => {
      const elements = await $$('.thread-item-title');
      const workerNames = await Promise.all(elements.map(x => x.evaluate(y => y.textContent)));
      const workerIndex = 1 + workerNames.indexOf('memory-worker1.js');
      // Click on worker
      await click(`.thread-item[aria-posinset="${workerIndex}"]`);
      // Pause the worker
      await click(PAUSE_BUTTON);
      // Wait for it to be paused
      await waitFor(RESUME_BUTTON);
    });

    await step('open other buffer in other worker', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="memory1"]', 'Inspect memory');
      // Shared buffer tab no longer active
      await waitFor('[aria-selected="false"]', sharedBufferTab);
      // Now there are three tabs
      const tabs = await $$(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR, lmiTabbedPane);
      assert.strictEqual(tabs.length, 3);
    });

    await step('open shared buffer in other worker', async () => {
      await clickOnContextMenu('[data-object-property-name-for-test="sharedArr"]', 'Inspect memory');
      // Shared buffer tab active again
      await waitFor('[aria-selected="true"]', sharedBufferTab);
      // Still three tabs
      const tabs = await $$(LINEAR_MEMORY_INSPECTOR_TABBED_PANE_TAB_SELECTOR, lmiTabbedPane);
      assert.strictEqual(tabs.length, 3);
    });
  });
});
