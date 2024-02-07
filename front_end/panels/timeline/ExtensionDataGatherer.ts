// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Extensions from '../../models/extensions/extensions.js';
import type * as TraceEngine from '../../models/trace/trace.js';

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
    // Implemented in a follow up
    return [];
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
