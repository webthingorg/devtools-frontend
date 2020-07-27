// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, openSourceCodeEditorForFile, sourceLineNumberSelector, sourceLineSelector, sourceLineTextSelector, stepThroughTheCode, TURNED_OFF_PAUSE_BUTTON_SELECTOR} from '../helpers/sources-helpers.js';

describe('Sources Tab', async function() {
  it('is able to step through source-mapped wasm code that includes inlining', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page that has a C file and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('inlining.c', 'wasm/emscripten/inlining-sourcemaps.html');
    });

    await step('add a breakpoint to line No.8', async () => {
      await addBreakpointForLine(frontend, 8);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitFor(await sourceLineNumberSelector(8));
    });

    await checkBreakpointIsActive(8);

    await step('step through the code 36 times', async () => {
      for (let index = 0; index < 36; index++) {
        await stepThroughTheCode();
      }
    });

    await step('check that the run has paused on "dsq" on line No.9', async () => {
      const sourceLineText = await (await $((await sourceLineTextSelector(9)) + ' .cm-variable.cm-execution-line-tail'))
                                 .evaluate(element => {
                                   return element.innerText;
                                 });
      assert.strictEqual(sourceLineText, 'dsq', 'line paused at is not correct');
    });

    await step('check that line No.9 is highlighted', async () => {
      const sourceLine = await (await $((await sourceLineSelector(9)))).evaluate(element => {
        return element.innerHTML;
      });
      assert.deepInclude(
          sourceLine, '<div class="CodeMirror-activeline-background CodeMirror-linebackground"></div>',
          'line No.9 is not highlighted');
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();
  });
});
