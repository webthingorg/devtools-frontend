// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {SCOPE_LOCAL_VALUES_SELECTOR, TURNED_OFF_PAUSE_BUTTON_SELECTOR} from '../helpers/sources-helpers.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, checkBreakpointIsNotActive, checkInlinePause, checkLineIsHighlighted, openFileInEditor, openSourceCodeEditorForFile, retrieveTopCallFrameScriptLocation, retrieveTopCallFrameWithoutResuming, sourceLineNumberSelector, stepThroughTheCode} from '../helpers/sources-helpers.js';

describe('The Sources Tab', async () => {
  it('can add breakpoint for a sourcemapped wasm module', async () => {
    const {target, frontend} = getBrowserAndPages();

    await openSourceCodeEditorForFile('with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    await addBreakpointForLine(frontend, 5);

    const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
    assert.deepEqual(scriptLocation, 'with-sourcemap.ll:5');
  });

  it('hits two breakpoints that are set and activated separately', async function() {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    });

    await step('add a breakpoint to line No.5', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitFor(await sourceLineNumberSelector(5));
    });

    await checkBreakpointIsActive(5);

    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameWithoutResuming();
      assert.deepEqual(scriptLocation, 'with-sourcemap.ll:5');
    });

    await step('remove the breakpoint from the fifth line', async () => {
      await frontend.click(await sourceLineNumberSelector(5));
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('open original source file', async () => {
      await openFileInEditor('with-sourcemap.ll');
    });

    await step('wait for all the source code to appear', async () => {
      await waitFor(await sourceLineNumberSelector(5));
    });

    await checkBreakpointIsNotActive(5);
    await checkBreakpointDidNotActivate();

    await step('add a breakpoint to line No.6', async () => {
      await addBreakpointForLine(frontend, 6);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitFor(await sourceLineNumberSelector(6));
    });

    await checkBreakpointIsActive(6);

    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameWithoutResuming();
      assert.deepEqual(scriptLocation, 'with-sourcemap.ll:6');
    });
  });

  it('is able to step in original source with state', async function() {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page with original source and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('stepping-with-state.c', 'wasm/emscripten/stepping-with-state-sourcemaps.html');
    });

    await step('add a breakpoint to line No.14', async () => {
      await addBreakpointForLine(frontend, 14);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 14 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(14));
    });

    await checkBreakpointIsActive(14);

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 3 times and check that line No.14 is active', async () => {
      for (let index = 0; index < 3; index++) {
        await checkLineIsHighlighted(14);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.15 is highlighted', async () => {
      await checkLineIsHighlighted(15);
    });

    await checkInlinePause('n', 15);

    await step('remove the breakpoint from line 14', async () => {
      await frontend.click(await sourceLineNumberSelector(14));
    });

    await step('add a breakpoint to line No.8', async () => {
      await addBreakpointForLine(frontend, 8);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 8 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(8));
    });

    await checkBreakpointIsActive(8);

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 9 times and check that line No.14 is active', async () => {
      for (let index = 0; index < 9; index++) {
        await checkLineIsHighlighted(8);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.9 is highlighted', async () => {
      await checkLineIsHighlighted(9);
    });

    await checkInlinePause('constant', 9);

    await step('check that the variables in the scope view show the correct values', async () => {
      await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const localScopeView = await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const local_scope_values = await localScopeView.evaluate(element => {
        return (element as HTMLElement).innerText;
      });

      const expected_scope_values = [
        'var0: 5246544', 'var1: 10', 'var2: 5',  'var3: 5246544', 'var4: 16', 'var5: 5246528', 'var6: 0',
        'var7: 0',       'var8: 10', 'var9: 0',  'var10: 10',     'var11: 1', 'var12: 1',      'var13: 1',
        'var14: 0',      'var15: 0', 'var16: 0', 'var17: 0',      'var18: 0', 'var19: 0',      'var20: 0',
        'var21: 0',      'var22: 0', 'var23: 0', 'var24: 0',
      ];

      assert.deepEqual(
          local_scope_values.split('\n'), expected_scope_values, 'local scope does not contain the correct values');
    });

    await step('remove the breakpoint from line 8', async () => {
      await frontend.click(await sourceLineNumberSelector(8));
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();
  });
});
