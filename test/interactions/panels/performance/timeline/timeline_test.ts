// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages, waitFor} from '../../../../shared/helper.js';
import {describe} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged, itScreenshot} from '../../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

describe('Performance panel', () => {
  preloadForCodeCoverage('performance_panel/basic.html');

  itScreenshot('loads a trace file and renders it in the timeline', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=basic');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline.png', 3);
  });

  itScreenshot('renders the timeline correctly when scrolling', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    const {frontend} = getBrowserAndPages();
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    const {x, y} = await panel.evaluate(
        p => {
          const {x, width, y, height} = p.getBoundingClientRect();
          return {x: x + width / 2, y: y + height / 2};
        },
    );
    await frontend.mouse.move(x, y);
    await frontend.keyboard.down('Shift');
    await frontend.mouse.wheel({deltaY: 500});
    await frontend.keyboard.up('Shift');

    await assertElementScreenshotUnchanged(panel, 'performance/timeline_canvas_scrolldown.png', 3);
  });

  itScreenshot('loads a cpuprofile and renders it in non-node mode', async () => {
    await loadComponentDocExample('performance_panel/basic.html?cpuprofile=node-fibonacci-website');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/cpu-profile.png', 3);
  });

  itScreenshot('loads a cpuprofile and renders it in node mode', async () => {
    await loadComponentDocExample('performance_panel/basic.html?cpuprofile=node-fibonacci-website&isNode=true');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/cpu-profile-node.png', 3);
  });

  itScreenshot('candy stripes long tasks', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-long-task-candystripe.png', 2);
  });
});
