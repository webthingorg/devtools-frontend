// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import * as puppeteer from 'puppeteer';

import {$$, click, resourcesPath, timeout, waitFor} from '../../shared/helper.js';

const NEW_HEAP_SNAPSHOT_BUTTON = 'button[aria-label="Take heap snapshot"]';

export async function navigateToMemoryTab(target: puppeteer.Page) {
  const targetUrl = `${resourcesPath}/memory/default.html`;
  await target.goto(targetUrl);
  await click('#tab-heap_profiler');
  await waitFor('[aria-label="heap_profiler"]');
}

export async function takeHeapSnapshot() {
  await click(NEW_HEAP_SNAPSHOT_BUTTON);
  await timeout(2000);  // Aprox. time to get a snapshot
  await waitFor('.profiles-toolbar');
  await waitFor('#profile-views');
}

export async function waitForHeapSnapshotData() {
  await waitFor('#profile-views .data-grid');
  const rowCount = await getCountOfDataGriRows('#profile-views .data-grid');
  assert.notEqual(rowCount, 0);
}

export async function getCountOfDataGriRows(selector: string) {
  // The grid in Memory Tab contains a tree
  const grid = await waitFor(selector);
  const dataGridNodes = await $$('.data-grid-data-grid-node', grid);
  return await dataGridNodes.evaluate(nodes => nodes.length);
}
