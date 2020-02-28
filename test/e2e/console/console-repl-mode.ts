// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resetPages, typeText} from '../../shared/helper.js';

import {CONSOLE_TAB_SELECTOR, focusConsolePrompt} from './console-helpers.js';

describe('The Console Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('allows re-declaration of let variables', async () => {
    const {frontend} = getBrowserAndPages();
    await click(CONSOLE_TAB_SELECTOR);
    await focusConsolePrompt();

    // We need to hit escape before enter to exit the auto-complete popover.
    await typeText('let x = 1;');
    await frontend.keyboard.press('Escape');
    await frontend.keyboard.press('Enter');
    await frontend.waitForFunction(() => {
      return document.querySelectorAll('.console-user-command-result').length === 1;
    });

    await typeText('let x = 2;');
    await frontend.keyboard.press('Escape');
    await frontend.keyboard.press('Enter');
    await frontend.waitForFunction(() => {
      return document.querySelectorAll('.console-user-command-result').length === 2;
    });

    await typeText('x;');
    await frontend.keyboard.press('Escape');
    await frontend.keyboard.press('Enter');
    await frontend.waitForFunction(() => {
      return document.querySelectorAll('.console-user-command-result').length === 3;
    });

    const evaluateResults = await frontend.evaluate(() => {
      return Array.from(document.querySelectorAll('.console-user-command-result')).map(node => node.textContent);
    });

    assert.deepEqual(evaluateResults, ['undefined', 'undefined', '2']);
  });
});
