// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getCurrentConsoleMessages} from '../helpers/console-helpers.js';
import {
  getOpenSources,
  retrieveCodeMirrorEditorContent,
  retrieveTopCallFrameScriptLocation,
  waitForLines,
} from '../helpers/sources-helpers.js';

describe('Sources Panel', async () => {
  it('handles sourcemaps with conflicting versions of same file', async () => {
    const {target} = getBrowserAndPages();
    await goToResource('sources/multi-sourcemap.html');

    const tests = [
      {name: 'testA', fn: 'test1', log: 'A'},
      {name: 'testB', fn: 'test2', log: 'B'},
      {name: 'testC', fn: 'test1', log: 'A'},
    ];

    for (const {name, fn, log} of tests) {
      const topCallFrame = await retrieveTopCallFrameScriptLocation(`window.${name}();`, target);
      assert.strictEqual(topCallFrame, 'source.ts:3');

      // Source code matches the correct file
      await waitForLines(4);
      const lines = await retrieveCodeMirrorEditorContent();
      assert.strictEqual(lines[0], `export function ${fn}(): void {`);
      assert.strictEqual(lines[1], `  console.log('${log}');`);
    }

    // Only one tab open
    assert.deepEqual(await getOpenSources(), ['source.ts']);
    assert.deepEqual(await getCurrentConsoleMessages(true), ['source.ts:2 A', 'source.ts:2 B', 'source.ts:2 A']);

    // Click the link for the 'B' log message
    await click(
        '.console-group-messages .console-message-wrapper ~ .console-message-wrapper .console-message-anchor .devtools-link');
    // This should take us to the sources panel
    await waitFor('[aria-label="Sources panel"]');
    // The code should say to log 'B'
    await waitForLines(4);
    const lines = await retrieveCodeMirrorEditorContent();
    assert.strictEqual(lines[1], '  console.log(\'B\');');
  });
});
