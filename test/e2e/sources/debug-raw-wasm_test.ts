// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$, click, getBrowserAndPages, resourcesPath, step} from '../../shared/helper.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, checkBreakpointIsActive, checkBreakpointIsNotActive, clearSourceFilesAdded, getBreakpointDecorators, getNonBreakableLines, listenForSourceFilesAdded, openSourceCodeEditorForFile, openSourcesPanel, RESUME_BUTTON, retrieveSourceFilesAdded, retrieveTopCallFrameScriptLocation, sourceLineNumberSelector, waitForAdditionalSourceFiles} from '../helpers/sources-helpers.js';

describe('Sources Tab', async () => {
  it('shows the correct wasm source on load and reload', async () => {
    async function checkSources(frontend: puppeteer.Page) {
      await waitForAdditionalSourceFiles(frontend, 2);
      const capturedFileNames = await retrieveSourceFilesAdded(frontend);
      assert.deepEqual(
          capturedFileNames,
          ['/test/e2e/resources/sources/wasm/call-to-add-wasm.html', '/test/e2e/resources/sources/wasm/add.wasm']);
    }
    const {target, frontend} = getBrowserAndPages();
    await openSourcesPanel();

    await listenForSourceFilesAdded(frontend);
    await target.goto(`${resourcesPath}/sources/wasm/call-to-add-wasm.html`);
    await checkSources(frontend);

    await clearSourceFilesAdded(frontend);
    await target.reload();
    await checkSources(frontend);
  });

  it('can add a breakpoint in raw wasm', async () => {
    const {target, frontend} = getBrowserAndPages();

    await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
    await addBreakpointForLine(frontend, 5);

    const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
    assert.deepEqual(scriptLocation, 'add.wasm:0x23');
  });

  it('hits breakpoint upon refresh', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
    });

    await step('add a breakpoint to line No.5', async () => {
      await addBreakpointForLine(frontend, 5);
    });

    await step('reload the page', async () => {
      await target.reload({waitUntil: ['networkidle2', 'domcontentloaded']});
    });

    await checkBreakpointIsActive(5);

    await checkBreakpointDidNotActivate();
    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameScriptLocation('main();', target);
      // TODO(chromium:1043047): Switch to bytecode offsets here.
      assert.deepEqual(scriptLocation, 'add.wasm:0x23');
    });
  });

  it('does not hit the breakpoint after it is removed', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
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
      await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
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
      assert.deepEqual(scriptLocation, 'add.wasm:0x23');
    });

    await step('remove the breakpoint from the fifth line', async () => {
      await frontend.click(await sourceLineNumberSelector(5));
    });

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
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
      assert.deepEqual(scriptLocation, 'add.wasm:0x25');
    });
  });

  it('cannot set a breakpoint on non-breakable line in raw wasm', async () => {
    const {target, frontend} = getBrowserAndPages();

    await openSourceCodeEditorForFile(target, 'add.wasm', 'wasm/call-to-add-wasm.html');
    assert.deepEqual(await getNonBreakableLines(frontend), [
      0x000,
      0x00a,
      0x017,
      0x020,
      0x04b,
    ]);
    // Line 3 is non-breakable.
    await addBreakpointForLine(frontend, 3, true);
    assert.deepEqual(await getBreakpointDecorators(frontend), []);
    // Line 5 is breakable.
    await addBreakpointForLine(frontend, 5);
    assert.deepEqual(await getBreakpointDecorators(frontend), [0x023]);
  });
});

// Disabled to the Chromium binary -> DevTools roller working again.
describe('Raw-Wasm', async () => {
  it('displays correct location in Wasm source', async () => {
    const {target, frontend} = getBrowserAndPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/sources/wasm/callstack-wasm-to-js.html`);

    // This page automatically enters debugging.
    const messageElement = await frontend.waitForSelector('.paused-message');
    const statusMain = await $('.status-main', messageElement);
    const statusMainElement = statusMain.asElement();

    if (!statusMainElement) {
      assert.fail('Unable to find .status-main element');
      return;
    }

    const pauseMessage = await statusMainElement.evaluate(n => n.textContent);

    assert.strictEqual(pauseMessage, 'Debugger paused');

    const sidebar = await messageElement.evaluateHandle(n => n.parentElement);

    // Find second frame of call stack
    const callFrame = (await $('.call-frame-item.selected + .call-frame-item', sidebar)).asElement();
    if (!callFrame) {
      assert.fail('Unable to find callframe');
      return;
    }

    const callFrameTitle = (await $('.call-frame-title-text', callFrame)).asElement();
    if (!callFrameTitle) {
      assert.fail('Unable to find callframe title');
      return;
    }

    const title = await callFrameTitle.evaluate(n => n.textContent);
    const callFrameLocation = (await $('.call-frame-location', callFrame)).asElement();
    if (!callFrameLocation) {
      assert.fail('Unable to find callframe location');
      return;
    }

    const location = await callFrameLocation.evaluate(n => n.textContent);

    assert.strictEqual(title, 'foo');
    assert.strictEqual(location, 'callstack-wasm-to-js.wasm:0x32');

    // Select next call frame.
    await callFrame.press('ArrowDown');
    await callFrame.press('Space');

    // Wasm code for function call should be highlighted
    const codeLine = await frontend.waitForSelector('.cm-execution-line pre');
    const codeText = await codeLine.evaluate(n => n.textContent);

    assert.strictEqual(codeText, '    call $bar');

    // Resume the evaluation
    await click(RESUME_BUTTON);
  });
});
