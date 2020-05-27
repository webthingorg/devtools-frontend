// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, click, getBrowserAndPages, pasteText, step} from '../../shared/helper.js';
import {CONSOLE_TAB_SELECTOR, focusConsolePrompt} from '../helpers/console-helpers.js';
import {STACK_PREVIEW_CONTAINER} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('truncates long stack traces ', async () => {
    const {frontend} = getBrowserAndPages();
    let messages: Array<string>;

    await step('navigate to the Console tab', async () => {
      await click(CONSOLE_TAB_SELECTOR);
      await focusConsolePrompt();
    });

    await step('enter code into the console that produces two stack traces, one short and and one long', async () => {
      await pasteText(`
        function recursive(n) {
          if (n > 1) {
            return recursive(n-1);
          } else {
            return console.trace();
          }
        }
        recursive(10);
        recursive(50);
      `);

      await frontend.keyboard.press('Enter');

      // Wait for the console to be usable again.
      await frontend.waitForFunction(() => {
        return document.querySelectorAll('.console-user-command-result').length === 1;
      });
    });

    await step('retrieve the console log', async () => {
      messages = await (await $$(STACK_PREVIEW_CONTAINER)).evaluate(elements => {
        return elements.map((el: HTMLElement) => el.innerText);
      });
    });

    await step('check that the first log is not truncated', async () => {
      assert.deepEqual(
          messages[0],
          '\trecursive\t@\tVM11:6\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\t(anonymous)\t@\tVM11:9');
    });

    await step('check that the second log is truncated', async () => {
      assert.deepEqual(
          messages[1],
          '\trecursive\t@\tVM11:6\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\trecursive\t@\tVM11:4\n' +
              '\tShow 21 more frames');
    });
  });
});
