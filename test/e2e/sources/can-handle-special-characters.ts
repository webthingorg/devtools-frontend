// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {addBreakpointForLine, getBreakpointDecorators, getExecutionLineText, openFileInEditor, openFileInSourcesPanel, RESUME_BUTTON} from '../helpers/sources-helpers.js';

describe('Sources Tab', async () => {
  async function runTest(filename: string, functionName: string) {
    const {frontend, target} = getBrowserAndPages();

    await openFileInEditor(filename);
    await addBreakpointForLine(frontend, 2);

    const scriptEvaluation = target.evaluate(functionName + '();');
    await waitFor(RESUME_BUTTON);

    // Breakpoint is still visible
    assert.deepEqual(await getBreakpointDecorators(frontend), [2]);

    // Execution line is highlighted and matches the expected file
    assert.strictEqual(await getExecutionLineText(), `    console.log('${functionName}');`);

    await click(RESUME_BUTTON);
    await scriptEvaluation;
  }

  it('can handle filename with space loading over the network', async () => {
    await openFileInSourcesPanel('filesystem/special-characters.html');
    await runTest('with space.js', 'f1');
  });

  it('can handle filename with escape sequence loading over the network', async () => {
    await openFileInSourcesPanel('filesystem/special-characters.html');
    await runTest('with%20space.js', 'f2');
  });
});
