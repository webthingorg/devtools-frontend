// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {buildGroupStyle, buildTrackHeader, getEventLevel, getFormattedTime} from './AppenderUtils.js';
import {type HighlightedEntryInfo, type TrackAppender, type TrackAppenderName} from './CompatibilityTracksAppender.js';
import {InstantEventVisibleDurationMs} from './TimelineFlameChartDataProvider.js';
import {NetworkCategory, TimelineUIUtils} from './TimelineUIUtils.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  network: 'Network',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsConnectionOpened: 'WebSocket connection opened',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   *@example {ws://example.com} PH1
   */
  wsConnectionOpenedWithUrl: 'WebSocket connection opened: {PH1}',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsConnectionClosed: 'WebSocket connection closed',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsMessageReceived: 'WebSocket message received',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsMessageSent: 'WebSocket message sent',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/NetworkTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class NetworkTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'Network';

  #traceParsedData: Readonly<TraceEngine.Handlers.Types.TraceParseData>;
  #flameChartData: PerfUI.FlameChart.FlameChartTimelineData;

  #font: string;
  #group?: PerfUI.FlameChart.Group;

  #tracksIndexForWebSockets = new Map<number, number>();
  #webSocketIdToLevel = new Map<number, number>();
  constructor(
      traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
      flameChartData: PerfUI.FlameChart.FlameChartTimelineData) {
    this.#traceParsedData = traceParsedData;
    this.#flameChartData = flameChartData;

    this.#font = `${PerfUI.Font.DEFAULT_FONT_SIZE} ${PerfUI.Font.getFontFamilyForCanvas()}`;

    ThemeSupport.ThemeSupport.instance().addEventListener(ThemeSupport.ThemeChangeEvent.eventName, () => {
      if (this.#group) {
        // We only need to update the color here, because FlameChart will call `scheduleUpdate()` when theme is changed.
        this.#group.style.color = ThemeSupport.ThemeSupport.instance().getComputedValue('--sys-color-on-surface');
        this.#group.style.backgroundColor =
            ThemeSupport.ThemeSupport.instance().getComputedValue('--sys-color-cdt-base-container');
      }
    });

    const websocketEvents = this.#traceParsedData.WebSockets.traceData;
    for (let i = 0; i < websocketEvents.length; i++) {
      const event = websocketEvents[i];
      this.#tracksIndexForWebSockets.set(event.webSocketIdentifier, i);
    }
  }

  group(): PerfUI.FlameChart.Group|undefined {
    return this.#group;
  }

  font(): string {
    return this.#font;
  }

  /**
   * Appends into the flame chart data the data corresponding to the
   * Network track.
   * @param trackStartLevel the horizontal level of the flame chart events where
   * the track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean|undefined): number {
    const networkEvents = this.#traceParsedData.NetworkRequests.byTime;
    const websocketEvents = this.#traceParsedData.WebSockets.traceData;
    if (networkEvents.length === 0 && websocketEvents.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    return this.#appendEventsAtLevel(networkEvents, trackStartLevel);
  }

  /**
   * Adds into the flame chart data the header corresponding to the
   * Network track. A header is added in the shape of a group in the
   * flame chart data. A group has a predefined style and a reference
   * to the definition of the legacy track (which should be removed
   * in the future).
   * @param currentLevel the flame chart level at which the header is
   * appended.
   * @param expanded wether the track should be rendered expanded.
   */
  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({
      shareHeaderLine: false,
      useFirstLineForOverview: false,
      useDecoratorsForOverview: true,
    });
    this.#group = buildTrackHeader(0, i18nString(UIStrings.network), style, /* selectable= */ true, expanded);
    this.#flameChartData.groups.push(this.#group);
  }

  /**
   * Adds into the flame chart data a list of trace events.
   * @param events the trace events that will be appended to the flame chart.
   * The events should be taken straight from the trace handlers. The handlers
   * should sort the events by start time, and the parent event is before the
   * child.
   * @param trackStartLevel the flame chart level from which the events will
   * be appended.
   * @returns the next level after the last occupied by the appended these
   * trace events (the first available level to append next track).
   */
  #appendEventsAtLevel(
      events: readonly(TraceEngine.Types.TraceEvents.TraceEventData|
                       TraceEngine.Types.TraceEvents.SyntheticWebSocketEvent)[],
      trackStartLevel: number): number {
    const lastUsedTimeByLevel: number[] = [];
    for (let i = 0; i < events.length; ++i) {
      const event = events[i];
      // const event = events[i] as TraceEngine.Types.TraceEvents.SyntheticNetworkRequest;
      // const level = getEventLevel(event, lastUsedTimeByLevel);
      // this.#webSocketUrlToLevel.set(event.args?.data?.url, level);

      let level = 0;
      if (TraceEngine.Types.TraceEvents.isWebSocketTraceEvent(event) ||
          TraceEngine.Types.TraceEvents.isSyntheticWebSocketEvent(event)) {
        const args = event.args;
        const data = args?.data || {};
        const webSocketIdentifier = data.identifier;
        if (this.#webSocketIdToLevel.has(webSocketIdentifier)) {
          const idLevel = this.#webSocketIdToLevel.get(webSocketIdentifier) || 0;
          this.#appendEventAtLevel(event, trackStartLevel + idLevel);
        } else {
          level = getEventLevel(event, lastUsedTimeByLevel);
          this.#webSocketIdToLevel.set(webSocketIdentifier, level);
          this.#appendEventAtLevel(event, trackStartLevel + level);
        }
        // this.#appendEventAtLevel(event, trackStartLevel + level);
      } else {
        level = getEventLevel(event, lastUsedTimeByLevel);
        this.#appendEventAtLevel(event, trackStartLevel + level);
      }
      // this.#appendEventAtLevel(event, trackStartLevel + level);
    }

    return trackStartLevel + lastUsedTimeByLevel.length;
  }

  /**
   * Adds an event to the flame chart data at a defined level.
   * @param event the event to be appended,
   * @param level the level to append the event,
   * @returns the index of the event in all events to be rendered in the flamechart.
   */
  #appendEventAtLevel(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): number {
    const index = this.#flameChartData.entryLevels.length;
    this.#flameChartData.entryLevels[index] = level;
    this.#flameChartData.entryStartTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
    const msDuration = event.dur ||
        TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
            InstantEventVisibleDurationMs as TraceEngine.Types.Timing.MilliSeconds);
    this.#flameChartData.entryTotalTimes[index] = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(msDuration);
    return level;
  }

  /**
   * Update the flame chart data.
   * When users zoom in the flamechart, we only want to show them the network
   * requests between startTime and endTime. This function will append those
   * invisible events to the last level, and hide them.
   * @returns the number of levels used by this track
   */
  filterTimelineDataBetweenTimes(
      events: (TraceEngine.Types.TraceEvents.SyntheticNetworkRequest|
               TraceEngine.Types.TraceEvents.SyntheticWebSocketEvent|
               TraceEngine.Handlers.ModelHandlers.WebSockets.WebSocketTraceEvent)[],
      startTime: TraceEngine.Types.Timing.MilliSeconds, endTime: TraceEngine.Types.Timing.MilliSeconds): number {
    // const events = this.#traceParsedData.NetworkRequests.byTime;
    if (!this.#flameChartData || events.length === 0) {
      return 0;
    }
    const lastTimeByLevel: number[] = [];
    let maxLevel = 0;
    for (let i = 0; i < events.length; ++i) {
      const event = events[i];
      const beginTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(event.ts);
      event.dur = event.dur ||
          TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
              InstantEventVisibleDurationMs as TraceEngine.Types.Timing.MilliSeconds);
      const eventEndTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
          (event.ts + event.dur) as TraceEngine.Types.Timing.MicroSeconds);
      const isBetweenTimes = beginTime < endTime && eventEndTime > startTime;
      if (!isBetweenTimes) {
        this.#flameChartData.entryLevels[i] = -1;
        continue;
      }
      let level = 0;
      if (TraceEngine.Types.TraceEvents.isWebSocketTraceEvent(event) ||
          TraceEngine.Types.TraceEvents.isSyntheticWebSocketEvent(event)) {
        const args = event.args;
        const data = args?.data || {};
        const webSocketIdentifier = data.identifier;
        if (this.#webSocketIdToLevel.has(webSocketIdentifier)) {
          level = this.#webSocketIdToLevel.get(webSocketIdentifier) || 0;
        } else {
          level = getEventLevel(event, lastTimeByLevel);
          this.#webSocketIdToLevel.set(webSocketIdentifier, level);
        }
        // this.#appendEventAtLevel(event, trackStartLevel + level);
      } else {
        level = getEventLevel(event, lastTimeByLevel);
      }
      // const level = getEventLevel(event, lastTimeByLevel);
      this.#flameChartData.entryLevels[i] = level;
      maxLevel = Math.max(maxLevel, lastTimeByLevel.length, level);
    }
    for (let i = 0; i < events.length; ++i) {
      // -1 means this event is invisible.
      if (this.#flameChartData.entryLevels[i] === -1) {
        // The maxLevel is an invisible level.
        this.#flameChartData.entryLevels[i] = maxLevel;
      }
    }
    return maxLevel + 1;
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
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Types.TraceEvents.isSyntheticWebSocketEvent(event)) {
      return '';
    }
    let category;
    if (TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(event)) {
      // throw new Error(`Unexpected Network Request: The event's type is '${event.name}'`);
      category = TimelineUIUtils.syntheticNetworkRequestCategory(event);
    } else {
      category = NetworkCategory.Script;
    }
    return TimelineUIUtils.networkCategoryColor(category);
  }

  /**
   * Gets the title an event added by this appender should be rendered with.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
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

  /**
   * Returns the title an event is shown with in the timeline.
   */
  titleForWebSocketEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketCreate(event)) {
      if (event.args.data.url) {
        return i18nString(UIStrings.wsConnectionOpenedWithUrl, {PH1: event.args.data.url});
      }

      return i18nString(UIStrings.wsConnectionOpened);
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketDestroy(event)) {
      return i18nString(UIStrings.wsConnectionClosed);
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketSend(event)) {
      return i18nString(UIStrings.wsMessageSent);
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketReceive(event)) {
      return i18nString(UIStrings.wsMessageReceived);
    }

    return event.name;
  }
}
