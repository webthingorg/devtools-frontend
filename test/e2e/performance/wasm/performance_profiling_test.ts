// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import * as puppeteer from 'puppeteer';

import {getBrowserAndPages, step, waitFor} from '../../../shared/helper.js';
import {describe, it} from '../../../shared/mocha-extensions.js';
import {ACTIVITY_COLUMN_SELECTOR, navigateToCallTreeTab, retrieveSelectedAndExpandedActivityItems} from '../../helpers/performance-helpers.js';
import {clickOnFunctionLink, getTotalTimeFromSummary, navigateToBottomUpTab, navigateToPerformanceTab, retrieveActivity, searchForComponent, startRecording, stopRecording} from '../../helpers/performance-helpers.js';

async function expandActivityTree(frontend: puppeteer.Page, expected_activities: string[]) {
  for (let index = 0; index < ((expected_activities.length - 1) * 2); index++) {
    await frontend.keyboard.press('ArrowRight');
  }
  await waitFor('.selected > td.activity-column');
}

describe('The Performance panel', async function() {
  // The tests in this suite are particularly slow, as they perform a lot of actions
  this.timeout(10000);

  beforeEach(async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to the Performance tab', async () => {
      await navigateToPerformanceTab('wasm/profiling');
    });

    await step('open up the console', async () => {
      await frontend.keyboard.press('Escape');
      await waitFor('.console-searchable-view');
    });

    await step('click the record button', async () => {
      await startRecording();
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('navigate to console-filter.html and get console messages', async () => {
      await waitFor('.console-message-text .source-code');
    });

    await step('stop the recording', async () => {
      await stopRecording();
    });

    await step('search for "main"', async () => {
      await searchForComponent(frontend, 'main');
    });
  });

  // Link to wasm function is broken in profiling tab
  it.skip('[crbug.com/1125986] is able to inspect how long a wasm function takes to execute', async () => {
    await step('check that the total time is more than zero', async () => {
      const totalTime = await getTotalTimeFromSummary();
      assert.isAbove(totalTime, 0, 'total time for "main" is not above zero');
    });

    await step('click on the function link', async () => {
      await clickOnFunctionLink();
    });

    // TODO(almuthanna): this step will be added once the bug crbug.com/1125986 is solved
    await step(
        'check that the system has navigated to the Sources tab with the "main" function highlighted',
        async () => {
            // step pending
        });
  });

  it('is able to display the execution time for a wasm function', async () => {
    await step('check that the Summary tab shows more than zero total time for "main"', async () => {
      const total_time = await getTotalTimeFromSummary();
      assert.isAbove(total_time, 0, 'main function execution time is displayed incorrectly');
    });
  });

  it('is able to inspect the call stack for a wasm function from the bottom up', async () => {
    const {frontend} = getBrowserAndPages();
    const expected_activities = ['main', 'js-to-wasm::i', '(anonymous)', 'Run Microtasks'];

    await step('navigate to the Bottom Up tab', async () => {
      await navigateToBottomUpTab();
    });

    await step('expand the tree for the "main" activity', async () => {
      await waitFor(ACTIVITY_COLUMN_SELECTOR);
      const main_activity = await retrieveActivity(frontend, 'main');
      await main_activity!.click();
      await expandActivityTree(frontend, expected_activities);
    });

    await step('check that the expanded tree is displaying the correct activity names', async () => {
      assert.deepEqual(
          await retrieveSelectedAndExpandedActivityItems(frontend), expected_activities,
          'tree does not display the values correctly');
    });
  });

  it('is able to inspect the call stack for a wasm function from the call tree', async () => {
    const {frontend} = getBrowserAndPages();
    const expected_activities = [
      'Run Microtasks',
      '(anonymous)',
      'js-to-wasm::i',
      'main',
      'getTime',
    ];

    await step('navigate to the Call Tree tab', async () => {
      await navigateToCallTreeTab();
    });

    await step(
        'expand the tree for the "Run Microtasks" activity and check that it displays the correct values', async () => {
          await expandActivityTree(frontend, expected_activities);

          assert.deepEqual(
              await retrieveSelectedAndExpandedActivityItems(frontend), expected_activities,
              'tree does not display the values correctly');
        });
  });
});
