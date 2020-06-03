// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$$, getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {addBreakpointForLine, openSourceCodeEditorForFile, retrieveTopCallFrameScriptLocation, sourceLineNumberSelector, SOURCES_LINES_SELECTOR} from '../helpers/sources-helpers.js';

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

    await step('navigate to a page that activates the "main" function and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap-with-main.html');
    });

    await step('add a breakpoint to the fifth line', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await step('check that the breakpoint is still active', async () => {
      const codeLineNums = await (await $$(SOURCES_LINES_SELECTOR)).evaluate(elements => {
        return elements.map((el: HTMLElement) => el.className);
      });
      assert.deepInclude(codeLineNums[4], 'cm-breakpoint');
      assert.notDeepInclude(codeLineNums[4], 'cm-breakpoint-disabled');
      assert.notDeepInclude(codeLineNums[4], 'cm-breakpoint-unbound');
    });

    await step('check that the code has paused on the breakpoint', async () => {
      await waitFor('.paused-status', undefined, 2000);
    });
  });

  it('does not hit the breakpoint after it is removed for a sourcemapped wasm module', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page that activates the "main" function and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'with-sourcemap.ll', 'wasm/wasm-with-sourcemap-with-main.html');
    });

    await step('add a breakpoint to the fifth line', async () => {
      await waitFor(await sourceLineNumberSelector(5), undefined, 2000);
      await frontend.click(await sourceLineNumberSelector(5));
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await step('check that the breakpoint is still active', async () => {
      const codeLineNums = await (await $$(SOURCES_LINES_SELECTOR)).evaluate(elements => {
        return elements.map((el: HTMLElement) => el.className);
      });

      assert.deepInclude(codeLineNums[4], 'cm-breakpoint');
      assert.notDeepInclude(codeLineNums[4], 'cm-breakpoint-disabled');
      assert.notDeepInclude(codeLineNums[4], 'cm-breakpoint-unbound');
    });

    await step('remove the breakpoint from the fifth line', async () => {
      frontend.click(await sourceLineNumberSelector(5));
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await step('check that the breakpoint is not active', async () => {
      const codeLineNums = await (await $$(SOURCES_LINES_SELECTOR)).evaluate(elements => {
        return elements.map((el: HTMLElement) => el.className);
      });
      assert.notDeepInclude(codeLineNums[4], 'cm-breakpoint');
    });
  });
});
