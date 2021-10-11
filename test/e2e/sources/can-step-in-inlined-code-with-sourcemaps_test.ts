// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, debuggerStatement, getBrowserAndPages, step, timeout, waitFor, waitForFunction} from '../../shared/helper.js';
import {addBreakpointForLine, checkBreakpointDidNotActivate, isBreakpointSet, openSourceCodeEditorForFile, stepThroughTheCode, TURNED_OFF_PAUSE_BUTTON_SELECTOR} from '../helpers/sources-helpers.js';

describe('Sources Tab', async function() {
  it.only('is able to step through source-mapped wasm code that includes inlining', async () => {
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

    await waitForFunction(async () => {
      return await isBreakpointSet(11) === true;
    });
  });
});
