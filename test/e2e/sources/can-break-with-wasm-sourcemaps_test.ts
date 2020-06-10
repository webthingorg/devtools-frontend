// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, step} from '../../shared/helper.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, checkBreakpointIsNotActive, openSourceCodeEditorForFile, retrieveTopCallFrameScriptLocation, sourceLineNumberSelector} from '../helpers/sources-helpers.js';

describe('The Sources Tab', async () => {
  it('can add breakpoint for a sourcemapped wasm module', async () => {
    const {target, frontend} = getBrowserAndPages();

    await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    await addBreakpointForLine(frontend, 5);

    const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
    assert.deepEqual(scriptLocation, 'with-sourcemap.ll:5');
  });

  it('hits breakpoint upon refresh for a sourcemapped wasm module', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    });

    await step('add a breakpoint to line No.5', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsActive(5);

    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
      // TODO(chromium:1043047): Switch to bytecode offsets here.
      assert.deepEqual(scriptLocation, 'with-sourcemap.ll:5');
    });
  });

  it('does not hit the breakpoint after it is removed for a sourcemapped wasm module', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    });

    await step('add a breakpoint to line No.5', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsActive(5);

    await step('remove the breakpoint from the fifth line', async () => {
      await frontend.click(await sourceLineNumberSelector(5));
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsNotActive(5);
    await checkBreakpointDidNotActivate();
  });

  it('hits two breakpoints that are set and activated seprately', async function() {
    // this test is particularly slow, as it performs a lot of actions
    this.timeout(10000);

    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    });

    await step('add a breakpoint to line No.5', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsActive(5);

    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
      // TODO(chromium:1043047): Switch to bytecode offsets here.
      assert.deepEqual(scriptLocation, 'with-sourcemap.ll:5');
    });

    await step('remove the breakpoint from the fifth line', async () => {
      await frontend.click(await sourceLineNumberSelector(5));
    });

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap.html');
    });

    await step('add a breakpoint to line No.6', async () => {
      await addBreakpointForLine(frontend, 6);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsActive(6);

    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
      // TODO(chromium:1043047): Switch to bytecode offsets here.
      assert.deepEqual(scriptLocation, 'with-sourcemap.ll:6');
    });
  });
});
