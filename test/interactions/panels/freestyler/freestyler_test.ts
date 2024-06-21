// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../../shared/helper.js';
import {describe, itScreenshot} from '../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged} from '../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../helpers/shared.js';

describe('Freestyler', function() {
  preloadForCodeCoverage('freestyler/basic.html');

  // eslint-disable-next-line rulesdir/ban_screenshot_test_outside_perf_panel
  itScreenshot('renders the empty state', async () => {
    await loadComponentDocExample('freestyler/empty_state.html');
    await assertElementScreenshotUnchanged(
        await waitFor('devtools-freestyler-chat-ui'), 'freestyler/empty_state.png', 3);
  });

  // eslint-disable-next-line rulesdir/ban_screenshot_test_outside_perf_panel
  itScreenshot('renders a basic markdown example', async () => {
    await loadComponentDocExample('freestyler/basic.html');
    await assertElementScreenshotUnchanged(
        await waitFor('devtools-freestyler-chat-ui'), 'freestyler/basic_markdown.png', 3);
  });
});
