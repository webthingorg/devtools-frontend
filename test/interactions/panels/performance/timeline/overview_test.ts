// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../../../shared/helper.js';
import {describe, itScreenshot} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged} from '../../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

describe('Performance panel overview/minimap', () => {
  preloadForCodeCoverage('performance_panel/overview.html');
  itScreenshot('renders the overview', async () => {
    await loadComponentDocExample('performance_panel/overview.html?trace=web-dev');
    const pane = await waitFor('.container #timeline-overview-pane');
    await assertElementScreenshotUnchanged(pane, 'performance/timeline-overview.png', 0);
  });

  itScreenshot('shows a red bar for a long task', async () => {
    await loadComponentDocExample('performance_panel/overview.html?trace=one-second-interaction');
    const pane = await waitFor('.container #timeline-overview-pane');
    await assertElementScreenshotUnchanged(pane, 'performance/timeline-overview-long-task-red-bar.png', 0);
  });

  itScreenshot('shows network requests in the overview', async () => {
    await loadComponentDocExample('performance_panel/overview.html?trace=many-requests');
    const pane = await waitFor('.container #timeline-overview-pane');
    await assertElementScreenshotUnchanged(pane, 'performance/timeline-overview-busy-network.png', 0);
  });

  itScreenshot('shows the memory usage', async () => {
    await loadComponentDocExample('performance_panel/overview.html?trace=web-dev');
    const pane = await waitFor('.container-with-memory #timeline-overview-pane');
    await assertElementScreenshotUnchanged(pane, 'performance/timeline-overview-memory.png', 0);
  });
});
