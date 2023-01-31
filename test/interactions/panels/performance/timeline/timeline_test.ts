// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {waitFor} from '../../../../shared/helper.js';
import {describe} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged, itScreenshot} from '../../../../shared/screenshots.js';
import {loadComponentDocExample} from '../../../helpers/shared.js';

describe('Performance panel', () => {
  itScreenshot('renders the timeline correctly', async () => {
    // eslint-disable-next-line no-console
    console.log('aaaa');
    await loadComponentDocExample('performance_panel/basic.html?trace=animation');
    // eslint-disable-next-line no-console
    console.log('bbbbb');
    await waitFor('#timeline-overview-panel');
    // eslint-disable-next-line no-console
    console.log('cccccc');
    const panel = await waitFor('body');
    // eslint-disable-next-line no-console
    console.log('dddddd');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline.png');
    // eslint-disable-next-line no-console
    console.log('eeeeee');
  });
});
