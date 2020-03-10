// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$, click, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';
import {focusConsolePrompt, switchToTopExecutionContext, typeIntoConsole} from '../helpers/console-helpers.js';
import {addBreakpointForLine, createSelectorsForWorkerFile, openNestedWorkerFile} from '../helpers/sources-helpers.js';

const PAUSE_BUTTON = '[aria-label="Pause script execution"]';
const RESUME_BUTTON = '[aria-label="Resume script execution"]';

async function validateSourceTabs(frontend: puppeteer.Page) {
  // Verifies there is exactly one source open.
  const sourceTabPane = await frontend.waitForSelector('#sources-panel-sources-view .tabbed-pane');
  const sourceTabs = (await $('.tabbed-pane-header-tabs', sourceTabPane)).asElement();
  if (!sourceTabs) {
    assert.fail('Unable to locate source tabs');
    return;
  }
  const openSources =
      await sourceTabs.$$eval('.tabbed-pane-header-tab', nodes => nodes.map(n => n.getAttribute('aria-label')));
  assert.deepEqual(openSources, ['multi-workers.js']);
}

async function validateBreakpoints(frontend: puppeteer.Page) {
  const bps = await frontend.$$eval('.cm-breakpoint .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(bps, ['6', '10']);
  const disabled =
      await frontend.$$eval('.cm-breakpoint-disabled .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(disabled, ['6']);
}

async function validateBreakpointsWithoutDisabled(frontend: puppeteer.Page) {
  // Currently breakpoints do not get copied to workers if they are disabled.
  // This behavior is enforced by a web test, which this test will replace.
  // TODO(leese): Once breakpoint copying issue is fixed, remove this function.
  const bps = await frontend.$$eval('.cm-breakpoint .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(bps, ['10']);
  const disabled =
      await frontend.$$eval('.cm-breakpoint-disabled .CodeMirror-linenumber', nodes => nodes.map(n => n.textContent));
  assert.deepEqual(disabled, []);
}

describe('Multi-Workers', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  [false, true].forEach(sourceMaps => {
    const withOrWithout = sourceMaps ? 'with source maps' : 'without source maps';
    const targetPage = sourceMaps ? `${resourcesPath}/sources/multi-workers-sourcemap.html` :
                                    `${resourcesPath}/sources/multi-workers.html`;
    function workerFileSelectors(workerIndex: number) {
      return createSelectorsForWorkerFile(
          sourceMaps ? 'multi-workers.min.js' : 'multi-workers.js', 'test/e2e/resources/sources', 'multi-workers.js',
          workerIndex);
    }

    async function validateNavigationTree() {
      // Wait for 10th worker to exist.
      await waitFor(workerFileSelectors(10).rootSelector);
    }

    it(`loads scripts exactly once on reload ${withOrWithout}`, async () => {
      const {target, frontend} = getBrowserAndPages();

      // Have the target load the page.
      await target.goto(targetPage);

      await click('#tab-sources');
      await validateNavigationTree();
      await openNestedWorkerFile(workerFileSelectors(1));

      // Look at source tabs
      await validateSourceTabs(frontend);

      // Reload page
      await target.goto(targetPage);

      // Check workers again
      await validateNavigationTree();

      // Look at source tabs again
      await validateSourceTabs(frontend);
    });

    // TODO(leese): Enable once chromium:670180 is fixed.
    it.skip(`loads scripts exactly once on break ${withOrWithout}`, async () => {
      const {target, frontend} = getBrowserAndPages();

      // Have the target load the page.
      await target.goto(targetPage);

      await click('#tab-sources');

      await validateNavigationTree();

      // Open console tab
      await click('#tab-console');

      // Send message to a worker by evaluating in the console
      await typeIntoConsole(frontend, 'workers[3].postMessage({});');

      // Should automatically switch to sources tab.

      // Validate that we are paused by locating the resume button
      await waitFor(RESUME_BUTTON);

      // Look at source tabs
      await validateSourceTabs(frontend);

      // Continue
      await click(RESUME_BUTTON);
      // Verify that we have resumed.
      await waitFor(PAUSE_BUTTON);

      await click('#tab-console');
      await switchToTopExecutionContext(frontend);
      await focusConsolePrompt();
      // Send message to a different worker
      await typeIntoConsole(frontend, 'workers[7].postMessage({});');

      // Validate that we are paused
      await waitFor(RESUME_BUTTON);

      // Look at source tabs
      await validateSourceTabs(frontend);
    });

    it(`copies breakpoints between workers ${withOrWithout}`, async () => {
      const {target, frontend} = getBrowserAndPages();

      // Have the target load the page.
      await target.goto(targetPage);

      await click('#tab-sources');
      // Wait for all workers to load
      await validateNavigationTree();
      // Open file from second worker
      await openNestedWorkerFile(workerFileSelectors(2));
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
      await openNestedWorkerFile(workerFileSelectors(3));

      // Check breakpoints
      await validateBreakpointsWithoutDisabled(frontend);

      // Close tab
      await click('[aria-label="Close multi-workers.js"]');

      // Reload
      await target.goto(targetPage);

      // Open different worker
      await openNestedWorkerFile(workerFileSelectors(4));

      // Check breakpoints
      await validateBreakpointsWithoutDisabled(frontend);
    });
  });
});
