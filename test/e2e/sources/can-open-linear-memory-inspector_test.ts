// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {enableExperiment, getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {addBreakpointForLine, clickOnContextMenu, openSourceCodeEditorForFile, waitForSourceCodeLines} from '../helpers/sources-helpers.js';

describe('Scope View', async () => {
  it('opens linear memory inspector', async () => {
    await enableExperiment('wasmDWARFDebugging');

    const {frontend, target} = getBrowserAndPages();
    const breakpointLine = 5;
    const numberOfLines = 7;

    await step('navigate to a page and open the Sources tab', async () => {
      await openSourceCodeEditorForFile('memory.wasm', 'wasm/memory.html');
    });

    await step(`add a breakpoint to line No.${breakpointLine}`, async () => {
      await addBreakpointForLine(frontend, breakpointLine);
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('wait for all the source code to appear', async () => {
      await waitForSourceCodeLines(numberOfLines);
    });

    await step('open linear memory inspector from context menu', async () => {
      await clickOnContextMenu('[aria-label="imports.memory"]', 'Inspect memory');
    });

    await step('check that linear memory inspector is open', async () => {
      await waitFor('devtools-linear-memory-inspector-inspector');
    });
  });
});
