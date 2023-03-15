// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import * as Timeline from '../../../../../../front_end/panels/timeline/timeline.js';
import * as PerfUI from '../../../../../../front_end/ui/legacy/components/perf_ui/perf_ui.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';
import {traceModelFromTraceFile} from '../../../helpers/TimelineHelpers.js';
import {loadModelDataFromTraceFile} from '../../../helpers/TraceHelpers.js';

import type * as TimelineModel from '../../../../../../front_end/models/timeline_model/timeline_model.js';

const {assert} = chai;

function initTrackAppender(
    flameChartData: PerfUI.FlameChart.TimelineData, traceParsedData: TraceModel.Handlers.Types.TraceParseData,
    entryData: Timeline.TimelineFlameChartDataProvider.TimelineFlameChartEntry[],
    entryTypeByLevel: Timeline.TimelineFlameChartDataProvider.EntryType[],
    timelineModel: TimelineModel.TimelineModel.TimelineModelImpl):
    Timeline.InteractionsTrackAppender.InteractionsTrackAppender {
  const compatibilityTracksAppender = new Timeline.CompatibilityTracksAppender.CompatibilityTracksAppender(
      flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
  return compatibilityTracksAppender.interactionsTrackAppender();
}

describeWithEnvironment('InteractionsTrackAppender', () => {
  let traceParsedData: TraceModel.Handlers.Types.TraceParseData;
  let timelineModel: TimelineModel.TimelineModel.TimelineModelImpl;
  let interactionsTrackAppender: Timeline.InteractionsTrackAppender.InteractionsTrackAppender;
  let entryData: Timeline.TimelineFlameChartDataProvider.TimelineFlameChartEntry[] = [];
  let flameChartData = new PerfUI.FlameChart.TimelineData([], [], [], []);
  let entryTypeByLevel: Timeline.TimelineFlameChartDataProvider.EntryType[] = [];
  beforeEach(async () => {
    traceParsedData = await loadModelDataFromTraceFile('slow-interaction-button-click.json.gz');
    timelineModel = (await traceModelFromTraceFile('slow-interaction-button-click.json.gz')).timelineModel;
    interactionsTrackAppender =
        initTrackAppender(flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
    interactionsTrackAppender.appendTrackAtLevel(0);
  });
  afterEach(() => {
    entryData = [];
    flameChartData = new PerfUI.FlameChart.TimelineData([], [], [], []);
    entryTypeByLevel = [];
  });

  describe('appendTrackAtLevel', () => {
    it('marks all levels used by the track with the `TrackAppender` type', () => {
      // Five levels should be taken: 1 for page load marks, 1 added for spacing
      // between page load marks and user timings and 3 used by user timings.
      const levelCount = 2;
      assert.strictEqual(entryTypeByLevel.length, levelCount);
      const allEntriesAreTrackAppender =
          entryTypeByLevel.every(type => type === Timeline.TimelineFlameChartDataProvider.EntryType.TrackAppender);
      assert.isTrue(allEntriesAreTrackAppender);
    });

    it('creates a flamechart group', () => {
      assert.strictEqual(flameChartData.groups.length, 1);
      assert.strictEqual(flameChartData.groups[0].name, 'Interactions');
    });

    it('adds all interactions with the correct start times', () => {
      const events = traceParsedData.UserInteractions.interactionEvents;
      for (const event of events) {
        const markerIndex = entryData.indexOf(event);
        assert.isDefined(markerIndex);
        assert.strictEqual(
            flameChartData.entryStartTimes[markerIndex],
            TraceModel.Helpers.Timing.microSecondsToMilliseconds(event.ts));
      }
    });

    it('adds total times correctly', () => {
      const events = traceParsedData.UserInteractions.interactionEvents;
      for (const event of events) {
        const markerIndex = entryData.indexOf(event);
        assert.isDefined(markerIndex);
        const expectedTotalTimeForEvent = TraceModel.Helpers.Timing.microSecondsToMilliseconds(
            (event.dur || 0) as TraceModel.Types.Timing.MicroSeconds);
        assert.strictEqual(flameChartData.entryTotalTimes[markerIndex], expectedTotalTimeForEvent);
      }
    });
  });

  it('returns the correct title for an interaction', () => {
    const firstInteraction = traceParsedData.UserInteractions.interactionEvents[0];
    const title = interactionsTrackAppender.titleForEvent(firstInteraction);
    assert.strictEqual(title, 'Interaction type:pointerdown id:1540');
  });

  it('highlightedEntryInfo returns the correct information', () => {
    const firstInteraction = traceParsedData.UserInteractions.interactionEvents[0];
    const highlightedEntryInfo = interactionsTrackAppender.highlightedEntryInfo(firstInteraction);
    // The i18n encondes spaces using the u00A0 unicode character.
    assert.strictEqual(highlightedEntryInfo.formattedTime, ('32.00\u00A0ms'));
  });
});
