// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {$, $$, getBrowserAndPages, resourcesPath, waitFor, waitForFunction} from '../../shared/helper.js';

import {openPanelViaMoreTools} from './settings-helpers.js';

const PANEL_ROOT_SELECTOR = 'div[aria-label="Changes panel"]';

export async function openChangesPanels(testName?: string) {
  if (testName) {
    const {target} = getBrowserAndPages();
    await target.goto(`${resourcesPath}/changes/${testName}.html`);
  }

  await openPanelViaMoreTools('Changes');
  await waitFor(PANEL_ROOT_SELECTOR);
}

export async function getChangesList() {
  const root = await $(PANEL_ROOT_SELECTOR);
  const items = await $$('.tree-element-title', root);

  return items.evaluate((nodes: Element[]) => {
    return nodes.map(node => node.textContent || '');
  });
}

export async function waitForNewChanges(initialChanges: string[]) {
  await waitForFunction(async () => {
    const newChanges = await getChangesList();
    return newChanges.length !== initialChanges.length;
  }, 'The list of changes did not change as expected');
}
