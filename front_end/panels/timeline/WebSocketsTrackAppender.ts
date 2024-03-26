// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import * as TraceEngine from '../../models/trace/trace.js';

import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
import {
  type CompatibilityTracksAppender,
  type HighlightedEntryInfo,
  type TrackAppender,
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import {type TimelineMarkerStyle} from './TimelineUIUtils.js';

const UIStrings = {
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
  wsMessageReceived: 'Message received',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsMessageSent: 'Message sent',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsTrackTitle: 'WebSocket',
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   *@example {ws://example.com} PH1
   */
  wsTrackTitleWithUrl: 'WebSocket: {PH1}',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/WebSocketsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class WebSocketsTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'WebSockets';

  #compatibilityBuilder: CompatibilityTracksAppender;
  #traceParsedData: Readonly<TraceEngine.Handlers.Types.TraceParseData>;
  #data: TraceEngine.Handlers.ModelHandlers.WebSockets.WebSocketTraceData;
  readonly associatedAppender: TrackAppender;

  constructor(
      compatibilityBuilder: CompatibilityTracksAppender, traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
      data: TraceEngine.Handlers.ModelHandlers.WebSockets.WebSocketTraceData, associatedAppender: TrackAppender) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#traceParsedData = traceParsedData;
    this.#data = data;
    this.associatedAppender = associatedAppender;
  }

  /**
   * Appends into the flame chart data the data corresponding to a track.
   * @param level the horizontal level of the flame chart events where the
   * track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(level: number, expanded?: boolean): number {
    // append track header:
    const trackIsCollapsible = false;
    const style =
        buildGroupStyle({shareHeaderLine: false, useFirstLineForOverview: false, collapsible: trackIsCollapsible});
    let trackTitle = i18nString(UIStrings.wsTrackTitle);
    const connectionEvent =
        this.#data.events.find(data => TraceEngine.Types.TraceEvents.isTraceEventWebSocketCreate(data)) as
            TraceEngine.Types.TraceEvents.TraceEventWebSocketCreate |
        undefined;
    if (connectionEvent) {
      trackTitle = i18nString(UIStrings.wsTrackTitleWithUrl, {PH1: connectionEvent.args.data.url});
    }
    const group = buildTrackHeader(level, trackTitle, style, /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);

    // append markers
    const markers = this.#data.events || [];
    markers.forEach(marker => {
      this.#compatibilityBuilder.appendEventAtLevel(marker, level, this);
    });

    return level + 1;
  }

  /**
   * Returns the color an event is shown with in the timeline.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    return '#00f';
  }

  /**
   * Returns the title an event is shown with in the timeline.
   */
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketCreate(event)) {
      if (event.args.data.url) {
        return i18nString(UIStrings.wsConnectionOpenedWithUrl, {PH1: event.args.data.url});
      }

      return i18nString(UIStrings.wsConnectionOpened);
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketDestroy(event)) {
      return i18nString(UIStrings.wsConnectionClosed);
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventWebSocketTransfer(event)) {
      return event.args.data.dir === 'send' ? i18nString(UIStrings.wsMessageSent) :
                                              i18nString(UIStrings.wsMessageReceived);
    }

    return event.name;
  }

  /**
   * Returns the info shown when an event in the timeline is hovered.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo {
    const timeOfEvent = TraceEngine.Helpers.Timing.timeStampForEventAdjustedByClosestNavigation(
        event,
        this.#traceParsedData.Meta.traceBounds,
        this.#traceParsedData.Meta.navigationsByNavigationId,
        this.#traceParsedData.Meta.navigationsByFrameId,
    );
    const formattedTime = getFormattedTime(timeOfEvent);
    const title = this.titleForEvent(event);

    return {title, formattedTime};
  }

  /**
   * Gets the style for a page load marker event.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  markerStyleForEvent(markerEvent: TraceEngine.Types.TraceEvents.PageLoadEvent): TimelineMarkerStyle {
    const tallMarkerDashStyle = [6, 4];
    const title = '';
    const color = 'grey';
    return {
      title: title,
      dashStyle: tallMarkerDashStyle,
      lineWidth: 0.5,
      color: color,
      tall: true,
      lowPriority: false,
    };
  }
}
