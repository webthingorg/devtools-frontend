// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import * as TimelineComponents from '../../panels/timeline/components/components.js';
import * as TraceBounds from '../trace_bounds/trace_bounds.js';

const modificationsManagerByTraceIndex: ModificationsManager[] = [];

type ModificationsManagerData = {
  traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
  traceBounds: TraceEngine.Types.Timing.TraceWindowMicroSeconds,
  modifications?: TraceEngine.Types.File.Modifications,
               rawTraceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[],
               syntheticEvents: TraceEngine.Types.TraceEvents.SyntheticBasedEvent[],
};

export class ModificationsManager {
  #entriesFilter: TraceEngine.EntriesFilter.EntriesFilter;
  #timelineBreadcrumbs: TimelineComponents.Breadcrumbs.Breadcrumbs;
  #modifications: TraceEngine.Types.File.Modifications|null = null;
  #traceParsedData: TraceEngine.Handlers.Types.TraceParseData;

  /**
   * Gets the ModificationsManager instance corresponding to a trace
   * given its index used in Model#traces. If no index is passed gets
   * the manager instance for the last trace. If no instance is found,
   * throws.
   */
  static activeManager(): ModificationsManager|null {
    if (modificationsManagerByTraceIndex.length === 0) {
      return null;
    }
    return ModificationsManager.getManagerForTraceIndex(modificationsManagerByTraceIndex.length - 1);
  }

  static getManagerForTraceIndex(traceIndex: number): ModificationsManager {
    if (!modificationsManagerByTraceIndex[traceIndex]) {
      throw new Error(`Attempted to get a Modifications Manager with an unknown index ${traceIndex}`);
    }
    return modificationsManagerByTraceIndex[traceIndex];
  }
  /**
   * Initializes a ModificationsManager instance for a parsed trace. This needs to be called
   * if and only if a trace has been parsed.
   */
  static initModificationsManagerForTrace(
      traceModel: TraceEngine.TraceModel.Model<typeof TraceEngine.Handlers.ModelHandlers>,
      traceIndex: number): ModificationsManager {
    const traceParsedData = traceModel.traceParsedData(traceIndex);
    if (!traceParsedData) {
      throw new Error('ModificationsManager was initialized without a corresponding trace data');
    }
    const traceBounds = TraceBounds.TraceBounds.BoundsManager.instance().state()?.micro.entireTraceBounds ||
        traceParsedData.Meta.traceBounds;
    const traceEvents = traceModel.rawTraceEvents(traceIndex);
    if (!traceEvents) {
      throw new Error('ModificationsManager was initialized without a corresponding raw trace events array');
    }
    const syntheticEventsManager = traceModel.syntheticTraceEventsManager(traceIndex);
    if (!syntheticEventsManager) {
      throw new Error('ModificationsManager was initialized without a corresponding SyntheticEventsManager');
    }
    const metadata = traceModel.metadata(traceIndex);
    const newModificationsManager = new ModificationsManager({
      traceParsedData,
      traceBounds,
      rawTraceEvents: traceEvents,
      modifications: metadata?.modifications,
      syntheticEvents: syntheticEventsManager.allSyntheticEvents(),
    });
    modificationsManagerByTraceIndex[traceIndex] = newModificationsManager;
    return newModificationsManager;
  }

  private constructor({traceParsedData, traceBounds, modifications}: ModificationsManagerData) {
    const entryToNodeMap = new Map([...traceParsedData.Samples.entryToNode, ...traceParsedData.Renderer.entryToNode]);
    this.#entriesFilter = new TraceEngine.EntriesFilter.EntriesFilter(entryToNodeMap);
    this.#timelineBreadcrumbs = new TimelineComponents.Breadcrumbs.Breadcrumbs(traceBounds);
    this.#modifications = modifications || null;
    this.#traceParsedData = traceParsedData;
  }

  getEntriesFilter(): TraceEngine.EntriesFilter.EntriesFilter {
    return this.#entriesFilter;
  }

  getTimelineBreadcrumbs(): TimelineComponents.Breadcrumbs.Breadcrumbs {
    return this.#timelineBreadcrumbs;
  }

  /**
   * Builds all modifications into a serializable object written into
   * the 'modifications' trace file metadata field.
   */
  toJSON(): TraceEngine.Types.File.Modifications {
    const hiddenEntries =
        this.#entriesFilter.invisibleEntries()
            .map(
                entry =>
                    TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().keyForEvent(entry))
            .filter(key => key !== null) as TraceEngine.Types.File.TraceEventSerializableKey[];
    const expandableEntries =
        this.#entriesFilter.expandableEntries()
            .map(
                entry =>
                    TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().keyForEvent(entry))
            .filter(key => key !== null) as TraceEngine.Types.File.TraceEventSerializableKey[];
    this.#modifications = {
      entriesModifications: {
        hiddenEntries: hiddenEntries.map(key => key.join('-')),
        expandableEntries: expandableEntries.map(key => key.join('-')),
      },
      initialBreadcrumb: this.#timelineBreadcrumbs.initialBreadcrumb,
    };
    return this.#modifications;
  }

  applyModificationsIfPresent(): void {
    const modifications = this.#modifications;
    if (!modifications) {
      return;
    }
    const hiddenEntries = modifications.entriesModifications.hiddenEntries.map(
        key => key.split('-').map(item => isNaN(parseInt(item, 10)) ? item : parseInt(item, 10)));
    const expandableEntries = modifications.entriesModifications.expandableEntries.map(
        key => key.split('-').map(item => isNaN(parseInt(item, 10)) ? item : parseInt(item, 10)));
    if (!hiddenEntries.every(TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.isTraceEventSerializableKey) ||
        !expandableEntries.every(
            TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.isTraceEventSerializableKey)) {
      throw new Error('Invalid event key found in JSON modifications');
    }
    this.applyEntriesFilterModifications(hiddenEntries, expandableEntries);
    this.#timelineBreadcrumbs.setInitialBreadcrumbFromLoadedModifications(modifications.initialBreadcrumb);
  }

  applyEntriesFilterModifications(
      hiddenEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[],
      expandableEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[]): void {
    const hiddenEntries = hiddenEntriesKeys.map(
        key => TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().eventForKey(
            key, this.#traceParsedData));
    const expandableEntries = expandableEntriesKeys.map(
        key => TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().eventForKey(
            key, this.#traceParsedData));
    this.#entriesFilter.setHiddenAndExpandableEntries(hiddenEntries, expandableEntries);
  }
}
