// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {click, closePanelTab, reloadDevTools, timeout, waitFor, waitForNone} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

const panelTitle = 'Security';

describe('The Security Panel', async () => {
  it('should be open by default when devtools initializes', async () => {
    // Even though the panel is closeable, we want it to be open by default until a user
    // purposefully closes it.
    await click('#tab-security');
    await timeout(1000);  // For panel content to display
    const panelSelector = `.view-container[aria-label="${panelTitle} panel"]`;
    await waitFor(panelSelector);
  });

  it('should close without crashing and stay closed', async () => {
    await closePanelTab('tab-security');
    // Make sure tab is not present
    await waitForNone('#tab-security');
    await reloadDevTools();
    await waitForNone('#tab-security');
    await timeout(10000);
  });

  it('should appear under More tools', async () => {
    // Closable tabs should live under the more tools menu
    await openPanelViaMoreTools(panelTitle);
    await timeout(1000);  // For panel content to display
    const panelSelector = `.view-container[aria-label="${panelTitle} panel"]`;
    await waitFor(panelSelector);
  });
});
