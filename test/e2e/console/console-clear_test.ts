// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {click, getBrowserAndPages} from '../../shared/helper.js';
import {CONSOLE_TAB_SELECTOR, focusConsolePrompt, typeIntoConsole, typeIntoConsoleAndWaitForResult} from '../helpers/console-helpers.js';

describe('The Console Tab', async function() {
  it('is cleared via the console.clear() method', async () => {
    const {frontend} = getBrowserAndPages();
    await click(CONSOLE_TAB_SELECTOR);
    await focusConsolePrompt();

    await typeIntoConsoleAndWaitForResult(frontend, '1;');
    await typeIntoConsoleAndWaitForResult(frontend, '2;');
    await typeIntoConsoleAndWaitForResult(frontend, '3;');

    const evaluateResults = await frontend.evaluate(() => {
      return Array.from(document.querySelectorAll('.console-user-command-result')).map(node => node.textContent);
    });

    assert.deepEqual(evaluateResults, ['1', '2', '3'], 'did not find expected output in the console');

    await typeIntoConsole(frontend, 'console.clear();');

    await frontend.waitForFunction(() => {
      return document.querySelectorAll('.console-user-command-result').length === 1;
    });

    const clearResult = await frontend.evaluate(() => {
      return document.querySelectorAll('.console-user-command-result')[0].textContent;
    });

    assert.strictEqual(clearResult, 'undefined', 'the result of clear was not undefined');
  });
});
