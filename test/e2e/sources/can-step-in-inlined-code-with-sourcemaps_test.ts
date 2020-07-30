// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, checkLineIsHighlighted, openSourceCodeEditorForFile, sourceLineCodeSelector, sourceLineNumberSelector, stepThroughTheCode, TURNED_OFF_PAUSE_BUTTON_SELECTOR} from '../helpers/sources-helpers.js';

describe('Sources Tab', async function() {
  it('is able to step through source-mapped wasm code that includes inlining', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page that has a C file and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('inlining.c', 'wasm/emscripten/inlining-sourcemaps.html');
    });

    await step('add a breakpoint to line No.11', async () => {
      await addBreakpointForLine(frontend, 11);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitFor(await sourceLineNumberSelector(11));
    });

    await checkBreakpointIsActive(11);

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 14 times and check that line No.11 is active', async () => {
      for (let index = 0; index < 14; index++) {
        await checkLineIsHighlighted(11);
        await stepThroughTheCode();
      }
    });

    await step('step through the code 6 times and check that line No.12 is active', async () => {
      for (let index = 0; index < 6; index++) {
        await checkLineIsHighlighted(12);
        await stepThroughTheCode();
      }
    });

    await step('step through the code 13 times and check that line No.7 is active', async () => {
      for (let index = 0; index < 13; index++) {
        await checkLineIsHighlighted(7);
        await stepThroughTheCode();
      }
    });

    await step('step through the code 3 times and check that line No.8 is active', async () => {
      for (let index = 0; index < 3; index++) {
        await checkLineIsHighlighted(8);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.12 is highlighted', async () => {
      await checkLineIsHighlighted(12);
    });

    await step('check that the run has paused on "dsq" on line No.12', async () => {
      const sourceLineText =
          await (await $((await sourceLineCodeSelector(12)) + ' .cm-variable.cm-execution-line-tail'))
              .evaluate(element => {
                return element.innerText;
              });
      assert.strictEqual(sourceLineText, 'dsq', 'line paused at is not correct');
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();
  });
});
