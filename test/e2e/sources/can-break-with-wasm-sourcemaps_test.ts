// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {SCOPE_LOCAL_VALUES_SELECTOR, SELECTED_THREAD_SELECTOR, TURNED_OFF_PAUSE_BUTTON_SELECTOR} from '../helpers/sources-helpers.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, checkBreakpointIsNotActive, checkInlinePause, checkLineIsHighlighted, goToLine, openFileInEditor, openSourceCodeEditorForFile, retrieveTopCallFrameScriptLocation, retrieveTopCallFrameWithoutResuming, sourceLineNumberSelector, stepThroughTheCode} from '../helpers/sources-helpers.js';

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
    await step('step through the code 9 times and check that line No.8 is active', async () => {
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

  it('is able to step in original source with state and threads', async function() {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page with original source and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(
          'stepping-with-state-and-threads.c',
          'wasm/emscripten-with-threads/stepping-with-state-and-threads-sourcemaps.html');
    });

    await step('add a breakpoint to line No.49', async () => {
      await goToLine(frontend, 49);
      await addBreakpointForLine(frontend, 49);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 49 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(49));
    });

    await checkBreakpointIsActive(49);

    await step('check that the main thread is selected', async () => {
      const selectedThreadElement = await waitFor(SELECTED_THREAD_SELECTOR);
      const selectedThreadName = await selectedThreadElement.evaluate(element => {
        return (element as HTMLElement).innerText;
      });
      assert.strictEqual(selectedThreadName, 'Main', 'the Main thread is not active');
    });

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 3 times and check that line No.49 is active', async () => {
      for (let index = 0; index < 3; index++) {
        await checkLineIsHighlighted(49);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.50 is highlighted', async () => {
      await checkLineIsHighlighted(50);
    });

    await checkInlinePause('thread_args', 50);

    await step('check that the variables in the scope view show the correct values', async () => {
      await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const localScopeView = await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const local_scope_values = await localScopeView.evaluate(element => {
        return (element as HTMLElement).innerText;
      });

      const expected_scope_values = [
        'var0: 5248624',   'var1: 64',        'var2: 5248464', 'var3: 5248560',  'var4: 0',        'var5: 0',
        'var6: 10',        'var7: 10',        'var8: 5248560', 'var9: 2',        'var10: 40',      'var11: 15',
        'var12: 55',       'var13: -16',      'var14: 48',     'var15: 5248560', 'var16: 5248512', 'var17: 10',
        'var18: 40',       'var19: 55',       'var20: 48',     'var21: 5248512', 'var22: 5248464', 'var23: 10',
        'var24: 10',       'var25: 10',       'var26: 10',     'var27: 0',       'var28: 1',       'var29: 0',
        'var30: 9',        'var31: 9',        'var32: 2',      'var33: 36',      'var34: 5248548', 'var35: 10',
        'var36: 9',        'var37: 1',        'var38: 1',      'var39: 0',       'var40: 9',       'var41: 2',
        'var42: 36',       'var43: 5248500',  'var44: 9',      'var45: 1',       'var46: 10',      'var47: 36',
        'var48: 5248596',  'var49: 5248596',  'var50: 0',      'var51: 1',       'var52: 5',       'var53: 12',
        'var54: 5248664',  'var55: 0',        'var56: 0',      'var57: 0',       'var58: 0',       'var59: 0',
        'var60: 0',        'var61: 0',        'var62: 0',      'var63: 0',       'var64: 0',       'var65: 0',
        'var66: 0',        'var67: 0',        'var68: 0',      'var69: 0',       'var70: 0',       'var71: 0',
        'var72: 0',        'var73: 0',        'var74: 0',      'var75: 0',       'var76: 0',       'var77: 0',
        'var78: 0',        'var79: 0',        'var80: 0',      'var81: 0',       'var82: 0',       'var83: 0',
        'var84: 0',        'var85: 0',        'var86: 0',      'var87: 0',       'var88: 0',       'var89: 0',
        'var90: 0',        'var91: 0',        'var92: 0',      'var93: 0',       'var94: 0',       'var95: 0',
        'var96: 0',        'var97: 0',        'var98: 0',      'var99: 0',       'var100: 0',      'var101: 0',
        'var102: 0',       'var103: 0',       'var104: 0',     'var105: 0',      'var106: 0',      'var107: 5248560',
        'var108: 5248512', 'var109: 5248464', 'var110: 0',
      ];

      assert.deepEqual(
          local_scope_values.split('\n'), expected_scope_values, 'local scope does not contain the correct values');
    });

    await step('remove the breakpoint from line 49', async () => {
      await frontend.click(await sourceLineNumberSelector(49));
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();

    await step('add a breakpoint to line No.23', async () => {
      await goToLine(frontend, 23);
      await addBreakpointForLine(frontend, 23);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 23 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(23));
    });

    await checkBreakpointIsActive(23);

    await step('check that the main thread is selected', async () => {
      const selectedThreadElement = await waitFor(SELECTED_THREAD_SELECTOR);
      const selectedThreadName = await selectedThreadElement.evaluate(element => {
        return (element as HTMLElement).innerText;
      });
      assert.strictEqual(selectedThreadName, 'Main', 'the Main thread is not active');
    });

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 9 times and check that line No.23 is active', async () => {
      for (let index = 0; index < 9; index++) {
        await checkLineIsHighlighted(23);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.24 is highlighted', async () => {
      await checkLineIsHighlighted(24);
    });

    await checkInlinePause('constant', 24);

    await step('check that the variables in the scope view show the correct values', async () => {
      await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const localScopeView = await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const local_scope_values = await localScopeView.evaluate(element => {
        return (element as HTMLElement).innerText;
      });

      const expected_scope_values = [
        'var0: 5248464', 'var1: 10', 'var2: 5',  'var3: 5248464', 'var4: 16', 'var5: 5248448', 'var6: 0',
        'var7: 0',       'var8: 10', 'var9: 0',  'var10: 10',     'var11: 1', 'var12: 1',      'var13: 1',
        'var14: 0',      'var15: 0', 'var16: 0', 'var17: 0',      'var18: 0', 'var19: 0',      'var20: 0',
        'var21: 0',      'var22: 0', 'var23: 0', 'var24: 0',
      ];

      assert.deepEqual(
          local_scope_values.split('\n'), expected_scope_values, 'local scope does not contain the correct values');
    });

    await step('remove the breakpoint from line 23', async () => {
      await frontend.click(await sourceLineNumberSelector(23));
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();

    await step('add a breakpoint to line No.30', async () => {
      await goToLine(frontend, 30);
      await addBreakpointForLine(frontend, 30);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 30 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(30));
    });

    await checkBreakpointIsActive(30);

    await step('check that the worker thread is selected', async () => {
      const selectedThreadElement = await waitFor(SELECTED_THREAD_SELECTOR);
      const selectedThreadName = await selectedThreadElement.evaluate(element => {
        return (element as HTMLElement).innerText;
      });
      assert.strictEqual(
          selectedThreadName, 'stepping-with-state-and-threads.worker.js', 'the worker thread is not active');
    });

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 3 times and check that line No.30 is active', async () => {
      for (let index = 0; index < 3; index++) {
        await checkLineIsHighlighted(30);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.31 is highlighted', async () => {
      await checkLineIsHighlighted(31);
    });

    await checkInlinePause('arguments', 31);

    await step('check that the variables in the scope view show the correct values', async () => {
      await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const localScopeView = await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const local_scope_values = await localScopeView.evaluate(element => {
        return (element as HTMLElement).innerText;
      });

      const expected_scope_values = [
        'var0: 5248664',
        'var1: 7345856',
        'var2: 16',
        'var3: 7345840',
        'var4: 0',
        'var5: 5248664',
        'var6: 0',
        'var7: 0',
        'var8: 0',
        'var9: 0',
        'var10: 0',
        'var11: 0',
        'var12: 0',
        'var13: 0',
        'var14: 7345840',
        'var15: 0',
      ];

      assert.deepEqual(
          local_scope_values.split('\n'), expected_scope_values, 'local scope does not contain the correct values');
    });

    await step('remove the breakpoint from line 30', async () => {
      await frontend.click(await sourceLineNumberSelector(30));
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();

    await step('add a breakpoint to line No.16', async () => {
      await goToLine(frontend, 16);
      await addBreakpointForLine(frontend, 16);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for line 16 to appear', async () => {
      await waitFor(await sourceLineNumberSelector(16));
    });

    await checkBreakpointIsActive(16);

    await step('check that the worker thread is selected', async () => {
      const selectedThreadElement = await waitFor(SELECTED_THREAD_SELECTOR);
      const selectedThreadName = await selectedThreadElement.evaluate(element => {
        return (element as HTMLElement).innerText;
      });
      assert.strictEqual(
          selectedThreadName, 'stepping-with-state-and-threads.worker.js', 'the worker thread is not active');
    });

    // TODO(crbug.com/1105765): This is supposed to be changed to step one time
    await step('step through the code 9 times and check that line No.16 is active', async () => {
      for (let index = 0; index < 9; index++) {
        await checkLineIsHighlighted(16);
        await stepThroughTheCode();
      }
    });

    await step('check that line No.17 is highlighted', async () => {
      await checkLineIsHighlighted(17);
    });

    await checkInlinePause('constant', 17);

    await step('check that the variables in the scope view show the correct values', async () => {
      await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const localScopeView = await waitFor(SCOPE_LOCAL_VALUES_SELECTOR);
      const local_scope_values = await localScopeView.evaluate(element => {
        return (element as HTMLElement).innerText;
      });

      const expected_scope_values = [
        'var0: 5248512', 'var1: 10', 'var2: 5',  'var3: 7345840', 'var4: 16', 'var5: 7345824', 'var6: 0',
        'var7: 0',       'var8: 10', 'var9: 0',  'var10: 10',     'var11: 1', 'var12: 1',      'var13: 1',
        'var14: 0',      'var15: 0', 'var16: 0', 'var17: 0',      'var18: 0', 'var19: 0',      'var20: 0',
        'var21: 0',      'var22: 0', 'var23: 0', 'var24: 0',
      ];

      assert.deepEqual(
          local_scope_values.split('\n'), expected_scope_values, 'local scope does not contain the correct values');
    });

    await step('remove the breakpoint from line 16', async () => {
      await frontend.click(await sourceLineNumberSelector(16));
    });

    await step('resume script execution', async () => {
      await frontend.keyboard.press('F8');
      await waitFor(TURNED_OFF_PAUSE_BUTTON_SELECTOR);
    });

    await checkBreakpointDidNotActivate();
  });
});
