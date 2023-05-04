// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages} from '../../conductor/puppeteer-state.js';
import {click, waitForMany} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToPerformanceTab, startRecording, stopRecording} from '../helpers/performance-helpers.js';
import {openSourcesPanel} from '../helpers/sources-helpers.js';

describe('The Performance panel', () => {
  // issue on Mac
  it.skipOnPlatforms(
      ['mac', 'win32'], '[crbug.com/1428866] can collect a line-level CPU profile and show it in the text editor',
      async () => {
        const {target} = getBrowserAndPages();
        await navigateToPerformanceTab();
        await startRecording();
        await target.evaluate(() => {
          (function() {
            const endTime = Date.now() + 100;
            let s = 0;
            while (Date.now() < endTime) {
              s += Math.cos(s);
            }
            return s;
          })();
        });
        await stopRecording();
        await openSourcesPanel();
        await click('[aria-label="__puppeteer_evaluation_script__, domain"]', {clickOptions: {clickCount: 2}});
        await click('[aria-label=", file"]', {clickOptions: {clickCount: 2}});
        await waitForMany('.cm-performanceGutter .cm-gutterElement', 2);
      });
});
