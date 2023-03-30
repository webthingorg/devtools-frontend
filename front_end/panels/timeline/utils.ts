// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  type HighlightedEntryInfo,
} from './CompatibilityTracksAppender.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import type * as TimelineModel from '../../models/timeline_model/timeline_model.js';

const UIStrings = {
  /**
   * @description Text in the Performance panel to show how long was spent in a particular part of the code.
   * The first placeholder is the total time taken for this node and all children, the second is the self time
   * (time taken in this node, without children included).
   *@example {10ms} PH1
   *@example {10ms} PH2
   */
  sSelfS: '{PH1} (self {PH2})',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/utils.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

/**
 * Builds the style for the group.
 * Each group has a predefined style and a reference to the definition of the legacy track (which should be removed in the future).
 * @param extra the customized fields with value.
 * @returns the built GroupStyle
 */
export function buildGroupStyle(extra: Object): PerfUI.FlameChart.GroupStyle {
  const defaultGroupStyle = {
    padding: 4,
    height: 17,
    collapsible: true,
    color: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary'),
    backgroundColor: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-background'),
    nestingLevel: 0,
    shareHeaderLine: true,
  };
  return Object.assign(defaultGroupStyle, extra);
}

/**
 * Builds the header corresponding to the track. A header is added in the shape of a group in the flame chart data.
 * @param startLevel the flame chart level at which the track header is appended.
 * @param name the display name of the track.
 * @param style the flame chart level at which the track header is appended.
 * @param selectable it the track is selectable.
 * @param expanded if the track is expanded.
 * @param track this is set only when `selectable` is true, and it is used for `updateSelectedGroup`.
 * @returns the group that built from the give data
 */
export function buildTrackHeader(
    startLevel: number, name: string, style: PerfUI.FlameChart.GroupStyle, selectable: boolean, expanded?: boolean,
    track?: TimelineModel.TimelineModel.Track|null): PerfUI.FlameChart.Group {
  const group = ({startLevel, name, style, selectable, expanded} as PerfUI.FlameChart.Group);
  if (selectable && track) {
    group.track = track;
  }
  return group;
}

/**
 * Adds into the flame chart data the trace events dispatched by the performace.measure API.
 * @param currentLevel the flame chart level from which the events will be appended.
 * @param events the TraceEvents that will be added to the flame chart.
 * @param appendEventAtLevel the function to append an event to flame chart.
 * @returns the next level after the last occupied by the appended events (the first available level to append more data).
 */
export function appendEventsAtLevel(
    currentLevel: number, events: TraceEngine.Types.TraceEvents.TraceEventData[],
    appendEventAtLevel: (event: TraceEngine.Types.TraceEvents.TraceEventData, level: number) => number): number {
  const lastUsedTimeByLevel: number[] = [];
  for (let i = 0; i < events.length; ++i) {
    const event = events[i];
    const startTime = event.ts;
    let level;
    // look vertically for the first level where this event fits,
    // that is, where it wouldn't overlap with other events.
    for (level = 0; level < lastUsedTimeByLevel.length && lastUsedTimeByLevel[level] > startTime; ++level) {
    }
    appendEventAtLevel(event, currentLevel + level);
    const endTime = event.ts + (event.dur || 0);
    lastUsedTimeByLevel[level] = endTime;
  }
  return lastUsedTimeByLevel.length;
}

/**
 * Returns the info shown when an event added by this appender is hovered in the timeline.
 * @param event the event that will be highlighted.
 * @param titleForEvent a function that returns the display title for the event.
 */
export function highlightedEntryInfo(
    event: TraceEngine.Types.TraceEvents.TraceEventData,
    titleForEvent: (event: TraceEngine.Types.TraceEvents.TraceEventData) => string): HighlightedEntryInfo {
  const title = titleForEvent(event);
  const totalTime =
      TraceEngine.Helpers.Timing.microSecondsToMilliseconds((event.dur || 0) as TraceEngine.Types.Timing.MicroSeconds);
  const selfTime = totalTime;
  if (totalTime === TraceEngine.Types.Timing.MilliSeconds(0)) {
    return {title, formattedTime: ''};
  }
  const minSelfTimeSignificance = 1e-6;
  const time = Math.abs(totalTime - selfTime) > minSelfTimeSignificance && selfTime > minSelfTimeSignificance ?
      i18nString(UIStrings.sSelfS, {
        PH1: i18n.TimeUtilities.millisToString(totalTime, true),
        PH2: i18n.TimeUtilities.millisToString(selfTime, true),
      }) :
      i18n.TimeUtilities.millisToString(totalTime, true);
  return {title, formattedTime: time};
}
