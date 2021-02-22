// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, getPendingEvents, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {addBreakpointForLine, checkBreakpointIsActive, DEBUGGER_PAUSED_EVENT, openSourceCodeEditorForFile, RESUME_BUTTON, retrieveTopCallFrameWithoutResuming} from '../helpers/sources-helpers.js';

describe('The Sources Tab', async () => {
  it('sets multiple breakpoints in case of inlining', async () => {
    const {target, frontend} = getBrowserAndPages();

    await openSourceCodeEditorForFile('input.js', 'sourcemap-inlining-jscompiler.html');
    await addBreakpointForLine(frontend, 3);
    await checkBreakpointIsActive(3);

    // manhatten() function calls absDistance() twice (JSCompiler inlined it).
    const evaluation = target.evaluate('manhatten({x: 1, y: 2}, {x: 3, y: 4});');
    const scriptLocation1 = await retrieveTopCallFrameWithoutResuming();
    assert.deepEqual(scriptLocation1, 'input.js:3');
    await click(RESUME_BUTTON);
    await waitForFunction(() => getPendingEvents(frontend, DEBUGGER_PAUSED_EVENT));
    const scriptLocation2 = await retrieveTopCallFrameWithoutResuming();
    assert.deepEqual(scriptLocation2, 'input.js:3');
    await evaluation;
  });
});
