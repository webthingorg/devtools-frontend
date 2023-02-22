// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import {FONT} from './TimelineFlameChartDataProvider.js';
import {
  type CompatibilityTracksAppender,
  type TrackAppender,
  type HighlightedEntryInfo,
} from './CompatibilityTracksAppender.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import * as i18n from '../../core/i18n/i18n.js';
import {TimelineFlameChartMarker} from './TimelineFlameChartView.js';
import {type TimelineMarkerStyle} from './TimelineUIUtils.js';
import * as Common from '../../core/common/common.js';

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

  private trackIsCollapsible: boolean = false;
  private readonly colorGenerator: Common.Color.Generator;
  constructor(private compatibilityBuilder: CompatibilityTracksAppender, weight: number) {
    this.weight = weight;
    this.trackIsCollapsible = this.compatibilityBuilder.getTraceParsedData().UserTimings.timings.some(
        timing => TraceEngine.Types.TraceEvents.isTraceEventAsyncPhase(timing));
    this.colorGenerator = new Common.Color.Generator(
        {
          min: 30,
          max: 55,
          count: undefined,
        },
        {min: 70, max: 100, count: 6}, 50, 0.7);
  }
  buildData(currentLevel: number): number {
    this.appendTrackHeader(currentLevel);
    const newLevel = this.appendMarkers(currentLevel);
    return this.appendUserTimings(newLevel);
  }

  appendUserTimings(currentLevel: number): number {
    const traceParsedData = this.compatibilityBuilder.getTraceParsedData();
    const asyncTimings = [];
    const userMarks = [];
    let newLevel = currentLevel;
    for (const timing of traceParsedData.UserTimings.timings) {
      if (TraceEngine.Types.TraceEvents.isTraceEventAsyncPhase(timing)) {
        asyncTimings.push(timing);
        continue;
      }
      userMarks.push(timing);
    }
    for (const userMark of userMarks) {
      this.compatibilityBuilder.appendNewEngineEventInLevel(userMark, currentLevel, this);
    }
    newLevel++;
    newLevel = this.compatibilityBuilder.appendNewEngineAsyncEvents(asyncTimings, newLevel, this);
    return newLevel;
  }

  appendTrackHeader(currentLevel: number): void {
    const style: PerfUI.FlameChart.GroupStyle = {
      padding: 4,
      height: 17,
      collapsible: this.trackIsCollapsible,
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
    this.compatibilityBuilder.getFlameChartData().groups.push(group);
  }

  appendMarkers(currentLevel: number): number {
    const traceParsedData = this.compatibilityBuilder.getTraceParsedData();
    const flameChartData = this.compatibilityBuilder.getFlameChartData();
    const totalTimes = flameChartData.entryTotalTimes;
    const markers = traceParsedData.PageLoadMetrics.allMarkerEvents;
    markers.forEach(marker => {
      const index = this.compatibilityBuilder.appendNewEngineEventInLevel(marker, currentLevel, this);
      totalTimes[index] = Number.NaN;
    });
    const minTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(traceParsedData.Meta.traceBounds.min);
    const flameCharMarkers = markers.map(marker => {
      const startTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(marker.ts);
      return new TimelineFlameChartMarker(startTimeMs, startTimeMs - minTimeMs, this.markerStyleForEvent(marker));
    });
    flameChartData.markers.push(...flameCharMarkers);
    return ++currentLevel;
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
    return this.colorGenerator.colorForID(event.name);
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
    const totalTime = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(
        (event.dur || 0) as TraceEngine.Types.Timing.MicroSeconds);
    const selfTime = totalTime;
    const eps = 1e-6;
    const time = Math.abs(totalTime - selfTime) > eps && selfTime > eps ?
        i18nString(UIStrings.sSelfS, {
          PH1: i18n.TimeUtilities.millisToString(totalTime, true),
          PH2: i18n.TimeUtilities.millisToString(selfTime, true),
        }) :
        i18n.TimeUtilities.millisToString(totalTime, true);
    const title = this.titleForEvent(event);
    return {title, formattedTime: time};
  }
}
