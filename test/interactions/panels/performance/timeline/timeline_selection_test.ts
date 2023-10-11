// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import type * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';
import type * as LegacyUI from '../../../../../front_end/ui/legacy/legacy.js';
import {getBrowserAndPages, waitFor, waitForMany} from '../../../../shared/helper.js';
import {describe} from '../../../../shared/mocha-extensions.js';
import {loadComponentDocExample, preloadForCodeCoverage} from '../../../helpers/shared.js';

describe('FlameChart', () => {
  preloadForCodeCoverage('performance_panel/basic.html');

  async function getCoordinatesForEntryWithTitleAndTs(
      title: string, tsMicroSecs: number): Promise<{x: number, y: number}> {
    const perfPanel = await waitFor('.vbox.panel.timeline');
    return await perfPanel.evaluate((element: Element, title: string, ts: number) => {
      const panelWidget = element as LegacyUI.Widget.WidgetElement;
      const panel = panelWidget.__widget as Timeline.TimelinePanel.TimelinePanel;
      const mainFlameChart = panel.getFlameChart().getMainFlameChart();
      const data = mainFlameChart.timelineData();
      if (!data) {
        throw new Error('Timeline data was not found');
      }
      const entryIndices =
          data?.entryStartTimes.map((_time, i) => i).filter(index => data.entryStartTimes[index] === (ts / 1000));
      const matchedIndex = entryIndices.find(index => mainFlameChart.entryTitle(index) === title);
      if (!matchedIndex) {
        throw new Error('Match was not found');
      }
      const eventCoordinates = mainFlameChart.entryIndexToCoordinates(matchedIndex);
      if (!eventCoordinates) {
        throw new Error('Coordinates were not found');
      }
      const {x, y} = eventCoordinates;
      return {x, y};
    }, title, tsMicroSecs);
  }

  it('shows the details of an entry when selected on the timeline', async () => {
    await loadComponentDocExample('performance_panel/basic.html?trace=simple-js-program');
    await waitFor('.timeline-flamechart');
    const {frontend} = getBrowserAndPages();

    // Add some margin to the coordinates so that we don't click right
    // in the entry's border.
    const margin = 3;

    // Click on an entry on the timings track first.
    const titleForTimingEntry = 'label1';
    const timeStampForTimingEntry = 251126671072;
    const {x: timingEntryX, y: timingEntryY} =
        await getCoordinatesForEntryWithTitleAndTs(titleForTimingEntry, timeStampForTimingEntry);
    await frontend.mouse.click(timingEntryX + margin, timingEntryY + margin);
    const timingTitleHandle = await waitFor('.timeline-details-chip-title');
    const timingTitle = await timingTitleHandle.evaluate(element => element.innerHTML);
    assert.isTrue(timingTitle.includes('label1'));

    // Now click on an entry on the main thread track and ensure details
    // are visible.
    const titleForMainEntry = 'Task';
    const timeStampForMainEntry = 251126679497;
    const {x: mainEntryX, y: mainEntryY} =
        await getCoordinatesForEntryWithTitleAndTs(titleForMainEntry, timeStampForMainEntry);
    await frontend.mouse.click(mainEntryX + margin, mainEntryY + margin);
    const mainEntryTitles1 = await waitForMany('.timeline-details-chip-title', 2);
    let mainEntryNameHandle = mainEntryTitles1[0];
    let mainEntryName = await mainEntryNameHandle.evaluate(element => element.innerHTML);
    assert.isTrue(mainEntryName.includes('Task'));

    const piechartTitleHandle = mainEntryTitles1[1];
    const piechartTitle = await piechartTitleHandle.evaluate(element => element.innerHTML);
    assert.isTrue(piechartTitle.includes('Aggregated Time'));

    // Ensure details are still visible after some time.
    await new Promise(res => setTimeout(res, 200));
    const mainEntryTitles2 = await waitForMany('.timeline-details-chip-title', 2);
    mainEntryNameHandle = mainEntryTitles2[0];
    mainEntryName = await mainEntryNameHandle.evaluate(element => element.innerHTML);
    assert.isTrue(mainEntryName.includes('Task'));
  });
});
