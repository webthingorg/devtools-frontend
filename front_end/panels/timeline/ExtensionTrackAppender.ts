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
  #compatibilityBuilder: CompatibilityTracksAppender;
  constructor(compatibilityBuilder: CompatibilityTracksAppender, trackData: TrackData) {
    this.#trackData = trackData;
    this.#compatibilityBuilder = compatibilityBuilder;
  }

  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean): number {
    if (this.#trackData.flameChartEntries.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    return this.#compatibilityBuilder.appendEventsAtLevel(this.#trackData.flameChartEntries, trackStartLevel, this);
  }

  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({shareHeaderLine: false, collapsible: true});
    const group = buildTrackHeader(
        currentLevel, this.#trackData.name, style,
        /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event)) {
      return ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    }
    return event.args.color;
  }

  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event)) {
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
