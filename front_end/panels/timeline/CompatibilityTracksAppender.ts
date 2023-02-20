// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import {type EntryType, type TimelineFlameChartEntry} from './TimelineFlameChartDataProvider.js';
import {TimelineUIUtils} from './TimelineUIUtils.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as TimelineModel from '../../models/timeline_model/timeline_model.js';

export type HighlightedEntryInfo = {
  title: string,
  formattedTime: string,
  warning?: string,
};

export interface TrackAppender {
  weight: number;
  /**
   * Appends into the flame chart data, the data corresponding to a track.
   * Timestamps, duration and type of event is taken to
   * @param level the horizontal level of the flame chart events where the
   * track's events have to start to be appended
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrack(level: number): number;
  /**
   * Returns the color an event is shown with in the timeline.
   */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
  /**
   * Returns the title an event is shown with in the timeline.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
  /**
   * Returns the info shown when an event in the timeline is hovered.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo;
}

export type TrackAppenderData = {
  traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
  legacyTimelineModel: TimelineModel.TimelineModel.TimelineModelImpl,
  flameChartData: PerfUI.FlameChart.TimelineData,
  legacyEntrydata: TimelineFlameChartEntry[],
  legacyEntryTypeByLevel: EntryType[],
};

export class CompatibilityTracksAppender {
  private readonly visibleEventNames: Set<string>;
  private trackForLevel = new Map<number, TrackAppender>();
  private traceParsedData: TraceEngine.Handlers.Types.TraceParseData;
  private legacyTimelineModel: TimelineModel.TimelineModel.TimelineModelImpl;
  private flameChartData: PerfUI.FlameChart.TimelineData;
  private legacyEntrydata: TimelineFlameChartEntry[];
  private legacyEntryTypeByLevel: EntryType[];
  constructor(data: TrackAppenderData) {
    this.visibleEventNames = new Set(TimelineUIUtils.visibleTypes());
    this.traceParsedData = data.traceParsedData;
    this.legacyTimelineModel = data.legacyTimelineModel;
    this.flameChartData = data.flameChartData;
    this.legacyEntrydata = data.legacyEntrydata;
    this.legacyEntryTypeByLevel = data.legacyEntryTypeByLevel;
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
  /**
   * Given a trace event returns instantiates a legacy SDK.Event. This should
   * be used for compatibility purposes only.
   */
  getLegacyEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): SDK.TracingModel.Event|null {
    const process = this.legacyTimelineModel.tracingModel()?.getProcessById(event.pid);
    const thread = process?.threadById(event.tid);
    if (!thread) {
      return null;
    }
    return SDK.TracingModel.PayloadEvent.fromPayload(event as unknown as SDK.TracingManager.EventPayload, thread);
  }

  allTrackAppenders(): TrackAppender[] {
    // TODO(crbug.com/1409044) Return appenders for all tracks
    return [];
  }
  /**
   * Returns the color an event is shown with in the timeline.
   */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.colorForEvent(event);
  }
  /**
   * Returns the title an event is shown with in the timeline.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.titleForEvent(event);
  }
  /**
   * Returns the info shown when an event in the timeline is hovered.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): HighlightedEntryInfo {
    const track = this.trackForLevel.get(level);
    if (!track) {
      throw new Error('Track not found for level');
    }
    return track.highlightedEntryInfo(event);
  }
}
