// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  EntryType,
} from './TimelineFlameChartDataProvider.js';
import {
  type CompatibilityTracksAppender,
  type TrackAppender,
  type HighlightedEntryInfo,
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Common from '../../core/common/common.js';
import {buildGroupStyle, buildTrackHeader, getAsyncEventLevel, getFormattedTime} from './AppenderUtils.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  interactions: 'Interactions',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/InteractionsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

const LONG_INTERACTION_THRESHOLD =
    TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(200));

export class InteractionsTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'Interactions';

  #colorGenerator: Common.Color.Generator;
  #compatibilityBuilder: CompatibilityTracksAppender;
  #flameChartData: PerfUI.FlameChart.FlameChartTimelineData;
  #traceParsedData: Readonly<TraceEngine.TraceModel.PartialTraceParseDataDuringMigration>;
  // TODO(crbug.com/1416533)
  // This is used only for compatibility with the legacy flame chart
  // architecture of the panel. Once all tracks have been migrated to
  // use the new engine and flame chart architecture, the reference can
  // be removed.
  #legacyEntryTypeByLevel: EntryType[];

  constructor(
      compatibilityBuilder: CompatibilityTracksAppender, flameChartData: PerfUI.FlameChart.FlameChartTimelineData,
      traceParsedData: TraceEngine.TraceModel.PartialTraceParseDataDuringMigration,
      legacyEntryTypeByLevel: EntryType[]) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#colorGenerator = new Common.Color.Generator(
        {
          min: 30,
          max: 55,
          count: undefined,
        },
        {min: 70, max: 100, count: 6}, 50, 0.7);
    this.#flameChartData = flameChartData;
    this.#traceParsedData = traceParsedData;
    this.#legacyEntryTypeByLevel = legacyEntryTypeByLevel;
  }

  /**
   * Appends into the flame chart data the data corresponding to the
   * interactions track.
   * @param level the horizontal level of the flame chart events where
   * the track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(currentLevel: number, expanded?: boolean): number {
    if (this.#traceParsedData.UserInteractions.interactionEvents.length === 0) {
      return currentLevel;
    }
    this.#appendTrackHeaderAtLevel(currentLevel, expanded);
    return this.#appendInteractionsAtLevel(currentLevel);
  }

  /**
   * Adds into the flame chart data the header corresponding to the
   * interactions track. A header is added in the shape of a group in the
   * flame chart data. A group has a predefined style and a reference
   * to the definition of the legacy track (which should be removed
   * in the future).
   * @param currentLevel the flame chart level at which the header is
   * appended.
   */
  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const trackIsCollapsible = this.#traceParsedData.UserInteractions.interactionEvents.length > 0;
    const style = buildGroupStyle({shareHeaderLine: false, collapsible: trackIsCollapsible});
    const group =
        buildTrackHeader(currentLevel, i18nString(UIStrings.interactions), style, /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  /**
   * Adds into the flame chart data the trace events dispatched by the
   * performance.measure API. These events are taken from the UserInteractions
   * handler.
   * @param currentLevel the flame chart level from which interactions will
   * be appended.
   * @returns the next level after the last occupied by the appended
   * interactions (the first available level to append more data).
   */

  #appendInteractionsAtLevel(trackStartLevel: number): number {
    const interactions = this.#traceParsedData.UserInteractions.interactionEventsWithNoNesting;
    const lastUsedTimeByLevel: number[] = [];
    for (let i = 0; i < interactions.length; ++i) {
      const event = interactions[i];
      const level = getAsyncEventLevel(event, lastUsedTimeByLevel);
      this.appendEventAtLevel(event, trackStartLevel + level);
    }
    this.#legacyEntryTypeByLevel.length = trackStartLevel + lastUsedTimeByLevel.length;
    // Set the entry type to TrackAppender for all the levels occupied by the appended timings.
    this.#legacyEntryTypeByLevel.fill(EntryType.TrackAppender, trackStartLevel);
    return trackStartLevel + lastUsedTimeByLevel.length;
  }

  /**
   * Adds an event to the flame chart data at a defined level.
   * @returns the position occupied by the new event in the entryData
   * array, which contains all the events in the timeline.
   */
  appendEventAtLevel(syntheticEvent: TraceEngine.Types.TraceEvents.SyntheticInteractionEvent, level: number): number {
    const index = this.#compatibilityBuilder.appendEventAtLevel(syntheticEvent, level, this);
    const eventDurationMicroSeconds = syntheticEvent.dur || TraceEngine.Types.Timing.MicroSeconds(0);
    if (eventDurationMicroSeconds > LONG_INTERACTION_THRESHOLD) {
      this.#addCandyStripingForLongInteraction(index);
    }
    return index;
  }

  #addCandyStripingForLongInteraction(eventIndex: number): void {
    const decorationsForEvent = this.#flameChartData.entryDecorations[eventIndex] || [];
    decorationsForEvent.push({
      type: 'CANDY',
      startAtTime: LONG_INTERACTION_THRESHOLD,
    });
    this.#flameChartData.entryDecorations[eventIndex] = decorationsForEvent;
  }

  /*
    ------------------------------------------------------------------------------------
     The following methods  are invoked by the flame chart renderer to query features about
     events on rendering.
    ------------------------------------------------------------------------------------
  */

  /**
   * Gets the color an event added by this appender should be rendered with.
   */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    let idForColorGeneration = this.titleForEvent(event);
    if (TraceEngine.Types.TraceEvents.isSyntheticInteractionEvent(event)) {
      // Append the ID so that we vary the colours, ensuring that two events of
      // the same type are coloured differently.
      idForColorGeneration += event.interactionId;
    }
    return this.#colorGenerator.colorForID(idForColorGeneration);
  }

  /**
   * Gets the title an event added by this appender should be rendered with.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Types.TraceEvents.isSyntheticInteractionEvent(event)) {
      return titleForInteractionEvent(event);
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

/**
 * Return the title to use for a given interaction event.
 * Exported so the title in the DetailsView can re-use the same logic
 **/
export function titleForInteractionEvent(event: TraceEngine.Types.TraceEvents.SyntheticInteractionEvent): string {
  const category = TraceEngine.Handlers.ModelHandlers.UserInteractions.categoryOfInteraction(event);
  // Because we hide nested interactions, we do not want to show the
  // specific type of the interaction that was not hidden, so instead we
  // show just the category of that interaction.
  if (category === 'OTHER') {
    return 'Other';
  }
  if (category === 'KEYBOARD') {
    return 'Keyboard';
  }
  if (category === 'POINTER') {
    return 'Pointer';
  }
  return event.type;
}
