// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
import {
  type CompatibilityTracksAppender,
  type HighlightedEntryInfo,
  type TrackAppender,
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import {type TrackData} from './ExtensionDataGatherer.js';

export class ExtensionTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'Extension';

  #trackData: TrackData;
  #syntheticEntries: TraceEngine.Types.TraceEvents.SyntheticTraceEntry[] = [];
  #compatibilityBuilder: CompatibilityTracksAppender;
  constructor(compatibilityBuilder: CompatibilityTracksAppender, trackData: TrackData) {
    this.#trackData = trackData;
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#syntheticEntries = this.#trackData.flameChartEntries.map(entry => {
      const timeMicro = entry.time;
      const syntheticEvent: TraceEngine.Types.TraceEvents.SyntheticExtensionEntry = {
        ...TraceEngine.Helpers.Trace.makeSyntheticEventWithSelfTime(
            entry.name, TraceEngine.Types.Timing.MicroSeconds(timeMicro), TraceEngine.Types.TraceEvents.ProcessID(0),
            TraceEngine.Types.TraceEvents.ThreadID(0)),
        dur: entry.duration,
        cat: 'timeline-extension',
        args: entry,
      };
      return syntheticEvent as TraceEngine.Types.TraceEvents.SyntheticExtensionEntry;
    });
  }

  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean): number {
    if (this.#trackData.flameChartEntries.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    return this.#appendExtensionEntriesAtLevel(trackStartLevel);
  }

  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({shareHeaderLine: false, collapsible: true});
    const group = buildTrackHeader(
        currentLevel, this.#trackData.name, style,
        /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  #appendExtensionEntriesAtLevel(currentLevel: number): number {
    return this.#compatibilityBuilder.appendEventsAtLevel(this.#syntheticEntries, currentLevel, this);
  }

  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.TraceEvents.isTraceEventSyntheticExtensionEntry(event)) {
      return ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    }
    return event.args.color;
  }
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.TraceEvents.isTraceEventSyntheticExtensionEntry(event)) {
      return ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    }
    return event.name;
  }

  /**
   * Returns the info shown when an event added by this appender
   * is hovered in the timeline.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo {
    const title = this.titleForEvent(event);
    return {title, formattedTime: getFormattedTime(event.dur)};
  }
}
