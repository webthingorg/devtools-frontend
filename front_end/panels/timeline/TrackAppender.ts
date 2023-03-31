// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import type * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import {
  type TimelineFlameChartEntry,
  EntryType,
  InstantEventVisibleDurationMs,
} from './TimelineFlameChartDataProvider.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Common from '../../core/common/common.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import {type CompatibilityTracksAppender, type TrackAppenderName} from './CompatibilityTracksAppender.js';

const UIStrings = {
  /**
   * @description Text in the Performance panel to show how long was spent in a particular part of the code.
   * The first placeholder is the total time taken for this node and all children, the second is the self time
   * (time taken in this node, without children included).
   *@example {10ms} PH1
   *@example {10ms} PH2
   */
  sSelfS: '{PH1} (self {PH2})',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  interactions: 'Interactions',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  gpu: 'GPU',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/TrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export type HighlightedEntryInfo = {
  title: string,
  formattedTime: string,
  warning?: string,
};

/**
 * Track appenders add the data of each track into the timeline flame
 * chart. Each track appender also implements functions tha allow the
 * canvas renderer to gather more information about an event in a track,
 * like its display name or color.
 *
 * At the moment, tracks in the timeline flame chart are appended in
 * two locations: in the TimelineFlameChartDataProvider and in the track
 * appenders exported by this module. As part of the work to use a new
 * trace parsing engine, a track appender will be defined with this API
 * for each of the tracks in the timeline. With this implementation in
 * place its counterpart in the TimelineFlameChartDataProvider can be
 * removed. This processes of doing this for a track is referred to as
 * "migrating the track" to the new system.
 *
 * The migration implementation will result benefitial among other
 * things because the complexity of rendering the details of each track
 * is distributed among multiple standalone modules.
 * Read more at go/rpp-flamechart-arch
 */

export interface TrackAppender {
  /**
   * The unique name given to the track appender.
   */
  appenderName: TrackAppenderName;

  /**
   * Appends into the flame chart data the data corresponding to a track.
   * @param level the horizontal level of the flame chart events where the
   * track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(level: number, expanded?: boolean): number;
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

/**
 * Builds the style for the group.
 * Each group has a predefined style and a reference to the definition of the
 * legacy track (which should be removed in the future).
 * @param extra the customized fields with value.
 * @returns the built GroupStyle
 */
export function buildGroupStyle(extra?: Object): PerfUI.FlameChart.GroupStyle {
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
 * Builds the header corresponding to the track. A header is added in the shape
 * of a group in the flame chart data.
 * @param startLevel the flame chart level at which the track header is appended.
 * @param name the display name of the track.
 * @param style the flame chart level at which the track header is appended.
 * @param selectable it the track is selectable.
 * @param expanded if the track is expanded.
 * @param track this is set only when `selectable` is true, and it is used for
 * `updateSelectedGroup`.
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

export abstract class TrackAppenderBase implements TrackAppender {
  #colorGenerator: Common.Color.Generator;
  #compatibilityBuilder: CompatibilityTracksAppender;
  #flameChartData: PerfUI.FlameChart.TimelineData;
  #events: readonly TraceEngine.Types.TraceEvents.TraceEventData[];
  #entryData: TimelineFlameChartEntry[];
  // TODO(crbug.com/1416533)
  // These are used only for compatibility with the legacy flame chart
  // architecture of the panel. Once all tracks have been migrated to
  // use the new engine and flame chart architecture, the reference can
  // be removed.
  #legacyEntryTypeByLevel: EntryType[];
  #legacyTrack: TimelineModel.TimelineModel.Track|null;

  constructor(
      compatibilityBuilder: CompatibilityTracksAppender, flameChartData: PerfUI.FlameChart.TimelineData,
      events: readonly TraceEngine.Types.TraceEvents.TraceEventData[], entryData: TimelineFlameChartEntry[],
      legacyEntryTypeByLevel: EntryType[], legacyTrack?: TimelineModel.TimelineModel.Track) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#colorGenerator = new Common.Color.Generator(
        {
          min: 30,
          max: 55,
          count: undefined,
        },
        {min: 70, max: 100, count: 6}, 50, 0.7);
    this.#flameChartData = flameChartData;
    this.#events = events;
    this.#entryData = entryData;
    this.#legacyEntryTypeByLevel = legacyEntryTypeByLevel;
    this.#legacyTrack = legacyTrack || null;
  }

  abstract appenderName: TrackAppenderName;

  abstract getGroupStyle(): PerfUI.FlameChart.GroupStyle;

  /**
   * Appends into the flame chart data the data corresponding to this track.
   * @param currentLevel the horizontal level of the flame chart events wher the
   * track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(currentLevel: number, expanded?: boolean|undefined): number {
    if (this.#events.length === 0) {
      return currentLevel;
    }
    this.appendTrackHeaderAtLevel(currentLevel, expanded);
    return this.appendEventsAtLevel(currentLevel, this.#events);
  }

  /**
   * Adds into the flame chart data the header corresponding to this track. A
   * header is added in the shape of a group in
   * the flame chart data. A group has a predefined style and a reference to the
   * definition of the legacy track (which
   * should be removed in the future).
   * @param currentLevel the flame chart level at which the header is appended.
   * @param expanded wether the track should be rendered expanded.
   */
  appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    let name;
    switch (this.appenderName) {
      case 'Interactions':
        name = i18nString(UIStrings.interactions);
        break;
      case 'GPU':
        name = i18nString(UIStrings.gpu);
        break;
      default:
        return;
    }
    const group =
        buildTrackHeader(currentLevel, name, this.getGroupStyle(), /* selectable= */ true, expanded, this.#legacyTrack);
    this.#flameChartData.groups.push(group);
  }

  /**
   * Adds into the flame chart data the trace events. These are taken straight
   * from the corresponding handler.
   * @param currentLevel the flame chart level from which user timings will be
   * appended.
   * @returns the next level after the last occupied by the appended timings
   * (the first available level to append more data).
   */
  appendEventsAtLevel(currentLevel: number, events: readonly TraceEngine.Types.TraceEvents.TraceEventData[]): number {
    const lastUsedTimeByLevel: number[] = [];
    for (let i = 0; i < events.length; ++i) {
      const event = events[i];
      const startTime = event.ts;
      let level;
      // Look vertically for the first level where this event fits,
      // that is, where it wouldn't overlap with other events.
      for (level = 0; level < lastUsedTimeByLevel.length && lastUsedTimeByLevel[level] > startTime; ++level) {
      }
      this.appendEventAtLevel(event, currentLevel + level);
      const endTime = event.ts + (event.dur || 0);
      lastUsedTimeByLevel[level] = endTime;
    }
    this.#legacyEntryTypeByLevel.length = currentLevel + lastUsedTimeByLevel.length;
    // Set the entry type to TrackAppender for all the levels occupied by the appended timings.
    this.#legacyEntryTypeByLevel.fill(EntryType.TrackAppender, currentLevel);
    return currentLevel + lastUsedTimeByLevel.length;
  }

  /**
   * Adds an event to the flame chart data at a defined level.
   * @returns the position occupied by the new event in the entryData array,
   * which contains all the events in the timeline.
   */
  appendEventAtLevel(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): number {
    this.#compatibilityBuilder.registerTrackForLevel(level, this as TrackAppender);
    const index = this.#entryData.length;
    this.#entryData.push(event);
    this.#legacyEntryTypeByLevel[level] = EntryType.TrackAppender;
    this.#flameChartData.entryLevels[index] = level;
    this.#flameChartData.entryStartTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const msDuration = event.dur ||
        TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
            InstantEventVisibleDurationMs as TraceEngine.Types.Timing.MilliSeconds);
    this.#flameChartData.entryTotalTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(msDuration);
    return index;
  }

  /**
   * Gets the defualt color an event added by this appender should be rendered with.
   */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    return this.#colorGenerator.colorForID(this.titleForEvent(event));
  }

  abstract titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;

  /**
   * Returns the info shown when an event added by this appender is hovered in the timeline.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo {
    const title = this.titleForEvent(event);
    const totalTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
        (event.dur || 0) as TraceEngine.Types.Timing.MicroSeconds);
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
}
