// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, resourcesPath} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, expandSelectedNodeRecursively, getNodesContentBySelectorAll, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

const INACTIVE_GRID_ADORNER_SELECTOR = '[aria-label="Enable grid mode"]';
// const ACTIVE_GRID_ADORNER_SELECTOR = '[aria-label="Disable grid mode"]';

describe('Adornment in the Elements Tab', async () => {
  beforeEach(async function() {
    const {target} = getBrowserAndPages();
    await target.goto(`${resourcesPath}/elements/adornment.html`);
    await waitForElementsStyleSection();

    // Sanity check to make sure we have the correct node selected after opening a file
    await assertContentOfSelectedElementsNode('<body>\u200B');
    await expandSelectedNodeRecursively();
  });

  it('displays Grid adorners for Grid containers', async () => {
    const rawContent = await getNodesContentBySelectorAll(INACTIVE_GRID_ADORNER_SELECTOR);
    const content: string[] = rawContent.map((content: string|null) => content || '');
    assert.deepEqual(content, [
      'grid',
      'grid',
    ]);
  });

  it('reacts to Grid adorner clicks and keyboard actions', async () => {});
});
