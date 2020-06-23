// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$$, click, closePanelTab, getBrowserAndPages, goToResource, typeText, waitFor, waitForNone} from '../../shared/helper.js';

import {openCommandMenu} from './quick_open-helpers.js';
import {openPanelViaMoreTools} from './settings-helpers.js';

const NEW_HEAP_SNAPSHOT_BUTTON = 'button[aria-label="Take heap snapshot"]';
const MEMORY_PANEL_CONTENT = 'div[aria-label="Memory panel"]';
const PROFILE_TREE_SIDEBAR = 'div.profiles-tree-sidebar';
const MEMORY_PANEL_TITLE = 'Memory';
export const MEMORY_TAB_SELECTOR = '#tab-heap_profiler';

export async function navigateToMemoryTab() {
  await goToResource('memory/default.html');
  await click(MEMORY_TAB_SELECTOR);
  await memoryPanelContentIsLoaded();
}

export async function takeHeapSnapshot() {
  await click(NEW_HEAP_SNAPSHOT_BUTTON);
  await waitForNone('.heap-snapshot-sidebar-tree-item.wait');
  await waitFor('.heap-snapshot-sidebar-tree-item.selected');
}

export async function waitForHeapSnapshotData() {
  await waitFor('#profile-views');
  await waitFor('#profile-views .data-grid');
  const rowCount = await getCountOfDataGridRows('#profile-views .data-grid');
  assert.notEqual(rowCount, 0);
}

export async function getCountOfDataGridRows(selector: string) {
  // The grid in Memory Tab contains a tree
  const grid = await waitFor(selector);
  const dataGridNodes = await $$('.data-grid-data-grid-node', grid);
  return await dataGridNodes.evaluate(nodes => nodes.length);
}

export async function memoryTabExists() {
  await waitFor(MEMORY_TAB_SELECTOR);
}

export async function memoryTabDoesNotExist() {
  await waitForNone(MEMORY_TAB_SELECTOR);
}

export async function memoryPanelContentIsLoaded() {
  await waitFor(MEMORY_PANEL_CONTENT);
  await waitFor(PROFILE_TREE_SIDEBAR);
}

export async function closeMemoryTab() {
  await closePanelTab(MEMORY_TAB_SELECTOR);
  await memoryTabDoesNotExist();
}

export async function openMemoryPanelFromMoreTools() {
  await openPanelViaMoreTools(MEMORY_PANEL_TITLE);
  await memoryTabExists();
  await memoryPanelContentIsLoaded();
}

export async function openMemoryPanelFromCommandMenu() {
  const {frontend} = getBrowserAndPages();
  await openCommandMenu();
  await typeText('Show Memory');
  await frontend.keyboard.press('Enter');
  await memoryTabExists();
  await memoryPanelContentIsLoaded();
}
