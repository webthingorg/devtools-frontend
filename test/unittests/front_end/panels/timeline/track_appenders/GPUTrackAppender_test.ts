// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
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
    timelineModel: TimelineModel.TimelineModel.TimelineModelImpl): Timeline.GPUTrackAppender.GPUTrackAppender {
  const compatibilityTracksAppender = new Timeline.CompatibilityTracksAppender.CompatibilityTracksAppender(
      flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
  return compatibilityTracksAppender.gpuTrackAppender();
}

describeWithEnvironment('GPUTrackAppender', () => {
  let traceParsedData: TraceModel.Handlers.Types.TraceParseData;
  let timelineModel: TimelineModel.TimelineModel.TimelineModelImpl;
  let gpuTrackAppender: Timeline.GPUTrackAppender.GPUTrackAppender;
  let entryData: Timeline.TimelineFlameChartDataProvider.TimelineFlameChartEntry[] = [];
  let flameChartData = new PerfUI.FlameChart.TimelineData([], [], [], []);
  let entryTypeByLevel: Timeline.TimelineFlameChartDataProvider.EntryType[] = [];

  beforeEach(async () => {
    traceParsedData = await loadModelDataFromTraceFile('threejs-gpu.json.gz');
    timelineModel = (await traceModelFromTraceFile('threejs-gpu.json.gz')).timelineModel;
    gpuTrackAppender = initTrackAppender(flameChartData, traceParsedData, entryData, entryTypeByLevel, timelineModel);
    gpuTrackAppender.appendTrackAtLevel(0);
  });

  afterEach(() => {
    entryData = [];
    flameChartData = new PerfUI.FlameChart.TimelineData([], [], [], []);
    entryTypeByLevel = [];
  });

  describe('appendTrackAtLevel', () => {
    it('marks all levels used by the track with the `TrackAppender` type', () => {
      // Two levels should be taken: 1 for track header and 1 for the GPU tasks.
      const levelCount = 2;
      assert.strictEqual(entryTypeByLevel.length, levelCount);
      const allEntriesAreTrackAppender =
          entryTypeByLevel.every(type => type === Timeline.TimelineFlameChartDataProvider.EntryType.TrackAppender);
      assert.isTrue(allEntriesAreTrackAppender);
    });

    it('creates a flamechart group for the GPU track', () => {
      assert.strictEqual(flameChartData.groups.length, 1);
      assert.strictEqual(flameChartData.groups[0].name, 'GPU');
    });

    it('adds start times correctly', () => {
      const gpuEvents = traceParsedData.GPU.mainGPUThreadTasks;
      for (const event of gpuEvents) {
        const markerIndex = entryData.indexOf(event);
        assert.isDefined(markerIndex);
        assert.strictEqual(
            flameChartData.entryStartTimes[markerIndex],
            TraceModel.Helpers.Timing.microSecondsToMilliseconds(event.ts));
      }
    });

    it('adds total times correctly', () => {
      const gpuEvents = traceParsedData.GPU.mainGPUThreadTasks;
      for (const event of gpuEvents) {
        const markerIndex = entryData.indexOf(event);
        assert.isDefined(markerIndex);
        if (TraceModel.Handlers.ModelHandlers.PageLoadMetrics.isTraceEventMarkerEvent(event)) {
          assert.isNaN(flameChartData.entryTotalTimes[markerIndex]);
          continue;
        }
        const expectedTotalTimeForEvent = event.dur ?
            TraceModel.Helpers.Timing.microSecondsToMilliseconds(event.dur as TraceModel.Types.Timing.MicroSeconds) :
            Timeline.TimelineFlameChartDataProvider.InstantEventVisibleDurationMs;
        assert.strictEqual(flameChartData.entryTotalTimes[markerIndex], expectedTotalTimeForEvent);
      }
    });
  });

  describe('colorForEvent and titleForEvent', () => {
    it('returns the correct color and title for GPU tasks', () => {
      const gpuEvents = traceParsedData.GPU.mainGPUThreadTasks;
      for (const event of gpuEvents) {
        assert.strictEqual(gpuTrackAppender.titleForEvent(event), 'GPU');
        assert.strictEqual(gpuTrackAppender.colorForEvent(event), 'hsl(109, 33%, 64%)');
      }
    });
  });

  describe('highlightedEntryInfo', () => {
    it('returns the info for a entries with no duration correctly', () => {
      const gpuEvents = traceParsedData.GPU.mainGPUThreadTasks;
      for (const event of gpuEvents) {
        const highlightedEntryInfo = gpuTrackAppender.highlightedEntryInfo(event);
        if (TraceModel.Handlers.ModelHandlers.PageLoadMetrics.isTraceEventMarkerEvent(event)) {
          assert.strictEqual(highlightedEntryInfo.formattedTime, '');
        }
      }
    });
  });
});
