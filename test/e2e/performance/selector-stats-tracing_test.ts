// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, step, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getDataGridRows} from '../helpers/datagrid-helpers.js';
import {
  enableAdvancedRenderingInstrumentation,
  navigateToPerformanceTab,
  navigateToSelectorStatsTab,
  selectRecalculateStylesEvent,
  startRecording,
  stopRecording,
} from '../helpers/performance-helpers.js';
import {getOpenSources} from '../helpers/sources-helpers.js';

async function validateSourceTabs() {
  await step('Validate exactly one source file is open', async () => {
    const openSources = await waitForFunction(async () => {
      const sources = await getOpenSources();
      return sources.length ? sources : undefined;
    });
    assert.deepEqual(openSources, ['page-with-style.css']);
  });
}

describe('The Performance panel', function() {
  // These tests move between panels, which takes time.
  if (this.timeout() !== 0) {
    this.timeout(30000);
  }

  async function advancedRenderingInstrumentationRecording(testName: string) {
    const {target} = getBrowserAndPages();
    await navigateToPerformanceTab(testName);
    await enableAdvancedRenderingInstrumentation();
    await startRecording();
    await target.reload();
    await stopRecording();
  }

  it('Includes a selector stats table in recalculate style events', async () => {
    await advancedRenderingInstrumentationRecording('empty');

    await step('Open select stats for a recorded "Recalculate Styles" event', async () => {
      await selectRecalculateStylesEvent();
      await navigateToSelectorStatsTab();
    });

    await step('Check that the selector stats table was rendered successfully', async () => {
      // Since the exact selector text, order, and match counts are implementation defined,
      // we are just checking whether any rows are rendered. This indicates that the trace events
      // we receive from the backend have the expected object structure. If the structure ever
      // changes, the data grid will fail to render and cause this test to fail.
      const rows =
          await getDataGridRows(1 /* expectedNumberOfRows*/, undefined /* root*/, false /* matchExactNumberOfRows*/);
      assert.isAtLeast(rows.length, 1, 'Selector stats table should contain at least one row');
    });
  });

  it('Can navigate to CSS file in source panel via available link in selector stats table', async () => {
    await advancedRenderingInstrumentationRecording('selectorStats/page-with-style');

    await step('Check that the selector stats table was rendered successfully by default', async () => {
      await navigateToSelectorStatsTab();
      const rows =
          await getDataGridRows(1 /* expectedNumberOfRows*/, undefined /* root*/, false /* matchExactNumberOfRows*/);
      assert.isAtLeast(rows.length, 1, 'Selector stats table should contain at least one row');
    });

    await step('Validate source file is open via available link in selector stats table', async () => {
      await click('devtools-linkifier');
      // Look at source tabs
      await validateSourceTabs();
    });
  });
});
