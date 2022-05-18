// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  click,
  goToResource,
  step,
  waitFor,
  waitForNone,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  createSelectorsForWorkerFile,
  expandFileTree,
  expandSourceTreeItem,
  readSourcesTreeView,
} from '../helpers/sources-helpers.js';

const groupedExpectedTree = [
  'Authored',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.js',
  'Deployed',
  'top',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers-sourcemap.html',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
];

const defaultExpectedTree = [
  'top',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers-sourcemap.html',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.js',
  'multi-workers.min.js',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
  'multi-workers.min.js',
  'localhost:XXXX',
  'test/e2e/resources/sources',
];

describe('Source Panel grouping', async function() {
  const targetPage = 'sources/multi-workers-sourcemap.html';
  const scriptFile = 'multi-workers.min.js';
  function workerFileSelectors(workerIndex: number) {
    return createSelectorsForWorkerFile(scriptFile, 'test/e2e/resources/sources', scriptFile, workerIndex);
  }
  async function validateNavigationTree() {
    await step('Ensure 10 workers exist', async () => {
      await waitFor(workerFileSelectors(10).rootSelector);
    });
  }

  const menuText = 'Group by Authored/Deployed (experimental)';
  async function enableGrouping() {
    await click('[aria-label="More options"]');
    await click(`[aria-label="${menuText}, unchecked"]`);
  }
  async function disableGrouping() {
    await click('[aria-label="More options"]');
    await click(`[aria-label="${menuText}, checked"]`);
  }
  beforeEach(async () => {
    // Have the target load the page.
    await goToResource(targetPage);
    await step('Open sources panel', async () => {
      await click('#tab-sources');
    });
  });
  it('can enable and disable group by authored/deployed', async () => {
    // Switch to grouped
    await enableGrouping();
    await waitFor('.navigator-deployed-tree-item');
    await waitFor('.navigator-authored-tree-item');
    await validateNavigationTree();
    await expandSourceTreeItem('[aria-label="test/e2e/resources/sources, sm-folder"]');
    await expandFileTree(workerFileSelectors(6));
    assert.deepEqual(await readSourcesTreeView(), groupedExpectedTree);

    // Switch back
    await disableGrouping();
    await waitForNone('.navigator-deployed-tree-item');
    await waitForNone('.navigator-authored-tree-item');
    await validateNavigationTree();
    await expandFileTree(workerFileSelectors(6));
    assert.deepEqual(await readSourcesTreeView(), defaultExpectedTree);

    // And switch to grouped again...
    await enableGrouping();
    await waitFor('.navigator-deployed-tree-item');
    await waitFor('.navigator-authored-tree-item');
    await validateNavigationTree();
    await expandSourceTreeItem('[aria-label="test/e2e/resources/sources, sm-folder"]');
    await expandFileTree(workerFileSelectors(6));
    assert.deepEqual(await readSourcesTreeView(), groupedExpectedTree);
  });
});
