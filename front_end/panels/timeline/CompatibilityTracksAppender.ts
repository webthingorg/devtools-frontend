// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import {TimingsTrackAppender} from './TimingsTrackAppender.js';

import {
  EntryType,
  InstantEventVisibleDurationMs,
  type TimelineFlameChartEntry,
} from './TimelineFlameChartDataProvider.js';
import {TimelineUIUtils} from './TimelineUIUtils.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';

export type HighlightedEntryInfo = {
  title: string,
  formattedTime: string,
  warning?: string,
};

export interface TrackAppender {
  weight: number;
  buildData(level: number): number;
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo;
}

export class CompatibilityTracksAppender {
  private readonly visibleEventNames: Set<string>;
  private trackForLevel = new Map<number, TrackAppender>();
  constructor(
      private traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
      private legacyTimelineModel: TimelineModel.TimelineModel.TimelineModelImpl,
      private flameChartData: PerfUI.FlameChart.TimelineData, private legacyEntrydata: TimelineFlameChartEntry[],
      private legacyEntryTypeByLevel: EntryType[]) {
    this.visibleEventNames = new Set(TimelineUIUtils.visibleTypes());
  }
  getFlameChartData(): PerfUI.FlameChart.TimelineData {
    return this.flameChartData;
  }
  getLegacyEntrydata(): TimelineFlameChartEntry[] {
    return this.legacyEntrydata;
  }
  getLegacyEntryTypeByLevel(): EntryType[] {
    return this.legacyEntryTypeByLevel;
  }
  getTraceParsedData(): TraceEngine.Handlers.Types.TraceParseData {
    return this.traceParsedData;
  }
  getLegacyEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): SDK.TracingModel.Event|null {
    const process = this.legacyTimelineModel.tracingModel()?.getProcessById(event.pid);
    const thread = process?.threadById(event.tid);
    if (!thread) {
      return null;
    }
    return SDK.TracingModel.Event.fromPayload(event as unknown as SDK.TracingManager.EventPayload, thread);
  }

  appendNewEngineEventInLevel(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number, track: TrackAppender):
      number {
    this.trackForLevel.set(level, track);
    const index = this.legacyEntrydata.length;
    this.legacyEntrydata.push(event);
    this.legacyEntryTypeByLevel[level] = EntryType.TrackRenderer;
    this.flameChartData.entryLevels[index] = level;
    this.flameChartData.entryStartTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const msDuration = event.dur ||
        TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
            InstantEventVisibleDurationMs as TraceEngine.Types.Timing.MilliSeconds);
    this.flameChartData.entryTotalTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(msDuration);
    return index;
  }
  appendNewEngineAsyncEvents(
      events: TraceEngine.Types.TraceEvents.TraceEventData[], currentLevel: number, track: TrackAppender): number {
    const lastUsedTimeByLevel: number[] = [];
    for (let i = 0; i < events.length; ++i) {
      const asyncEvent = events[i];
      const eventAsLegacy = this.getLegacyEvent(asyncEvent);
      const eventIsVisible = eventAsLegacy &&
          this.visibleEventNames.has(
              TimelineModel.TimelineModelFilter.TimelineVisibleEventsFilter.eventType(eventAsLegacy));
      if (!eventIsVisible) {
        continue;
      }
      const startTime = asyncEvent.ts;
      let level;
      for (level = 0; level < lastUsedTimeByLevel.length && lastUsedTimeByLevel[level] > startTime; ++level) {
      }
      this.appendNewEngineEventInLevel(asyncEvent, currentLevel + level, track);
      const endTime = asyncEvent.ts + (asyncEvent.dur || 0);
      lastUsedTimeByLevel[level] = endTime;
    }
    this.legacyEntryTypeByLevel.length = currentLevel + lastUsedTimeByLevel.length;
    this.legacyEntryTypeByLevel.fill(EntryType.TrackRenderer, currentLevel);
    return currentLevel + lastUsedTimeByLevel.length;
  }

  allTrackDataBuilders(): TrackAppender[] {
    const timingsTrackBuilder = new TimingsTrackAppender(this, 0);
    return [timingsTrackBuilder];
  }

  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.colorForEvent(event);
  }

  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.titleForEvent(event);
  }

  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): HighlightedEntryInfo {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.highlightedEntryInfo(event);
  }
}
