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
    flameChartData: PerfUI.FlameChart.FlameChartTimelineData, traceParsedData: TraceModel.Handlers.Types.TraceParseData,
    entryData: Timeline.TimelineFlameChartDataProvider.TimelineFlameChartEntry[],
    entryTypeByLevel: Timeline.TimelineFlameChartDataProvider.EntryType[],
    timelineModel: TimelineModel.TimelineModel.TimelineModelImpl):
    Timeline.CompatibilityTracksAppender.CompatibilityTracksAppender {
  const compatibilityTracksAppender = new Timeline.CompatibilityTracksAppender.CompatibilityTracksAppender(
      flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
  return compatibilityTracksAppender;
}

describeWithEnvironment('TimingTrackAppender', () => {
  let traceParsedData: TraceModel.Handlers.Types.TraceParseData;
  let timelineModel: TimelineModel.TimelineModel.TimelineModelImpl;
  let tracksAppender: Timeline.CompatibilityTracksAppender.CompatibilityTracksAppender;
  let entryData: Timeline.TimelineFlameChartDataProvider.TimelineFlameChartEntry[] = [];
  let flameChartData = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
  let entryTypeByLevel: Timeline.TimelineFlameChartDataProvider.EntryType[] = [];
  beforeEach(async () => {
    traceParsedData = await loadModelDataFromTraceFile('timings-track.json.gz');
    timelineModel = (await traceModelFromTraceFile('timings-track.json.gz')).timelineModel;
    tracksAppender = initTrackAppender(flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
    const timingsTrack = tracksAppender.timingsTrackAppender();
    const gpuTrack = tracksAppender.gpuTrackAppender();
    const nextLevel = timingsTrack.appendTrackAtLevel(0);
    gpuTrack.appendTrackAtLevel(nextLevel);
  });
  afterEach(() => {
    entryData = [];
    flameChartData = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
    entryTypeByLevel = [];
  });

  describe('CompatibilityTracksAppender', () => {
    describe('eventsInTrack', () => {
      it('returns all the events appended by a track', () => {
        const timingsTrackEvents = tracksAppender.eventsInTrack('Timings').sort((a, b) => a.ts - b.ts);
        const allTimingEvents = [
          ...traceParsedData.UserTimings.consoleTimings,
          ...traceParsedData.UserTimings.timestampEvents,
          ...traceParsedData.UserTimings.performanceMarks,
          ...traceParsedData.UserTimings.performanceMeasures,
          ...traceParsedData.PageLoadMetrics.allMarkerEvents,
        ].sort((a, b) => a.ts - b.ts);
        assert.deepEqual(allTimingEvents, timingsTrackEvents);
      });
    });
    describe('eventsForTreeView', () => {
      it('returns only sync events if using async events means a tree cannot be built', () => {
        const timingsEvents = tracksAppender.eventsInTrack('Timings');
        assert.isFalse(tracksAppender.canBuildTreeFromEvents(timingsEvents));
        const treeEvents = tracksAppender.eventsForTreeView('Timings');
        const allEventsAreSync = treeEvents.every(event => !TraceModel.Types.TraceEvents.isAsyncPhase(event.ph));
        assert.isTrue(allEventsAreSync);
      });
      it('returns both sync and async events if a tree can be built from them', async () => {
        // This file contains events in the timings track that can be assembled as a tree
        traceParsedData = await loadModelDataFromTraceFile('sync-like-timings.json.gz');
        timelineModel = (await traceModelFromTraceFile('sync-like-timings.json.gz')).timelineModel;
        tracksAppender = initTrackAppender(flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
        const timingsTrack = tracksAppender.timingsTrackAppender();
        timingsTrack.appendTrackAtLevel(0);

        const timingsEvents = tracksAppender.eventsInTrack('Timings');
        assert.isTrue(tracksAppender.canBuildTreeFromEvents(timingsEvents));
        const treeEvents = tracksAppender.eventsForTreeView('Timings');
        assert.deepEqual(timingsEvents, treeEvents);
      });
    });
  });
});
