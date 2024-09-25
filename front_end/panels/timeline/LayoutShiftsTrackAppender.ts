// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
import * as Trace from '../../models/trace/trace.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
import {
  type CompatibilityTracksAppender,
  type DrawOverride,
  type HighlightedEntryInfo,
  type TrackAppender,
  type TrackAppenderName,
  VisualLoggingTrackName,
} from './CompatibilityTracksAppender.js';

const UIStrings = {
  /**
   *@description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  layoutShifts: 'Layout shifts',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/LayoutShiftsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class LayoutShiftsTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'LayoutShifts';

  #compatibilityBuilder: CompatibilityTracksAppender;
  #parsedTrace: Readonly<Trace.Handlers.Types.ParsedTrace>;

  constructor(compatibilityBuilder: CompatibilityTracksAppender, parsedTrace: Trace.Handlers.Types.ParsedTrace) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#parsedTrace = parsedTrace;
  }

  /**
   * Appends into the flame chart data the data corresponding to the
   * layout shifts track.
   * @param trackStartLevel the horizontal level of the flame chart events where
   * the track's events will start being appended.
   * @param expanded wether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean): number {
    if (this.#parsedTrace.LayoutShifts.clusters.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    return this.#appendLayoutShiftsAtLevel(trackStartLevel);
  }

  /**
   * Adds into the flame chart data the header corresponding to the
   * layout shifts track. A header is added in the shape of a group in the
   * flame chart data. A group has a predefined style and a reference
   * to the definition of the legacy track (which should be removed
   * in the future).
   * @param currentLevel the flame chart level at which the header is
   * appended.
   */
  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({collapsible: false});
    const group = buildTrackHeader(
        VisualLoggingTrackName.LAYOUT_SHIFTS, currentLevel, i18nString(UIStrings.layoutShifts), style,
        /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  /**
   * Adds into the flame chart data all the layout shifts. These are taken from
   * the clusters that are collected in the LayoutShiftsHandler.
   * @param currentLevel the flame chart level from which layout shifts will
   * be appended.
   * @returns the next level after the last occupied by the appended
   * layout shifts (the first available level to append more data).
   */
  #appendLayoutShiftsAtLevel(currentLevel: number): number {
    const allLayoutShifts = this.#parsedTrace.LayoutShifts.clusters.flatMap(cluster => cluster.events);

    if (Root.Runtime.experiments.isEnabled(Root.Runtime.ExperimentName.TIMELINE_LAYOUT_SHIFT_DETAILS)) {
      const allClusters = this.#parsedTrace.LayoutShifts.clusters;
      this.#compatibilityBuilder.appendEventsAtLevel(allClusters, currentLevel, this);
    }

    return this.#compatibilityBuilder.appendEventsAtLevel(allLayoutShifts, currentLevel, this);
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
  colorForEvent(_event: Trace.Types.Events.Event): string {
    const purple = ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    if (Trace.Types.Events.isSyntheticLayoutShiftCluster(_event)) {
      const parsedColor = Common.Color.parse(purple);
      if (parsedColor) {
        const colorWithAlpha = parsedColor.setAlpha(0.5).asString(Common.Color.Format.RGBA);
        return colorWithAlpha;
      }
    }
    return purple;
  }

  /**
   * Gets the title an event added by this appender should be rendered with.
   */
  titleForEvent(event: Trace.Types.Events.Event): string {
    if (Trace.Types.Events.isLayoutShift(event)) {
      return 'Layout shift';
    }
    if (Trace.Types.Events.isSyntheticLayoutShiftCluster(event)) {
      return '';
    }
    return event.name;
  }

  /**
   * Returns the info shown when an event added by this appender
   * is hovered in the timeline.
   */
  highlightedEntryInfo(event: Trace.Types.Events.LayoutShift): HighlightedEntryInfo {
    const title = this.titleForEvent(event);
    return {title, formattedTime: getFormattedTime(event.dur)};
  }

  getDrawOverride(event: Trace.Types.Events.Event): DrawOverride|undefined {
    if (!Root.Runtime.experiments.isEnabled(Root.Runtime.ExperimentName.TIMELINE_LAYOUT_SHIFT_DETAILS)) {
      return;
    }

    if (Trace.Types.Events.isLayoutShift(event)) {
      const score = event.args.data?.weighted_score_delta || 0;

      // `buffer` is how much space is between the actual diamond shape and the
      // edge of its select box. The select box will have a constant size
      // so a larger `buffer` will create a smaller diamond.
      //
      // This logic will scale the size of the diamond based on the layout shift score.
      // A LS score of >=0.1 will create a diamond of maximum size
      // A LS score of ~0 will create a diamond of minimum size (exactly 0 should not happen in practice)
      const bufferScale = 1 - Math.min(score / 0.1, 1);
      const buffer = Math.round(bufferScale * 3);

      return (context, x, y, _width, height) => {
        const boxSize = height;
        const halfSize = boxSize / 2;
        context.beginPath();
        context.moveTo(x, y + buffer);
        context.lineTo(x + halfSize - buffer, y + halfSize);
        context.lineTo(x, y + height - buffer);
        context.lineTo(x - halfSize + buffer, y + halfSize);
        context.closePath();
        context.fillStyle = this.colorForEvent(event);
        context.fill();
        return {
          x: x - halfSize,
          width: boxSize,
        };
      };
    }
    if (Trace.Types.Events.isSyntheticLayoutShiftCluster(event)) {
      return (context, x, y, width, height) => {
        const barHeight = height * 0.3;
        const barY = y + (height - barHeight) / 2 + 0.5;
        context.fillStyle = this.colorForEvent(event);
        context.rect(x, barY, width - 0.5, barHeight - 1);
        context.fill();
        return {x, width, z: -1};
      };
    }
    return;
  }
}
