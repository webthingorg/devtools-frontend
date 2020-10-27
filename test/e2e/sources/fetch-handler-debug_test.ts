// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {addBreakpointForLine, checkBreakpointIsActive, openSourceCodeEditorForFile, waitForSourceCodeLines} from '../helpers/sources-helpers.js';

const FETCH_BUTTON_SELECTOR = 'FetchButton1';
const FETCH_XHR_BUTTON_SELECTOR = 'FetchButton2';
const numberOfLines = 10;
const CALL_FRAME_ASYNC_HEADER_SELECTOR = '.call-frame-item.async-header';

describe('The Sources Tab', async function() {
  // The tests in this suite are particularly slow, as they perform a lot of actions
  this.timeout(10000);

  before(async () => {
    const {frontend} = getBrowserAndPages();
    await openSourceCodeEditorForFile('sw1.js', 'simple-service-worker.html');
    await waitForSourceCodeLines(numberOfLines);
    await addBreakpointForLine(frontend, 3);
  });

  async function checkStackFrameAfterHitBreakpoint() {
    // Wait for break point to show up
    await waitForSourceCodeLines(numberOfLines);
    await checkBreakpointIsActive(3);

    // Query the stack frame item: async header
    await waitFor(CALL_FRAME_ASYNC_HEADER_SELECTOR);
  }

  it('can show page script stack when break in handler via fetch API', async () => {
    const {target} = getBrowserAndPages();
    // Initiate a fetch event via fetch API
    await target.click(FETCH_BUTTON_SELECTOR);

    await checkStackFrameAfterHitBreakpoint();
  });

  it('can show page script stack when break in handler via XHR API', async () => {
    const {target} = getBrowserAndPages();
    // Initiate a fetch event via XHR API
    await target.click(FETCH_XHR_BUTTON_SELECTOR);

    await checkStackFrameAfterHitBreakpoint();
  });
});
