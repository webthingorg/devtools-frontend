// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../../../shared/helper.js';
import {describe} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged, itScreenshot} from '../../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

describe('Performance panel overview/minimap', () => {
  preloadForCodeCoverage('performance_panel/overview.html');
  itScreenshot('renders the overview', async () => {
    await loadComponentDocExample('performance_panel/overview.html?trace=web-dev');
    const pane = await waitFor('#timeline-overview-pane');
    await assertElementScreenshotUnchanged(pane, 'performance/timeline-overview.png', 3);
  });
});
