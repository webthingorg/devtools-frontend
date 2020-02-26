// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resetPages, waitFor, spyOnFrontendFunction} from '../../shared/helper.js';

describe('Keyboard shortcut telemetry', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('should log the use of F1 to open settings', async () => {
    const {frontend} = getBrowserAndPages();
    const recordHistogramSpy = await spyOnFrontendFunction('InspectorFrontendHost.recordEnumeratedHistogram');

    await frontend.keyboard.press('F1');
    await waitFor('.settings-window-main');

    assert.isTrue(recordHistogramSpy.calledWith('DevTools.KeyboardShortcutFired', 22));
    // Close settings
    await frontend.keyboard.press('Escape');
  });

  it('should log the use of Ctrl+` to open the console', async () => {
    const {frontend} = getBrowserAndPages();
    const recordHistogramSpy = await spyOnFrontendFunction('InspectorFrontendHost.recordEnumeratedHistogram');

    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('`');
    await frontend.keyboard.up('Control');
    await waitFor('.console-view');

    assert.isTrue(recordHistogramSpy.calledWith('DevTools.KeyboardShortcutFired', 3));
  });

  it('should log the use of Ctrl+F8 as OtherShortcut', async () => {
    const {frontend} = getBrowserAndPages();
    const recordHistogramSpy = await spyOnFrontendFunction('InspectorFrontendHost.recordEnumeratedHistogram');

    await click('#tab-sources');
    await waitFor('#sources-panel-sources-view');
    await frontend.keyboard.down('Control');
    await frontend.keyboard.press('F8');
    await frontend.keyboard.up('Control');
    await waitFor('.toolbar-state-on[aria-label="Deactivate breakpoints"]');

    assert.isTrue(recordHistogramSpy.calledWith('DevTools.KeyboardShortcutFired', 0));
  });
});
