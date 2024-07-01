// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import * as TimelineComponents from '../../panels/timeline/components/components.js';
import * as EventsSerializer from '../events_serializer/events_serializer.js';

const modificationsManagerByTraceIndex: ModificationsManager[] = [];
let activeManager: ModificationsManager|null;

export type UpdateAction = 'Remove'|'Add'|'Update';

export class AnnotationModifiedEvent extends Event {
  static readonly eventName = 'annotationmodifiedevent';

  constructor(
      public addedAnnotationOverlay: TraceEngine.Types.File.OverlayAnnotations, public action: UpdateAction,
      public overlays: TraceEngine.Types.File.OverlayAnnotations[]) {
    super(AnnotationModifiedEvent.eventName);
  }
}

type ModificationsManagerData = {
  traceParsedData: TraceEngine.Handlers.Types.TraceParseData,
  traceBounds: TraceEngine.Types.Timing.TraceWindowMicroSeconds,
  modifications?: TraceEngine.Types.File.Modifications,
               rawTraceEvents: readonly TraceEngine.Types.TraceEvents.TraceEventData[],
               syntheticEvents: TraceEngine.Types.TraceEvents.SyntheticBasedEvent[],
};

export class ModificationsManager extends EventTarget {
  #entriesFilter: TraceEngine.EntriesFilter.EntriesFilter;
  #timelineBreadcrumbs: TimelineComponents.Breadcrumbs.Breadcrumbs;
  #modifications: TraceEngine.Types.File.Modifications|null = null;
  #traceParsedData: TraceEngine.Handlers.Types.TraceParseData;
  #eventsSerializer: EventsSerializer.EventsSerializer;
  // User created overlays that are saved in the trace file
  #overlayAnnotations: Set<TraceEngine.Types.File.OverlayAnnotations>;

  /**
   * Gets the ModificationsManager instance corresponding to a trace
   * given its index used in Model#traces. If no index is passed gets
   * the manager instance for the last trace. If no instance is found,
   * throws.
   */
  static activeManager(): ModificationsManager|null {
    return activeManager;
  }

  /**
   * Initializes a ModificationsManager instance for a parsed trace or changes the active manager for an existing one.
   * This needs to be called if and a trace has been parsed or switched to.
   */
  static initAndActivateModificationsManager(
      traceModel: TraceEngine.TraceModel.Model<typeof TraceEngine.Handlers.ModelHandlers>,
      traceIndex: number): ModificationsManager|null {
    // If a manager for a given index has already been created, active it.
    if (modificationsManagerByTraceIndex[traceIndex]) {
      activeManager = modificationsManagerByTraceIndex[traceIndex];
      ModificationsManager.activeManager()?.applyModificationsIfPresent();
    }
    const traceParsedData = traceModel.traceParsedData(traceIndex);
    if (!traceParsedData) {
      throw new Error('ModificationsManager was initialized without a corresponding trace data');
    }
    const traceBounds = traceParsedData.Meta.traceBounds;
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
      syntheticEvents: syntheticEventsManager.getSyntheticTraceEvents(),
    });
    modificationsManagerByTraceIndex[traceIndex] = newModificationsManager;
    activeManager = newModificationsManager;
    ModificationsManager.activeManager()?.applyModificationsIfPresent();
    return this.activeManager();
  }

  private constructor({traceParsedData, traceBounds, modifications}: ModificationsManagerData) {
    super();
    const entryToNodeMap = new Map([...traceParsedData.Samples.entryToNode, ...traceParsedData.Renderer.entryToNode]);
    this.#entriesFilter = new TraceEngine.EntriesFilter.EntriesFilter(entryToNodeMap);
    this.#timelineBreadcrumbs = new TimelineComponents.Breadcrumbs.Breadcrumbs(traceBounds);
    this.#modifications = modifications || null;
    this.#traceParsedData = traceParsedData;
    this.#eventsSerializer = new EventsSerializer.EventsSerializer();
    // TODO: Assign annotations loaded from the trace file
    this.#overlayAnnotations = new Set();
  }

  getEntriesFilter(): TraceEngine.EntriesFilter.EntriesFilter {
    return this.#entriesFilter;
  }

  getTimelineBreadcrumbs(): TimelineComponents.Breadcrumbs.Breadcrumbs {
    return this.#timelineBreadcrumbs;
  }

  modifyAnnotationOverlay(overlay: TraceEngine.Types.File.OverlayAnnotations, action: UpdateAction): void {
    if (action === 'Add') {
      this.#overlayAnnotations.add(overlay);
    } else if (action === 'Remove') {
      this.#overlayAnnotations.delete(overlay);
    }
    const overlaysArray = Array.from(this.#overlayAnnotations);
    this.dispatchEvent(new AnnotationModifiedEvent(overlay, action, overlaysArray));
  }

  getAnnotationOverlays(): TraceEngine.Types.File.OverlayAnnotations[] {
    return Array.from(this.#overlayAnnotations);
  }

  /**
   * Builds all modifications into a serializable object written into
   * the 'modifications' trace file metadata field.
   */
  toJSON(): TraceEngine.Types.File.Modifications {
    const hiddenEntries = this.#entriesFilter.invisibleEntries()
                              .map(entry => this.#eventsSerializer.keyForEvent(entry))
                              .filter(entry => entry !== null) as TraceEngine.Types.File.TraceEventSerializableKey[];
    const expandableEntries =
        this.#entriesFilter.expandableEntries()
            .map(entry => this.#eventsSerializer.keyForEvent(entry))
            .filter(entry => entry !== null) as TraceEngine.Types.File.TraceEventSerializableKey[];
    this.#modifications = {
      entriesModifications: {
        hiddenEntries: hiddenEntries,
        expandableEntries: expandableEntries,
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
    const hiddenEntries = modifications.entriesModifications.hiddenEntries;
    const expandableEntries = modifications.entriesModifications.expandableEntries;
    this.applyEntriesFilterModifications(hiddenEntries, expandableEntries);
    this.#timelineBreadcrumbs.setInitialBreadcrumbFromLoadedModifications(modifications.initialBreadcrumb);
  }

  applyEntriesFilterModifications(
      hiddenEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[],
      expandableEntriesKeys: TraceEngine.Types.File.TraceEventSerializableKey[]): void {
    const hiddenEntries = hiddenEntriesKeys.map(key => this.#eventsSerializer.eventForKey(key, this.#traceParsedData));
    const expandableEntries =
        expandableEntriesKeys.map(key => this.#eventsSerializer.eventForKey(key, this.#traceParsedData));
    this.#entriesFilter.setHiddenAndExpandableEntries(hiddenEntries, expandableEntries);
  }
}
