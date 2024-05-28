// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';

const syntheticEventsManagerByTraceIndex: SyntheticEventsManager[] = [];

export class SyntheticEventsManager {
  /**
   * All synthetic entries created in a trace based on a corresponding
   * raw trace event. The array is indexed based on the position of the
   * raw event in the original raw data in Model#rawEvents.
   */
  #syntheticTraceEvents: Types.TraceEvents.SyntheticBasedEvent[] = [];
  /**
   * All raw entries from a trace.
   */
  #rawTraceEvents: readonly Types.TraceEvents.TraceEventData[] = [];
  /**
   * All profile calls created for a trace.
   */
  #profileCallsByKey = new Map<Types.File.ProfileCallKey, Types.TraceEvents.SyntheticProfileCall>();

  /**
   * Initializes a SyntheticEventsManager for a trace. This needs to be
   * called before running the trace engine handlers, since the instance
   * created here will be used by the handlers to register their
   * synthetic trace events.
   */
  static initManagerForTrace(rawEvents: readonly Types.TraceEvents.TraceEventData[]): SyntheticEventsManager {
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
      throw new Error(`Attempted to get a SyntheticEventsManager with an invalid index ${last}`);
    }
    return manager;
  }

  private constructor(rawEvents: readonly Types.TraceEvents.TraceEventData[]) {
    this.#rawTraceEvents = rawEvents;
  }

  /**
   * Registers and returns a branded based synthetic event. Synthetic events need to
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

  /**
   * Registers and returns a branded profile call.
   */
  registerProfileCall(profileCall: Omit<Types.TraceEvents.SyntheticProfileCall, '_tag'>):
      Types.TraceEvents.SyntheticProfileCall {
    const key: Types.File.ProfileCallKey = [
      'p',
      profileCall.pid,
      profileCall.tid,
      Types.TraceEvents.SampleIndex(profileCall.sampleIndex),
      profileCall.nodeId,
    ];
    const eventAsProfileCall = profileCall as Types.TraceEvents.SyntheticProfileCall;
    this.#profileCallsByKey.set(key, eventAsProfileCall);
    return eventAsProfileCall;
  }

  syntheticEventForRawEventIndex(rawEventIndex: number): Types.TraceEvents.SyntheticBasedEvent {
    const syntheticEvent = this.#syntheticTraceEvents.at(rawEventIndex);
    if (!syntheticEvent) {
      throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${rawEventIndex}`);
    }
    return syntheticEvent;
  }

  profileCallForKey(key: Types.File.ProfileCallKey): Types.TraceEvents.SyntheticProfileCall {
    const profileCall = this.#profileCallsByKey.get(key);
    if (!profileCall) {
      throw new Error(`Attempted to get a profile call from an unknown key: ${key.join('-')}`);
    }
    return profileCall;
  }
}
