// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, getBrowserAndPages, timeout, waitFor, waitForFunction} from '../../../../shared/helper.js';
import {describe, itScreenshot} from '../../../../shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged} from '../../../../shared/screenshots.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

describe('Performance panel', function() {
  preloadForCodeCoverage('performance_panel/basic.html');

  itScreenshot('loads a trace file and renders it in the timeline', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=basic');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline.png', 3);
  });

  itScreenshot('renders correctly the Bottom Up datagrid', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    await waitFor('.timeline-flamechart');
    await waitFor('div.tabbed-pane');
    await click('#tab-BottomUp');
    const datagrid = await waitFor('.timeline-tree-view');
    await waitForFunction(async () => {
      const datagrid = await waitFor('.timeline-tree-view');
      const height = await datagrid.evaluate(elem => elem.clientHeight);
      return height > 150;
    });
    await assertElementScreenshotUnchanged(datagrid, 'performance/bottomUp.png', 3);
  });

  itScreenshot('renders correctly the Call Tree datagrid', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    await waitFor('.timeline-flamechart');
    await waitFor('div.tabbed-pane');
    await click('#tab-CallTree');
    const datagrid = await waitFor('.timeline-tree-view');
    await waitForFunction(async () => {
      const datagrid = await waitFor('.timeline-tree-view');
      const height = await datagrid.evaluate(elem => elem.clientHeight);
      return height > 150;
    });
    await assertElementScreenshotUnchanged(datagrid, 'performance/callTree.png', 3);
  });

  itScreenshot('renders the timeline correctly when scrolling', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');

    const virtualScrollBar = await waitFor('div.chart-viewport-v-scroll.always-show-scrollbar');

    await virtualScrollBar.evaluate(el => {
      el.scrollTop = 200;
    });
    await assertElementScreenshotUnchanged(panel, 'performance/timeline_canvas_scrolldown.png', 3);
  });

  itScreenshot('loads a cpuprofile and renders it in non-node mode', async () => {
    await loadComponentDocExample('performance_panel/basic.html?cpuprofile=node-fibonacci-website');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/cpu-profile.png', 3);
  });

  itScreenshot(
      'loads a cpuprofile and renders it in node mode with default track source set to new engine', async () => {
        await loadComponentDocExample('performance_panel/basic.html?cpuprofile=node-fibonacci-website&isNode=true');
        await waitFor('.timeline-flamechart');
        const panel = await waitFor('body');
        await assertElementScreenshotUnchanged(panel, 'performance/cpu-profile-node-new-engine.png', 3);
      });

  itScreenshot(
      'loads a cpuprofile and renders it in node mode with default track source set to old engine', async () => {
        await loadComponentDocExample('performance_panel/basic.html?cpuprofile=node-fibonacci-website&isNode=true');
        await waitFor('.timeline-flamechart');
        const panel = await waitFor('body');
        await assertElementScreenshotUnchanged(panel, 'performance/cpu-profile-node-old-engine.png', 3);
      });

  itScreenshot('candy stripes long tasks', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=one-second-interaction');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-long-task-candystripe.png', 2);
  });

  // Flaky test
  itScreenshot.skip('[crbug.com/1511265]: renders screenshots in the frames track', async () => {
    await loadComponentDocExample(
        'performance_panel/basic.html?trace=web-dev-with-commit&flamechart-force-expand=frames');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    // With some changes made to timeline-details-view it passes with a diff of 1.98 so reduce it to 1.
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-web-dev-screenshot-frames.png', 1);
  });

  itScreenshot('renders correctly with the NEW_ENGINE ThreadTracksSource', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=web-dev');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-web-dev-new-engine.png', 1);
  });

  itScreenshot('supports the network track being expanded and then clicked', async function() {
    await loadComponentDocExample('performance_panel/basic.html?trace=web-dev');
    await waitFor('.timeline-flamechart');
    const panel = await waitFor('body');

    const {frontend} = getBrowserAndPages();
    // Click to expand the network track.
    await frontend.mouse.click(27, 131);
    await timeout(100);  // cannot await for DOM as this is a purely canvas change.
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-expand-network-panel.png', 1);
    // Click to select a network event.
    await frontend.mouse.click(104, 144);
    await timeout(100);  // cannot await for DOM as this is a purely canvas change.
    await assertElementScreenshotUnchanged(panel, 'performance/timeline-expand-network-panel-and-select-event.png', 1);
  });
});
