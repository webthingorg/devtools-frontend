// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../core/platform/platform.js';
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
  /**
   * All raw trace entries from a trace.
   */
  #rawTraceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[];
  #entriesFilter: TraceEngine.EntriesFilter.EntriesFilter;
  #timelineBreadcrumbs: TimelineComponents.Breadcrumbs.Breadcrumbs;
  #modifications: TraceEngine.Types.File.Modifications|null = null;
  #traceParsedData: TraceEngine.Handlers.Types.TraceParseData;
  #modifiedProfileCallByKey:
      Map<TraceEngine.Types.File.ProfileCallKey, TraceEngine.Types.TraceEvents.SyntheticProfileCall> = new Map();
  #syntheticEvents: TraceEngine.Types.TraceEvents.SyntheticBasedEvent[];

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

  static isProfileCallKey(key: TraceEngine.Types.File.TraceEventSerializableKey):
      key is TraceEngine.Types.File.ProfileCallKey {
    return key[0] === 'p';
  }
  static isRawEventKey(key: TraceEngine.Types.File.TraceEventSerializableKey):
      key is TraceEngine.Types.File.RawEventKey {
    return key[0] === 'r';
  }
  static isSyntheticEventKey(key: TraceEngine.Types.File.TraceEventSerializableKey):
      key is TraceEngine.Types.File.SyntheticEventKey {
    return key[0] === 's';
  }

  static isTraceEventSerializableKey(key: (number|string)[]): key is TraceEngine.Types.File.TraceEventSerializableKey {
    const maybeValidKey = key as TraceEngine.Types.File.TraceEventSerializableKey;
    if (ModificationsManager.isProfileCallKey(maybeValidKey)) {
      return key.length === 5 &&
          key.every((entry, i) => i === 0 || typeof entry === 'number' || !isNaN(parseInt(entry, 10)));
    }
    if (ModificationsManager.isRawEventKey(maybeValidKey) || ModificationsManager.isSyntheticEventKey(maybeValidKey)) {
      return key.length === 2 && (typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)));
    }
    return false;
  }

  private constructor({traceParsedData, traceBounds, modifications, rawTraceEvents, syntheticEvents}:
                          ModificationsManagerData) {
    const entryToNodeMap = new Map([...traceParsedData.Samples.entryToNode, ...traceParsedData.Renderer.entryToNode]);
    this.#entriesFilter = new TraceEngine.EntriesFilter.EntriesFilter(entryToNodeMap);
    this.#timelineBreadcrumbs = new TimelineComponents.Breadcrumbs.Breadcrumbs(traceBounds);
    this.#rawTraceEvents = rawTraceEvents;
    this.#modifications = modifications || null;
    this.#traceParsedData = traceParsedData;
    this.#syntheticEvents = syntheticEvents;
  }

  getEntriesFilter(): TraceEngine.EntriesFilter.EntriesFilter {
    return this.#entriesFilter;
  }

  getTimelineBreadcrumbs(): TimelineComponents.Breadcrumbs.Breadcrumbs {
    return this.#timelineBreadcrumbs;
  }

  keyForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): TraceEngine.Types.File.TraceEventSerializableKey
      |null {
    if (TraceEngine.Types.TraceEvents.isProfileCall(event)) {
      return ['p', event.pid, event.tid, TraceEngine.Types.TraceEvents.SampleIndex(event.sampleIndex), event.nodeId];
    }
    const key: TraceEngine.Types.File.SyntheticEventKey|TraceEngine.Types.File.RawEventKey =
        TraceEngine.Types.TraceEvents.isSyntheticBasedEvent(event) ?
        ['s', this.#rawTraceEvents.indexOf(event.rawSourceEvent)] :
        ['r', this.#rawTraceEvents.indexOf(event)];
    if (key[1] < 0) {
      return null;
    }
    return key;
  }

  eventForKey(key: TraceEngine.Types.File.TraceEventSerializableKey): TraceEngine.Types.TraceEvents.TraceEventData {
    if (ModificationsManager.isProfileCallKey(key)) {
      return this.#getModifiedProfileCallByKey(key);
    }
    if (ModificationsManager.isSyntheticEventKey(key)) {
      const syntheticEvent = this.#syntheticEvents.at(key[1]);
      if (!syntheticEvent) {
        throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${key[1]}`);
      }
      return syntheticEvent;
    }
    if (ModificationsManager.isRawEventKey(key)) {
      return this.#rawTraceEvents[key[1]];
    }
    throw new Error(`Unknown trace event serializable key: ${(key as Array<unknown>).join('-')}`);
  }

  #getModifiedProfileCallByKey(key: TraceEngine.Types.File.ProfileCallKey):
      TraceEngine.Types.TraceEvents.SyntheticProfileCall {
    const cacheResult = this.#modifiedProfileCallByKey.get(key);
    if (cacheResult) {
      return cacheResult;
    }
    const processId = key[1];
    const threadId = key[2];
    const sampleIndex = key[3];
    const nodeId = key[4];
    const profileCallsInThread =
        this.#traceParsedData.Renderer.processes.get(processId)?.threads.get(threadId)?.profileCalls;
    if (!profileCallsInThread) {
      throw new Error(`Unknown profile call serializable key: ${(key as Array<unknown>).join('-')}`);
    }

    // Do a binary search on the complete profile call list to efficiently lookup for a
    // match based on sample index and node id. We need both because multiple calls can share
    // the same sample index, in which case we need to break the tie with the node id (by which
    // calls in a sample stack are ordered, allowing us to do a single search).
    const matchRangeStartIndex = Platform.ArrayUtilities.nearestIndexFromBeginning(
        profileCallsInThread, e => e.sampleIndex >= sampleIndex && e.nodeId >= nodeId);

    const match = matchRangeStartIndex !== null && profileCallsInThread.at(matchRangeStartIndex);
    if (!match) {
      throw new Error(`Unknown profile call serializable key: ${(key as Array<unknown>).join('-')}`);
    }
    // Cache to avoid looking up in subsequent calls.
    this.#modifiedProfileCallByKey.set(key, match);
    return match;
  }

  /**
   * Builds all modifications into a serializable object written into
   * the 'modifications' trace file metadata field.
   */
  toJSON(): TraceEngine.Types.File.Modifications {
    const hiddenEntries =
        this.#entriesFilter.invisibleEntries().map(this.keyForEvent.bind(this)).filter(key => key !== null) as
        TraceEngine.Types.File.TraceEventSerializableKey[];
    const expandableEntries =
        this.#entriesFilter.expandableEntries().map(this.keyForEvent.bind(this)).filter(key => key !== null) as
        TraceEngine.Types.File.TraceEventSerializableKey[];
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
    if (!hiddenEntries.every(ModificationsManager.isTraceEventSerializableKey) ||
        !expandableEntries.every(ModificationsManager.isTraceEventSerializableKey)) {
      throw new Error('Invalid event key found in JSON modifications');
    }
    this.applyEntriesFilterModifications(hiddenEntries, expandableEntries);
    this.#timelineBreadcrumbs.setInitialBreadcrumbFromLoadedModifications(modifications.initialBreadcrumb);
  }

  applyEntriesFilterModifications(
      hiddenEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[],
      expandableEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[]): void {
    const hiddenEntries = hiddenEntriesKeys.map(this.eventForKey.bind(this));
    const expandableEntries = expandableEntriesKeys.map(this.eventForKey.bind(this));
    this.#entriesFilter.setHiddenAndExpandableEntries(hiddenEntries, expandableEntries);
  }
}
