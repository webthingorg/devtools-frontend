// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  FONT,
  EntryType,
  InstantEventVisibleDurationMs,
  type TimelineFlameChartEntry,
} from './TimelineFlameChartDataProvider.js';
import {
  type CompatibilityTracksAppender,
  type TrackAppender,
  type HighlightedEntryInfo,
} from './CompatibilityTracksAppender.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import * as i18n from '../../core/i18n/i18n.js';
import {TimelineFlameChartMarker} from './TimelineFlameChartView.js';
import {type TimelineMarkerStyle, TimelineUIUtils} from './TimelineUIUtils.js';
import * as Common from '../../core/common/common.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  timings: 'Timings',
  /**
   * @description Text in the Performance panel to show how long was spent in a particular part of the code.
   * The first placeholder is the total time taken for this node and all children, the second is the self time
   * (time taken in this node, without children included).
   *@example {10ms} PH1
   *@example {10ms} PH2
   */
  sSelfS: '{PH1} (self {PH2})',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/TimingsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class TimingsTrackAppender implements TrackAppender {
  readonly weight: number;

  #colorGenerator: Common.Color.Generator;
  #compatibilityBuilder: CompatibilityTracksAppender;
  #flameChartData: PerfUI.FlameChart.TimelineData;
  #traceParsedData: Readonly<TraceEngine.Handlers.Types.TraceParseData>;
  #entryData: TimelineFlameChartEntry[];
  // TODO(crbug.com/1416533)
  // These are used only for compatibility with the legacy flame chart
  // architecture of the panel. Once all tracks have been migrated to
  // use the new engine and flame chart architecture, the reference can
  // be removed.
  #legacyEntryTypeByLevel: EntryType[];

  constructor(
      compatibilityBuilder: CompatibilityTracksAppender, weight: number, flameChartData: PerfUI.FlameChart.TimelineData,
      traceParsedData: TraceEngine.Handlers.Types.TraceParseData, entryData: TimelineFlameChartEntry[],
      legacyEntryTypeByLevel: EntryType[]) {
    this.weight = weight;
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
    this.#entryData = entryData;
    this.#legacyEntryTypeByLevel = legacyEntryTypeByLevel;
  }

  appendTrackAtLevel(currentLevel: number): number {
    this.#appendTrackHeader(currentLevel);
    const newLevel = this.#appendMarkers(currentLevel);
    // Add some vertical space between page load markers and user
    // timings by appending timings 2 levels after the markers' level.
    return this.#appendUserTimings(newLevel + 1);
  }

  #appendUserTimings(currentLevel: number): number {
    let newLevel = currentLevel;

    for (const userMark of this.#traceParsedData.UserTimings.performanceMarks) {
      this.#appendEventAtLevel(userMark, currentLevel);
    }
    newLevel++;
    newLevel = this.#appendAsyncTimings(this.#traceParsedData.UserTimings.performanceMeasures, newLevel);
    return newLevel;
  }

  #appendTrackHeader(currentLevel: number): void {
    const trackIsCollapsible = this.#traceParsedData.UserTimings.performanceMeasures.length > 0;

    const style: PerfUI.FlameChart.GroupStyle = {
      padding: 4,
      height: 17,
      collapsible: trackIsCollapsible,
      color: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-text-primary'),
      backgroundColor: ThemeSupport.ThemeSupport.instance().getComputedValue('--color-background'),
      font: FONT,
      nestingLevel: 0,
      shareHeaderLine: true,
      useFirstLineForOverview: true,
    };
    const group =
        ({startLevel: currentLevel, name: i18nString(UIStrings.timings), style: style, selectable: true} as
         PerfUI.FlameChart.Group);
    this.#flameChartData.groups.push(group);
  }

  #appendMarkers(currentLevel: number): number {
    const totalTimes = this.#flameChartData.entryTotalTimes;
    const markers = this.#traceParsedData.PageLoadMetrics.allMarkerEvents;
    markers.forEach(marker => {
      const index = this.#appendEventAtLevel(marker, currentLevel);
      totalTimes[index] = Number.NaN;
    });
    const minTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(this.#traceParsedData.Meta.traceBounds.min);
    const flameCharMarkers = markers.map(marker => {
      const startTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(marker.ts);
      return new TimelineFlameChartMarker(startTimeMs, startTimeMs - minTimeMs, this.markerStyleForEvent(marker));
    });
    this.#flameChartData.markers.push(...flameCharMarkers);
    return ++currentLevel;
  }

  #appendEventAtLevel(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): number {
    this.#compatibilityBuilder.registerTrackForLevel(level, this);
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

  #appendAsyncTimings(events: Readonly<TraceEngine.Types.TraceEvents.TraceEventData[]>, currentLevel: number): number {
    const lastUsedTimeByLevel: number[] = [];
    for (let i = 0; i < events.length; ++i) {
      const asyncEvent = events[i];
      const eventAsLegacy = this.#compatibilityBuilder.getLegacyEvent(asyncEvent);
      const visibleNames = new Set(TimelineUIUtils.visibleTypes());
      const eventIsVisible = eventAsLegacy &&
          visibleNames.has(TimelineModel.TimelineModelFilter.TimelineVisibleEventsFilter.eventType(eventAsLegacy));
      if (!eventIsVisible) {
        continue;
      }
      const startTime = asyncEvent.ts;
      let level;
      for (level = 0; level < lastUsedTimeByLevel.length && lastUsedTimeByLevel[level] > startTime; ++level) {
      }
      this.#appendEventAtLevel(asyncEvent, currentLevel + level);
      const endTime = asyncEvent.ts + (asyncEvent.dur || 0);
      lastUsedTimeByLevel[level] = endTime;
    }
    this.#legacyEntryTypeByLevel.length = currentLevel + lastUsedTimeByLevel.length;
    this.#legacyEntryTypeByLevel.fill(EntryType.TrackAppender, currentLevel);
    return currentLevel + lastUsedTimeByLevel.length;
  }

  markerStyleForEvent(event: TraceEngine.Types.TraceEvents.PageLoadEvent): TimelineMarkerStyle {
    const tallMarkerDashStyle = [6, 4];
    let title = '';
    let color = 'grey';
    if (TraceEngine.Types.TraceEvents.isTraceEventMarkDOMContent(event)) {
      color = '#0867CB';
      title = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.MetricName.DCL;
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventMarkLoad(event)) {
      color = '#B31412';
      title = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.MetricName.L;
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventFirstPaint(event)) {
      color = '#228847';
      title = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.MetricName.FP;
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventFirstContentfulPaint(event)) {
      color = '#1A6937';
      title = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.MetricName.FCP;
    }
    if (TraceEngine.Types.TraceEvents.isTraceEventLargestContentfulPaintCandidate(event)) {
      color = '#1A3422';
      title = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.MetricName.LCP;
    }
    return {
      title: title,
      dashStyle: tallMarkerDashStyle,
      lineWidth: 0.5,
      color: color,
      tall: true,
      lowPriority: false,
    };
  }
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (TraceEngine.Handlers.ModelHandlers.PageLoadMetrics.eventIsPageLoadEvent(event)) {
      return this.markerStyleForEvent(event).color;
    }
    // User timings.
    return this.#colorGenerator.colorForID(event.name);
  }

  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    const metricsHandler = TraceEngine.Handlers.ModelHandlers.PageLoadMetrics;
    if (metricsHandler.eventIsPageLoadEvent(event)) {
      switch (event.name) {
        case 'MarkDOMContent':
          return metricsHandler.MetricName.DCL;
        case 'MarkLoad':
          return metricsHandler.MetricName.L;
        case 'firstContentfulPaint':
          return metricsHandler.MetricName.FCP;
        case 'firstPaint':
          return metricsHandler.MetricName.FP;
        case 'largestContentfulPaint::Candidate':
          return metricsHandler.MetricName.LCP;
        default:
          return event.name;
      }
    }
    return event.name;
  }

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
