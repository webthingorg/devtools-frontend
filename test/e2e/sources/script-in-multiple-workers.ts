// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {click, getBrowserAndPages, resetPages, resourcesPath, $, waitFor} from '../../shared/helper.js';

import {doubleClickSourceTreeItem, addBreakpointForLine} from '../helpers/sources-helpers.js';

const WORKER_SELECTORS = createSelectorsForFile('multi-workers.js', 1);
const WORKER2_SELECTORS = createSelectorsForFile('multi-workers.js', 2);
const WORKER3_SELECTORS = createSelectorsForFile('multi-workers.js', 3);
const WORKER4_SELECTORS = createSelectorsForFile('multi-workers.js', 4);

type NestedFileSelector = {
  rootSelector: string,
  domainSelector: string,
  folderSelector: string,
  fileSelector: string,
};

function createSelectorsForFile(fileName: string, workerIndex: number): NestedFileSelector {
  const rootSelector = new Array(workerIndex).fill(`[aria-label="${fileName}, worker"]`).join(' ~ ');
  const domainSelector = `${rootSelector} + ol > [aria-label="localhost:8090, domain"]`;
  const folderSelector = `${domainSelector} + ol > [aria-label="test/e2e/resources/sources, nw-folder"]`;
  const fileSelector = `${folderSelector} + ol > [aria-label="${fileName}, file"]`;

  return {
    rootSelector,
    domainSelector,
    folderSelector,
    fileSelector,
  };
}

async function openNestedWorkerFile(selectors: NestedFileSelector) {
  await doubleClickSourceTreeItem(selectors.rootSelector);
  await doubleClickSourceTreeItem(selectors.domainSelector);
  await doubleClickSourceTreeItem(selectors.folderSelector);
  await waitFor(selectors.fileSelector);
  await click(selectors.fileSelector);
}

async function validateNavigationTree() {
  const workers = new Array(10).fill('[aria-label="multi-workers.js, worker"]');
  // Create a selector for 10 workers that are siblings.
  await waitFor(workers.join(' ~ '));
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

async function typeIntoConsole(frontend: puppeteer.Page, console: puppeteer.ElementHandle, message: string) {
  await console.type(message);

  // Wait for autocomplete text to catch up.
  const line = (await console.$('.CodeMirror-activeline'))!.asElement()!;
  const autocomplete = (await line.$('.auto-complete-text'))!.asElement()!;
  await frontend.waitFor(
      (msg, ln, ac) => ln.textContent === msg && ac.textContent === '',
      undefined, message, line, autocomplete);

  await console.press('Enter');
}

async function validateBreakpoints(frontend: puppeteer.Page) {
  const bps = await frontend.$$eval('.cm-breakpoint .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(bps, ['6', '10']);
  const disabled = await frontend.$$eval('.cm-breakpoint-disabled .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(disabled, ['6']);
}

async function validateBreakpointsWithoutDisabled(frontend: puppeteer.Page) {
  // Currently breakpoints do not get copied to workers if they are disabled.
  // This behavior is enforced by a web test, which this test will replace.
  // TODO(leese): Once breakpoint copying issue is fixed, remove this function.
  const bps = await frontend.$$eval('.cm-breakpoint .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(bps, ['10']);
  const disabled = await frontend.$$eval('.cm-breakpoint-disabled .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(disabled, []);
}

describe('Multi-Workers', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('loads scripts exactly once on reload', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/sources/multi-workers.html`);

    await click('#tab-sources');
    await validateNavigationTree();
    await openNestedWorkerFile(WORKER_SELECTORS);

    // Look at source tabs
    await validateSourceTabs(frontend);

    // Reload page
    await target.goto(`${resourcesPath}/sources/multi-workers.html`);

    // Check workers again
    await validateNavigationTree();

    // Look at source tabs again
    await validateSourceTabs(frontend);
  });

  // TODO(leese): Enable once chromium:670180 is fixed.
  it.skip('loads scripts exactly once on break', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/sources/multi-workers.html`);

    await click('#tab-sources');

    await validateNavigationTree();

    // Open console tab
    await click('#tab-console');

    {
      // Send message to a worker by evaluating in the console
      const console = await frontend.waitForSelector('#console-prompt');
      await typeIntoConsole(frontend, console, 'workers[3].postMessage({});');

      // Should automatically switch to sources tab.

      // Validate that we are paused
      const pauseButton = (await waitFor('[aria-label="Pause script execution"][aria-pressed="true"]'))!.asElement();
      if (!pauseButton) {
        assert.fail('Could not find pause/resume button');
        return;
      }

      // Look at source tabs
      await validateSourceTabs(frontend);

      // Continue
      await pauseButton.click();
      // Verify that we have continued.
      await waitFor('[aria-label="Pause script execution"][aria-pressed="false"]');
    }

    await click('#tab-console');
    const console = await frontend.waitForSelector('#console-prompt');

    // Switch back to top execution context
    const dropdown = (await $('[aria-label^="JavaScript context:"]')).asElement();
    if (!dropdown) {
      assert.fail('Unable to locate dropdown');
      return;
    }
    await dropdown.press('Space');
    await frontend.keyboard.press('Home');
    await frontend.keyboard.press('Space');

    // Send message to a different worker
    await console.click();
    await typeIntoConsole(frontend, console, 'workers[7].postMessage({});');

    // Validate that we are paused
    await waitFor('[aria-label="Pause script execution"][aria-pressed="true"]');

    // Look at source tabs
    await validateSourceTabs(frontend);
  });

  it('copies breakpoints between workers', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/sources/multi-workers.html`);

    await click('#tab-sources');
    // Wait for all workers to load
    await validateNavigationTree();
    // Open file from second worker
    await openNestedWorkerFile(WORKER2_SELECTORS);
    // Set two breakpoints
    await addBreakpointForLine(frontend, 6);
    // Disable first breakpoint
    const bpEntry = await waitFor('.breakpoint-entry');
    const bpCheckbox = await waitFor('input', bpEntry);
    if (!bpCheckbox) {
      assert.fail('Could not find checkbox to disable breakpoint');
      return;
    }
    await bpCheckbox.evaluate(n => (n as HTMLElement).click());
    await frontend.waitFor('.cm-breakpoint-disabled');
    // Add another breakpoint
    await addBreakpointForLine(frontend, 10);

    // Check breakpoints
    await validateBreakpoints(frontend);

    // Close tab
    await click('[aria-label="Close multi-workers.js"]');

    // Open different worker
    await openNestedWorkerFile(WORKER3_SELECTORS);

    // Check breakpoints
    await validateBreakpointsWithoutDisabled(frontend);

    // Close tab
    await click('[aria-label="Close multi-workers.js"]');

    // Reload
    await target.goto(`${resourcesPath}/sources/multi-workers.html`);

    // Open different worker
    await openNestedWorkerFile(WORKER4_SELECTORS);

    // Check breakpoints
    await validateBreakpointsWithoutDisabled(frontend);
  });
});
