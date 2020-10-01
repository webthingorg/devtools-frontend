// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$, getBrowserAndPages, step, timeout, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {ACTIVITY_COLUMN_SELECTOR, navigateToCallTreeTab, TOTAL_TIME_SELECTOR} from '../helpers/performance-helpers.js';
import {clickOnFunctionLink, getTotalTimeFromSummary, navigateToBottomUpTab, navigateToPerformanceTab, navigateToSummaryTab, retrieveActivity, searchForComponent, startRecording, stopRecording} from '../helpers/performance-helpers.js';

describe('The Performance panel', () => {
  // Link to wasm function is broken in profiling tab
  it.skip('[crbug.com/1125986] is able to inspect how long a wasm function takes to execute', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to the Performance tab', async () => {
      await navigateToPerformanceTab('wasm/profiling');
    });

    await step('click the record button', async () => {
      await startRecording();
    });

    await step('reload the page', async () => {
      await target.reload();
    });

    await step('stop the recording', async () => {
      await stopRecording();
    });

    await step('click on the Summary tab', async () => {
      await navigateToSummaryTab();
    });

    await step('search for "main"', async () => {
      await searchForComponent(frontend, 'main');
    });

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

  it('is able to inspect the call stack for a wasm function from the bottom up', async () => {
    const {target, frontend} = getBrowserAndPages();

    await step('navigate to the Performance tab', async () => {
      await navigateToPerformanceTab('wasm/profiling');
    });

    await step('click the record button', async () => {
      await startRecording();
    });

    await step('reload the page', async () => {
      await target.reload();
      await timeout(3000);
    });

    await step('stop the recording', async () => {
      await stopRecording();
    });

    await step('click on the Bottom-Up tab', async () => {
      await navigateToBottomUpTab();
    });

    await step('search for "main"', async () => {
      await searchForComponent(frontend, 'main');
    });

    await step('click on the "main" activity', async () => {
      await waitFor(ACTIVITY_COLUMN_SELECTOR);
      const main_activity = await retrieveActivity(frontend, 'main');
      await main_activity!.click();
    });

    await step('Check that the Summary tab shows more than zero total time for "main"', async () => {
      await navigateToSummaryTab();
      const total_time_el = await $(TOTAL_TIME_SELECTOR);
      const total_time =
          +String(await (await total_time_el!.getProperty('innerHTML')).jsonValue()).replace('&nbsp;ms', '');
      assert.isAbove(total_time, 0, 'main function execution time is displayed incorrectly');
    });

    await step('Navigate to the Bottom Up tab', async () => {
      await navigateToBottomUpTab();
    });

    await step('Expand the tree for the "main" activity', async () => {
      await waitFor(ACTIVITY_COLUMN_SELECTOR);
      const main_activity = await retrieveActivity(frontend, 'main');
      await main_activity!.click();
      for (let index = 0; index < 6; index++) {
        await frontend.keyboard.press('ArrowRight');
      }
      await waitFor('.selected > td.activity-column');
    });

    await step('Check that the expanded tree is displaying the correct activity names', async () => {
      const tree_items = await frontend.$$('.expanded > td.activity-column,.selected > td.activity-column');
      const tree = [];
      for (const item of tree_items) {
        tree.push(await frontend.evaluate(el => el.innerText.split('\n')[0], item));
      }

      assert.deepEqual(
          tree, ['main', 'js-to-wasm::i', '(anonymous)', 'Run Microtasks'],
          'tree does not display the values correctly');
    });

    await step('Navigate to the Call Tree tab', async () => {
      await navigateToCallTreeTab();
    });

    await step(
        'Expand the tree for the "Run Microtasks" activity and check that it displays the correct values', async () => {
          const tree = [];
          let tree_items = await frontend.$$('.expanded > td.activity-column,.selected > td.activity-column');
          for (const item of tree_items) {
            tree.push(await frontend.evaluate(el => el.innerText.split('\n')[0], item));
          }

          for (let index = 0; index < 10; index++) {
            await frontend.keyboard.press('ArrowRight');
          }

          await waitFor('.selected > td.activity-column');

          tree_items = await frontend.$$('.expanded > td.activity-column,.selected > td.activity-column');
          for (const item of tree_items) {
            tree.push(await frontend.evaluate(el => el.innerText.split('\n')[0], item));
          }

          assert.deepEqual(
              tree,
              [
                'Run Microtasks',
                '(anonymous)',
                'js-to-wasm::i',
                'main',
                'getTime',
                'Minor GC',
              ],
              'tree does not display the values correctly');
        });
  });
});
