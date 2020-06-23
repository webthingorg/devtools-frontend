// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {reloadDevTools} from '../../shared/helper.js';
import {closeMemoryTab, memoryPanelContentIsLoaded, memoryTabDoesNotExist, memoryTabExists, navigateToMemoryTab, openMemoryPanelFromCommandMenu, openMemoryPanelFromMoreTools, takeHeapSnapshot, waitForHeapSnapshotData} from '../helpers/memory-helpers.js';

describe('The Memory Panel', async () => {
  it('Loads content', async () => {
    await navigateToMemoryTab();
  });
  // The row count assertion is failing in CQ
  it.skip('[crbug.com/1086641]: Can take several heap snapshots ', async () => {
    await navigateToMemoryTab();
    await takeHeapSnapshot();
    await waitForHeapSnapshotData();
    await takeHeapSnapshot();
    await waitForHeapSnapshotData();
  });

  it('is open by default when devtools initializes', async () => {
    await navigateToMemoryTab();
  });

  it('closes without crashing and stays closed after reloading tools', async () => {
    await closeMemoryTab();
    await reloadDevTools();
    await memoryTabDoesNotExist();
  });

  it('appears under More tools after being closed', async () => {
    await closeMemoryTab();
    await openMemoryPanelFromMoreTools();
    await reloadDevTools({selectedPanel: {name: 'memory'}});
    await memoryTabExists();
  });

  it('can be opened from command menu after being closed', async () => {
    await closeMemoryTab();
    await openMemoryPanelFromCommandMenu();
  });

  it('opens if the query param "panel" is set', async () => {
    await closeMemoryTab();
    await reloadDevTools({queryParams: {panel: 'heap_profiler'}});
    await memoryTabExists();
    await memoryPanelContentIsLoaded();
  });
});
