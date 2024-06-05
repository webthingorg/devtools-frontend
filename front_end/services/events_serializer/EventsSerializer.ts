// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../core/platform/platform.js';
import * as TraceEngine from '../../models/trace/trace.js';

export class EventsSerializer {
  #modifiedProfileCallByKey:
      Map<TraceEngine.Types.File.ProfileCallKeyValues, TraceEngine.Types.TraceEvents.SyntheticProfileCall> = new Map();

  keyForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): TraceEngine.Types.File.TraceEventSerializableKey
      |null {
    if (TraceEngine.Types.TraceEvents.isProfileCall(event)) {
      return `p-${event.pid}-${event.tid}-${TraceEngine.Types.TraceEvents.SampleIndex(event.sampleIndex)}-${event.nodeId}`;
    }
    const rawEvents = TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getRawTraceEvents();
    const key: TraceEngine.Types.File.SyntheticEventKey|TraceEngine.Types.File.RawEventKey =
        TraceEngine.Types.TraceEvents.isSyntheticBasedEvent(event) ? `s-${rawEvents.indexOf(event.rawSourceEvent)}` : `r-${rawEvents.indexOf(event)}`
    if (key.length < 3) {
      return null;
    }
    return key;
  }

  eventForKey(
      key: TraceEngine.Types.File.TraceEventSerializableKeyValues,
      traceParsedData: TraceEngine.Handlers.Types.TraceParseData): TraceEngine.Types.TraceEvents.TraceEventData {
    if (EventsSerializer.isProfileCallKey(key)) {
      return this.#getModifiedProfileCallByKey(key, traceParsedData);
    }
    if (EventsSerializer.isSyntheticEventKey(key)) {
      const syntheticEvents =
          TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getSyntheticTraceEvents();
      const syntheticEvent = syntheticEvents.at(key[1]);
      if (!syntheticEvent) {
        throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${key[1]}`);
      }
      return syntheticEvent;
    }
    if (EventsSerializer.isRawEventKey(key)) {
      const rawEvents =
          TraceEngine.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getRawTraceEvents();
      return rawEvents[key[1]];
    }
    throw new Error(`Unknown trace event serializable key values: ${(key as Array<unknown>).join('-')}`);
  }

  traceEventSerializableValuesToKey(key: TraceEngine.Types.File.TraceEventSerializableKeyValues): TraceEngine.Types.File.TraceEventSerializableKey{
    if(EventsSerializer.isProfileCallKey(key)) {
      return `${key[0]}-${key[1]}-${key[2]}-${key[3]}-${key[4]}`;
    } else if(EventsSerializer.isRawEventKey(key)) {
      return `${key[0]}-${key[1]}`;
    } else if(EventsSerializer.isSyntheticEventKey(key)) {
      return `${key[0]}-${key[1]}`;
    }
    throw new Error(`Unknown trace event serializable key values: ${(key as Array<unknown>).join('-')}`);
  }

  traceEventKeyToValues(key: TraceEngine.Types.File.TraceEventSerializableKey): TraceEngine.Types.File.TraceEventSerializableKeyValues {
    const parts = key.split('-');
    const type = parts[0];
  
    switch (type) {
      case 'p': 
        if (parts.length !== 5 || !(parts.every((entry, i) => i === 0 || typeof entry === 'number' || !isNaN(parseInt(entry, 10))))) throw new Error(`Invalid ProfileCallKey: ${key}`);
        return [
          parts[0], 
          parseInt(parts[1], 10),
          parseInt(parts[2], 10), 
          parseInt(parts[3], 10), 
          parseInt(parts[4], 10)
        ] as TraceEngine.Types.File.ProfileCallKeyValues;
      case 'r':
        if (parts.length !== 2 || !(typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)))) throw new Error(`Invalid RawEvent Key: ${key}`);
        return [
          parts[0], 
          parseInt(parts[1], 10),
        ] as TraceEngine.Types.File.RawEventKeyValues;
      case 's':
        if (parts.length !== 2 || !(typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)))) throw new Error(`Invalid SyntheticEvent Key: ${key}`);
        return [
          parts[0], 
          parseInt(parts[1], 10),
        ] as TraceEngine.Types.File.SyntheticEventKeyValues;
      default:
        throw new Error(`Unknown trace event key: ${key}`);
    }
  }
  

  static isProfileCallKey(key: TraceEngine.Types.File.TraceEventSerializableKeyValues):
      key is TraceEngine.Types.File.ProfileCallKeyValues {
    return key[0] === 'p';
  }
  static isRawEventKey(key: TraceEngine.Types.File.TraceEventSerializableKeyValues):
      key is TraceEngine.Types.File.RawEventKeyValues {
    return key[0] === 'r';
  }
  static isSyntheticEventKey(key: TraceEngine.Types.File.TraceEventSerializableKeyValues):
      key is TraceEngine.Types.File.SyntheticEventKeyValues {
    return key[0] === 's';
  }

  #getModifiedProfileCallByKey(
      key: TraceEngine.Types.File.ProfileCallKeyValues,
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
