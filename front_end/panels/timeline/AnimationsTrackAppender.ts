// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import {
  type CompatibilityTracksAppender,
  type TrackAppender,
  type HighlightedEntryInfo,
  type TrackAppenderName,
} from './CompatibilityTracksAppender.js';
import type * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import {TimelineFlameChartMarker} from './TimelineFlameChartView.js';
import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  animations: 'Animations',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/AnimationsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class AnimationsTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'Animations';

  #colorGenerator: Common.Color.Generator;
  #compatibilityBuilder: CompatibilityTracksAppender;
  #flameChartData: PerfUI.FlameChart.FlameChartTimelineData;
  #traceParsedData: Readonly<TraceEngine.Handlers.Migration.PartialTraceData>;

  constructor(
      compatibilityBuilder: CompatibilityTracksAppender, flameChartData: PerfUI.FlameChart.FlameChartTimelineData,
      traceParsedData: TraceEngine.Handlers.Migration.PartialTraceData, colorGenerator: Common.Color.Generator) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#colorGenerator = colorGenerator;
    this.#flameChartData = flameChartData;
    this.#traceParsedData = traceParsedData;
  }

  // implement properly
  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean|undefined): number {
    const animations = this.#traceParsedData.Animations.animations;

    if (animations.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    const newLevel = this.#appendMarkersAtLevel(trackStartLevel);

    return this.#compatibilityBuilder.appendEventsAtLevel(animations, newLevel, this);
  }

  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const trackIsCollapsible = this.#traceParsedData.Animations.animations.length > 0;
    const style =
        buildGroupStyle({shareHeaderLine: true, useFirstLineForOverview: true, collapsible: trackIsCollapsible});
    const group =
        buildTrackHeader(currentLevel, i18nString(UIStrings.animations), style, /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  #appendMarkersAtLevel(currentLevel: number): number {
    const temp = {
      title: 'Animation',
      dashStyle: [6, 4],
      lineWidth: 0.5,
      color: '#228847',
      tall: true,
      lowPriority: false,
    };

    const markers = this.#traceParsedData.Animations.animations;

    markers.forEach(marker => {
      const index = this.#compatibilityBuilder.appendEventAtLevel(marker, currentLevel, this);
      this.#flameChartData.entryTotalTimes[index] = Number.NaN;
    });

    const minTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(this.#traceParsedData.Meta.traceBounds.min);
    const flameChartMarkers = markers.map(marker => {
      const startTimeMs = TraceEngine.Helpers.Timing.microSecondsToMilliseconds(marker.ts);
      return new TimelineFlameChartMarker(startTimeMs, startTimeMs - minTimeMs, temp);
    });
    this.#flameChartData.markers.push(...flameChartMarkers);
    return ++currentLevel;
  }

  // implement properly
  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    return this.#colorGenerator.colorForID(event.name);

    // uncomment upper to see the track
    // return '#00ffdd';
    // return event.name;
  }

  // implement properly
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    return event.name;
  }

  // implement properly
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo {
    const title = this.titleForEvent(event);

    return {title, formattedTime: getFormattedTime(event.dur)};
  }
}
