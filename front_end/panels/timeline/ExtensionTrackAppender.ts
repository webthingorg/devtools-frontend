// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {addDecorationToEvent, buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
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
  #entriesFilter: TraceEngine.EntriesFilter.EntriesFilter;
  #tree: TraceEngine.Helpers.TreeHelpers.TraceEntryTree;
  #compatibilityBuilder: CompatibilityTracksAppender;
  constructor(compatibilityBuilder: CompatibilityTracksAppender, trackData: TrackData) {
    this.#entriesFilter = new TraceEngine.EntriesFilter.EntriesFilter(trackData.entryToNode);
    this.#trackData = trackData;
    this.#tree = trackData.tree;
    this.#compatibilityBuilder = compatibilityBuilder;
  }

  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean): number {
    if (this.#trackData.flameChartEntries.length === 0) {
      return trackStartLevel;
    }
    this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
    return this.#appendExtensionEntriesAtLevel(trackStartLevel);
  }

  entriesFilter(): TraceEngine.EntriesFilter.EntriesFilter {
    return this.#entriesFilter;
  }

  #appendTrackHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({shareHeaderLine: false, collapsible: true});
    const group = buildTrackHeader(
        currentLevel, this.#trackData.name, style,
        /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  #appendExtensionEntriesAtLevel(currentLevel: number): number {
    return this.#appendNodesAtLevel(this.#tree.roots, currentLevel);
  }
  /**
   * Traverses the trees formed by the provided nodes in breadth first
   * fashion and appends each node's entry on each iteration. As each
   * entry is handled, a check for the its visibility or if it's ignore
   * listed is done before appending.
   */
  #appendNodesAtLevel(nodes: Iterable<TraceEngine.Helpers.TreeHelpers.TraceEntryNode>, startingLevel: number): number {
    const invisibleEntries = this.#entriesFilter?.invisibleEntries() ?? [];
    let maxDepthInTree = startingLevel;
    for (const node of nodes) {
      let nextLevel = startingLevel;
      const entry = node.entry;
      if (!invisibleEntries.includes(entry)) {
        this.#appendEntryAtLevel(entry, startingLevel, this.#entriesFilter.isEntryModified(entry));
        nextLevel++;
      }
      const depthInChildTree = this.#appendNodesAtLevel(node.children, nextLevel);
      maxDepthInTree = Math.max(depthInChildTree, maxDepthInTree);
    }
    return maxDepthInTree;
  }

  #appendEntryAtLevel(entry: TraceEngine.Types.TraceEvents.TraceEventData, level: number, childrenCollapsed: boolean):
      void {
    const index = this.#compatibilityBuilder.appendEventAtLevel(entry, level, this);
    this.#addDecorationsToEntry(entry, index, childrenCollapsed);
  }

  #addDecorationsToEntry(
      _entry: TraceEngine.Types.TraceEvents.TraceEventData, index: number, childrenCollapsed: boolean): void {
    const flameChartData = this.#compatibilityBuilder.getFlameChartTimelineData();
    if (childrenCollapsed) {
      addDecorationToEvent(
          flameChartData, index, {type: PerfUI.FlameChart.FlameChartDecorationType.HIDDEN_DESCENDANTS_ARROW});
    }
  }

  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.TraceEvents.isTraceEventSyntheticExtensionEntry(event)) {
      return ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    }
    return event.args.color;
  }
  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.TraceEvents.isTraceEventSyntheticExtensionEntry(event)) {
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
