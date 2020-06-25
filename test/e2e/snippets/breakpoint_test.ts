// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, click, waitFor, enableCDPLogging} from '../../shared/helper.js';
import {createNewSnippet, openSnippetsSubPane, openSourcesPanel, getOpenSources, typeIntoSourcesAndSave, addBreakpointForLine, RESUME_BUTTON, getExecutionLine, getBreakpointDecorators} from '../helpers/sources-helpers.js';

describe('Snippets subpane', () => {
  it('can stop on breakpoints', async () => {
    const snippetName = "Script snippet #7";
    const {frontend} = getBrowserAndPages();
  
    await openSourcesPanel();
    await openSnippetsSubPane();
    await createNewSnippet(snippetName);

    assert.deepEqual(await getOpenSources(), [snippetName]);

    await typeIntoSourcesAndSave(frontend, 'console.log(1);\nconsole.log(2);\nconsole.log(3);\n');

    await addBreakpointForLine(frontend, 1);
    assert.deepEqual(await getBreakpointDecorators(frontend), [2]);
    
    await click('[aria-label="Run snippet"]');

    // We stop on the breakpoint
    await waitFor(RESUME_BUTTON);
    assert.equal(await getExecutionLine(), 2);

    // The breakpoint is still visible
    assert.deepEqual(await getBreakpointDecorators(frontend), [2]);
    assert.deepEqual(await getOpenSources(), [snippetName]);
  });
});
