// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';
import {click, typeText, waitFor} from '../../shared/helper.js';
import {CONSOLE_TAB_SELECTOR, focusConsolePrompt} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('triggers autocompletion for `document.`', async () => {
    await click(CONSOLE_TAB_SELECTOR);
    await focusConsolePrompt();

    const appearPromise = waitFor('.suggest-box');
    await typeText('document.');
    await appearPromise;
  });

  it('triggers autocompletion for `document?.`', async () => {
    await click(CONSOLE_TAB_SELECTOR);
    await focusConsolePrompt();

    const appearPromise = waitFor('.suggest-box');
    await typeText('document?.');
    await appearPromise;
  });

  it('triggers autocompletion for `document[`', async () => {
    await click(CONSOLE_TAB_SELECTOR);
    await focusConsolePrompt();

    const appearPromise = waitFor('.suggest-box');
    await typeText('document[');
    await appearPromise;
  });
});
