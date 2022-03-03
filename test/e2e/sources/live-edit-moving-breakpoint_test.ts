// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$textContent, assertNotNullOrUndefined, click, getBrowserAndPages, pressKey, step, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {abbreviatedNameEquals, addBreakpointForLine, openSourceCodeEditorForFile, retrieveTopCallFrameWithoutResuming} from '../helpers/sources-helpers.js';

describe('Live edit', async () => {
  it('moves the breakpoint after reload when changes are not persisted', async () => {
    const {frontend, target} = getBrowserAndPages();
    await openSourceCodeEditorForFile('live-edit-moving-breakpoint.js', 'live-edit-moving-breakpoint.html');

    await step('add two newlines to the script', async () => {
      const editorContent = await waitFor('.cm-content');
      const markerLine = await $textContent('// Insertion marker for newline.', editorContent);
      assertNotNullOrUndefined(markerLine);

      // Place the caret at the end of the marker line by clicking in the middle of the
      // line element and then pressing 'End'.
      await click(markerLine);
      await frontend.keyboard.press('End');

      await frontend.keyboard.press('Enter');
      await frontend.keyboard.press('Enter');
    });

    await step('save the script and wait for the save to go through', async () => {
      await pressKey('s', {control: true});
      await waitFor('[aria-label="live-edit-moving-breakpoint.js"]');
    });
    await step('set a breakpoint in the "await" line', async () => {
      await addBreakpointForLine(frontend, 9);
    });
    await step('reload the page and verify that the breakpoint has moved', async () => {
      target.reload();
    });
    await step('check that the code has paused on the breakpoint at the correct script location', async () => {
      const scriptLocation = await retrieveTopCallFrameWithoutResuming();
      assertNotNullOrUndefined(scriptLocation);
      assert.isTrue(abbreviatedNameEquals(scriptLocation, 'live-edit-moving-breakpoint.js:9'));
    });
  });
});
