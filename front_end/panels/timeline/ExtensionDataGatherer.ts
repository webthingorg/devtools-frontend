// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Extensions from '../../models/extensions/extensions.js';
import * as TraceEngine from '../../models/trace/trace.js';

type TrackData = TraceEngine.Helpers.Extensions.ExtensionTrackData;
export {TrackData};

type ExtensionData = readonly TrackData[];

let extensionDataGathererInstance: ExtensionDataGatherer|undefined;

/**
 * This class abstracts the source of extension data out by providing a
 * single access point to the performance panel for extension data.
 * This data can come from two sources:
 * 1. Performance User timings.
 * 2. DevTools extensions.
 */
export class ExtensionDataGatherer extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  #traceParsedData: TraceEngine.Handlers.Types.TraceParseData|null = null;
  #extensiondataProviders = new Set<Extensions.PerformanceExtensionDataProvider.PerformanceExtensionDataProvider>();
  #extensionServer = Extensions.ExtensionServer.ExtensionServer.instance();
  #onDataProviderAddedBound = this.#onDataProviderAdded.bind(this);
  #extensionDataByModel: Map<TraceEngine.Handlers.Types.TraceParseData, ExtensionData> = new Map();
  static instace(): ExtensionDataGatherer {
    if (extensionDataGathererInstance) {
      return extensionDataGathererInstance;
    }
    extensionDataGathererInstance = new ExtensionDataGatherer();
    return extensionDataGathererInstance;
  }

  static removeInstance(): void {
    extensionDataGathererInstance = undefined;
  }
  constructor() {
    super();
    this.#extensionServer.addEventListener(
        Extensions.ExtensionServer.Events.PerformanceExtensionDataAdded, this.#onDataProviderAddedBound);
  }

  #onDataProviderAdded(event: Common.EventTarget.EventTargetEvent<
                       Extensions.PerformanceExtensionDataProvider.PerformanceExtensionDataProvider,
                       Extensions.ExtensionServer.EventTypes>): void {
    this.#extensiondataProviders.add(event.data);
    this.dispatchEventToListeners(Events.ExtensionDataAdded, event.data);
  }

  extensionDataProviders(): Extensions.PerformanceExtensionDataProvider.PerformanceExtensionDataProvider[] {
    return Array.from(this.#extensiondataProviders.values());
  }

  /**
   * Gets the data provided by extensions, either using the DevTools
   * extension API or User Timings.
   */
  getExtensionData(): ExtensionData {
    if (!this.#traceParsedData || !this.#traceParsedData.ExtensionTraceData) {
      return [];
    }
    const maybeCachedData = this.#extensionDataByModel.get(this.#traceParsedData);
    if (maybeCachedData) {
      return maybeCachedData;
    }
    return [...this.#traceParsedData.ExtensionTraceData.extensionFlameCharts, ...this.getDataFromDevToolsExtension()];
  }

  saveCurrentModelData(): void {
    if (this.#traceParsedData && !this.#extensionDataByModel.has(this.#traceParsedData)) {
      this.#extensionDataByModel.set(this.#traceParsedData, this.getExtensionData());
    }
  }

  modelChanged(traceParsedData: TraceEngine.Handlers.Types.TraceParseData|null): void {
    if (traceParsedData === this.#traceParsedData) {
      return;
    }
    if (this.#traceParsedData !== null) {
      // DevTools extension data is assumed to be useful only for the current
      // trace data (model). As such, if the model changes, we cache the devtools
      // extension data we have collected for the previous model and listen
      // for new data that applies to the new model.
      this.saveCurrentModelData();
      this.reset();
    }
    this.#traceParsedData = traceParsedData;
  }

  reset(): void {
    this.#extensiondataProviders.clear();
  }

  /**
   * Gets the data provided by extensions that use the DevTools extension
   * API.
   */
  getDataFromDevToolsExtension(): TrackData[] {
    const traceData = this.#traceParsedData;
    if (!traceData) {
      return [];
    }
    let allSyntheticExtensionEntries: TraceEngine.Types.TraceEvents.SyntheticExtensionEntry[] = [];
    for (const extensionDataProvider of this.#extensiondataProviders) {
      const data = extensionDataProvider.getFlameChartData();
      const timeOriginMillis = extensionDataProvider.getTimeOrigin() as TraceEngine.Types.Timing.MilliSeconds;
      const originMicro = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(timeOriginMillis);
      const entriesFromPlugin =
          data.flameChartEntries.map((entry): TraceEngine.Types.TraceEvents.SyntheticExtensionEntry => {
            // Map the extension's measurement clock to the clock of the trace
            const timeMicro = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
                TraceEngine.Types.Timing.MilliSeconds(entry.time));
            const timeInTracingClock = timeMicro + originMicro - traceData.Meta.tracingTimeOffset;

            const syntheticEvent = TraceEngine.Helpers.Trace.makeSyntheticTraceEntry(
                entry.name, TraceEngine.Types.Timing.MicroSeconds(timeInTracingClock),
                TraceEngine.Types.TraceEvents.ProcessID(0), TraceEngine.Types.TraceEvents.ThreadID(0));
            syntheticEvent.dur = TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
                TraceEngine.Types.Timing.MilliSeconds(entry.duration));
            return {
              ...syntheticEvent,
              dur: TraceEngine.Helpers.Timing.millisecondsToMicroseconds(
                  TraceEngine.Types.Timing.MilliSeconds(entry.duration)),
              cat: 'timeline-extension',
              args: {...entry, extensionName: extensionDataProvider.getName()},
            };
          });

      allSyntheticExtensionEntries = [...allSyntheticExtensionEntries, ...entriesFromPlugin];
    }

    return TraceEngine.Helpers.Extensions.buildTrackDataFromExtensionEntries(allSyntheticExtensionEntries);
  }
}

export const enum Events {
  ExtensionDataAdded = 'extensionDataAdded',
  ExtensionDataRemoved = 'extensionDataRemoved',
}

export type EventTypes = {
  [Events.ExtensionDataAdded]: Extensions.PerformanceExtensionDataProvider.PerformanceExtensionDataProvider,
  [Events.ExtensionDataRemoved]: Extensions.PerformanceExtensionDataProvider.PerformanceExtensionDataProvider,
};
