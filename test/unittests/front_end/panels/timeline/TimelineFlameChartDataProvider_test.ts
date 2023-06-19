// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as TraceEngine from '../../../../../front_end/models/trace/trace.js';
import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {allModelsFromFile} from '../../helpers/TraceHelpers.js';

describeWithEnvironment('TimelineFlameChartDataProvider', () => {
  describe('groupTreeEvents', () => {
    it('returns the correct events for tree views given a flame chart group', async () => {
      const dataProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
      const {traceParsedData, performanceModel} = await allModelsFromFile('sync-like-timings.json.gz');
      dataProvider.setModel(performanceModel, traceParsedData);
      const timingsTrackGroup = dataProvider.timelineData().groups.find(g => g.name === 'Timings');
      if (!timingsTrackGroup) {
        assert.fail('Could not find Timings track flame chart group');
      }
      const groupTreeEvents = dataProvider.groupTreeEvents(timingsTrackGroup);
      const allTimingEvents = [
        ...traceParsedData.UserTimings.consoleTimings,
        ...traceParsedData.UserTimings.timestampEvents,
        ...traceParsedData.UserTimings.performanceMarks,
        ...traceParsedData.UserTimings.performanceMeasures,
        ...traceParsedData.PageLoadMetrics.allMarkerEvents,
      ];
      assert.deepEqual(groupTreeEvents, allTimingEvents);
    });

    it('filters out async events if they cannot be added to the tree', async () => {
      const dataProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
      const {traceParsedData, performanceModel} = await allModelsFromFile('timings-track.json.gz');
      dataProvider.setModel(performanceModel, traceParsedData);
      const timingsTrackGroup = dataProvider.timelineData().groups.find(g => g.name === 'Timings');
      if (!timingsTrackGroup) {
        assert.fail('Could not find Timings track flame chart group');
      }
      const groupTreeEvents = dataProvider.groupTreeEvents(timingsTrackGroup);
      assert.strictEqual(groupTreeEvents?.length, 11);
      const allEventsAreSync = groupTreeEvents?.every(
          event => !TraceEngine.Types.TraceEvents.isAsyncPhase(SDK.TracingModel.phaseForEvent(event)));
      assert.isTrue(allEventsAreSync);
    });

    it('returns data from the old engine if necessary', async () => {
      const dataProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
      const {traceParsedData, performanceModel} = await allModelsFromFile('timings-track.json.gz');
      dataProvider.setModel(performanceModel, traceParsedData);
      const mainTrack = dataProvider.timelineData().groups.find(g => g.name.includes('Main'));
      if (!mainTrack) {
        assert.fail('Could not find Main track flame chart group');
      }
      const groupTreeEvents = dataProvider.groupTreeEvents(mainTrack);
      assert.strictEqual(groupTreeEvents?.length, 28995);
    });
  });

  it('adds candy stripe decorations to long tasks in the main thread', async () => {
    const dataProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
    const {traceParsedData, performanceModel} = await allModelsFromFile('one-second-interaction.json.gz');
    dataProvider.setModel(performanceModel, traceParsedData);

    const {entryDecorations} = dataProvider.timelineData();

    const definedDecorationIndexes: number[] = [];
    entryDecorations.forEach((decorationsForEvent, index) => {
      if (decorationsForEvent && decorationsForEvent.length > 0) {
        definedDecorationIndexes.push(index);
      }
    });

    // Expect two decorations: the striping on the interaction, and the
    // striping on the long task.
    assert.lengthOf(definedDecorationIndexes, 2);

    const titles = definedDecorationIndexes.map(index => {
      return dataProvider.entryTitle(index);
    });

    assert.deepEqual(titles, [
      'Pointer',  // The interaction event in the Interactions track for the pointer event.
      'Task',     // The Long task that was caused by the pointer and contributed to the long time.
    ]);
  });

  it('populates the frames track with frames and screenshots', async () => {
    const dataProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
    const {traceParsedData, performanceModel} = await allModelsFromFile('web-dev.json.gz');
    dataProvider.setModel(performanceModel, traceParsedData);
    const framesTrack = dataProvider.timelineData().groups.find(g => {
      return g.name.includes('Frames');
    });
    if (!framesTrack) {
      throw new Error('Could not find expected Frames track');
    }
    const framesLevel = framesTrack.startLevel;
    const screenshotsLevel = framesLevel + 1;
    // The frames track first shows the frames, and then shows screenhots just below it.
    assert.strictEqual(
        dataProvider.getEntryTypeForLevel(framesLevel), Timeline.TimelineFlameChartDataProvider.EntryType.Frame);
    assert.strictEqual(
        dataProvider.getEntryTypeForLevel(screenshotsLevel),
        Timeline.TimelineFlameChartDataProvider.EntryType.Screenshot);

    // There are 5 screenshots in this trace, so we expect there to be 5 events on the screenshots track level.
    const eventsOnScreenshotsLevel = dataProvider.timelineData().entryLevels.filter(e => e === screenshotsLevel);
    assert.lengthOf(eventsOnScreenshotsLevel, 5);
  });
});
