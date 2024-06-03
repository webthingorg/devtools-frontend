// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as TraceEngine from '../../../models/trace/trace.js';
import type * as Types from '../types/types.js';

const syntheticEventsManagerByTraceIndex: SyntheticEventsManager[] = [];

export class SyntheticEventsManager {
  /**
   * All synthetic entries created in a trace from a corresponding trace events.
   * (ProfileCalls are excluded because)
   */
  #syntheticTraceEvents: Types.TraceEvents.SyntheticBasedEvent[] = [];
  /**
   * All raw entries from a trace.
   */
  #rawTraceEvents: readonly Types.TraceEvents.TraceEventData[] = [];
  #modifiedProfileCallByKey:
      Map<TraceEngine.Types.File.ProfileCallKey, TraceEngine.Types.TraceEvents.SyntheticProfileCall> = new Map();

  /**
   * Initializes a SyntheticEventsManager for a trace. This needs to be
   * called before running the trace engine handlers, since the instance
   * created here will be used by the handlers to register their
   * synthetic trace events.
   */
  static initSyntheticEventsManagerForTrace(rawEvents: readonly Types.TraceEvents.TraceEventData[]):
      SyntheticEventsManager {
    const manager = new SyntheticEventsManager(rawEvents);
    syntheticEventsManagerByTraceIndex.push(manager);
    return manager;
  }

  /**
   * Gets the SyntheticEventsManager instance for a trace given the index
   * of the trace given its index used in Model#traces. If no index is
   * passed, defaults to the last created instance.
   * If no instance is found throws error.
   */
  static getManagerForTrace(traceIndex?: number): SyntheticEventsManager {
    const last = syntheticEventsManagerByTraceIndex.at(-1);
    if (!last) {
      throw new Error('Attempted to get a SyntheticEventsManager without initializing');
    }
    if (traceIndex === undefined) {
      return last;
    }
    const manager = syntheticEventsManagerByTraceIndex.at(traceIndex);
    if (!manager) {
      throw new Error(`Attempted to get a SyntheticEventsManager with an invalid index ${traceIndex}`);
    }
    return manager;
  }

  static getActiveManager(): SyntheticEventsManager {
    const last = syntheticEventsManagerByTraceIndex.at(-1);
    if (!last) {
      throw new Error('Attempted to get a SyntheticEventsManager without initializing');
    }
    return SyntheticEventsManager.getManagerForTrace(syntheticEventsManagerByTraceIndex.length - 1);
  }

  static reset(): void {
    syntheticEventsManagerByTraceIndex.length = 0;
  }

  private constructor(rawEvents: readonly Types.TraceEvents.TraceEventData[]) {
    this.#rawTraceEvents = rawEvents;
  }

  /**
   * Registers and returns a branded synthetic event. Synthetic events need to
   * be created with this method to ensure they are registered and made
   * available to load events using serialized keys.
   */
  registerSyntheticBasedEvent<T extends Types.TraceEvents.SyntheticBasedEvent>(syntheticEvent: Omit<T, '_tag'>): T {
    const rawIndex = this.#rawTraceEvents.indexOf(syntheticEvent.rawSourceEvent);
    if (rawIndex < 0) {
      throw new Error('Attempted to register a synthetic event paired to an unknown raw event.');
    }
    const eventAsSynthetic = syntheticEvent as T;
    this.#syntheticTraceEvents[rawIndex] = eventAsSynthetic;
    return eventAsSynthetic;
  }

  syntheticEventForRawEventIndex(rawEventIndex: number): Types.TraceEvents.SyntheticBasedEvent {
    const syntheticEvent = this.#syntheticTraceEvents.at(rawEventIndex);
    if (!syntheticEvent) {
      throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${rawEventIndex}`);
    }
    return syntheticEvent;
  }

  allSyntheticEvents(): Types.TraceEvents.SyntheticBasedEvent[] {
    return this.#syntheticTraceEvents;
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

  static isTraceEventSerializableKey(key: (number|string)[]): key is TraceEngine.Types.File.TraceEventSerializableKey {
    const maybeValidKey = key as TraceEngine.Types.File.TraceEventSerializableKey;
    if (SyntheticEventsManager.isProfileCallKey(maybeValidKey)) {
      return key.length === 5 &&
          key.every((entry, i) => i === 0 || typeof entry === 'number' || !isNaN(parseInt(entry, 10)));
    }
    if (SyntheticEventsManager.isRawEventKey(maybeValidKey) ||
        SyntheticEventsManager.isSyntheticEventKey(maybeValidKey)) {
      return key.length === 2 && (typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)));
    }
    return false;
  }

  eventForKey(
      key: TraceEngine.Types.File.TraceEventSerializableKey,
      traceParsedData: TraceEngine.Handlers.Types.TraceParseData): TraceEngine.Types.TraceEvents.TraceEventData {
    if (SyntheticEventsManager.isProfileCallKey(key)) {
      return this.#getModifiedProfileCallByKey(key, traceParsedData);
    }
    if (SyntheticEventsManager.isSyntheticEventKey(key)) {
      const syntheticEvent = this.#syntheticTraceEvents.at(key[1]);
      if (!syntheticEvent) {
        throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${key[1]}`);
      }
      return syntheticEvent;
    }
    if (SyntheticEventsManager.isRawEventKey(key)) {
      return this.#rawTraceEvents[key[1]];
    }
    throw new Error(`Unknown trace event serializable key: ${(key as Array<unknown>).join('-')}`);
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

  #getModifiedProfileCallByKey(
      key: TraceEngine.Types.File.ProfileCallKey,
      traceParsedData: TraceEngine.Handlers.Types.TraceParseData): TraceEngine.Types.TraceEvents.SyntheticProfileCall {
    const cacheResult = this.#modifiedProfileCallByKey.get(key);
    if (cacheResult) {
      return cacheResult;
    }
    const processId = key[1];
    const threadId = key[2];
    const sampleIndex = key[3];
    const nodeId = key[4];
    const profileCallsInThread = traceParsedData.Renderer.processes.get(processId)?.threads.get(threadId)?.profileCalls;
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
}
