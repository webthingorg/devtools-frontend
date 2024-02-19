// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {HandlerState, type TraceEventHandlerName} from './types.js';

const extensionFlameChartMeasures: Types.TraceEvents.TraceEventExtensionMeasure[] = [];
const extensionFlameChartMarks: Types.TraceEvents.TraceEventExtensionMark[] = [];
const extensionFlameChartEntries: Types.TraceEvents.SyntheticExtensionEntry[] = [];
let extensionFlameCharts: Helpers.Extensions.ExtensionTrackData[] = [];

export interface ExtensionTraceData {
  extensionFlameCharts: readonly Helpers.Extensions.ExtensionTrackData[];
}
let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  extensionFlameChartMeasures.length = 0;
  extensionFlameChartMarks.length = 0;
  extensionFlameChartEntries.length = 0;
  handlerState = HandlerState.INITIALIZED;
  extensionFlameCharts.length = 0;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('ExtensionTraceData handler is not initialized');
  }

  if (Types.TraceEvents.isTraceEventExtensionMeasure(event)) {
    extensionFlameChartMeasures.push(event);
    return;
  }
  if (Types.TraceEvents.isTraceEventExtensionPerformanceMark(event)) {
    extensionFlameChartMarks.push(event);
  }
}

export async function finalize(): Promise<void> {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('ExtensionTraceData handler is not initialized');
  }
  createExtensionFlameChartEntries();
  handlerState = HandlerState.FINALIZED;
}

function createExtensionFlameChartEntries(): void {
  const syntheticEventCallback = (event: Types.TraceEvents.SyntheticExtensionPair): void => {
    const eventPayload = event.args.data.beginEvent.args.detail;
    if (!eventPayload) {
      return;
    }
    event.args.detail = eventPayload;
  };
  const pairedMeasures: Types.TraceEvents.SyntheticExtensionPair[] =
      Helpers.Trace.createMatchedSortedSyntheticEvents(extensionFlameChartMeasures, syntheticEventCallback);
  const mergedRawExtensionEvents = Helpers.Trace.mergeEventsInOrder(pairedMeasures, extensionFlameChartMarks);
  const syntheticExtensionEntries = createSyntheticExtensionMetrics(mergedRawExtensionEvents);
  extensionFlameCharts = Helpers.Extensions.buildTrackDataFromExtensionEntries(syntheticExtensionEntries);
}

function createSyntheticExtensionMetrics(
    extensionEvents: (Types.TraceEvents.SyntheticExtensionPair|Types.TraceEvents.TraceEventExtensionMark)[]):
    Types.TraceEvents.SyntheticExtensionEntry[] {
  const allSyntheticExtensionEntries: Types.TraceEvents.SyntheticExtensionEntry[] = [];
  for (const entry of extensionEvents) {
    const extensionName = entry.name.split('devtools-entry')[1];
    if (!extensionName) {
      console.error('Extension track entry did not have an extension name', entry);
      continue;
    }
    const payload = entry.args.detail ?
        JSON.parse(entry.args.detail) as Types.TraceEvents.ExtensionFlamechartEntryPayload :
        undefined;
    if (!payload) {
      console.error('Extension track entry did not have a payload', entry);
      continue;
    }
    const extensionFlameChartEntry: Types.TraceEvents.SyntheticExtensionEntry = {
      ...Helpers.Trace.makeSyntheticTraceEntry(
          payload.name, entry.ts, Types.TraceEvents.ProcessID(0), Types.TraceEvents.ThreadID(0)),
      dur: entry.dur,
      cat: 'timeline-extension',
      args: {...payload, extensionName},
    };
    allSyntheticExtensionEntries.push(extensionFlameChartEntry);
  }
  return allSyntheticExtensionEntries;
}

export function data(): ExtensionTraceData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('ExtensionTraceData handler is not finalized');
  }

  return {
    extensionFlameCharts: [...extensionFlameCharts],
  };
}

export function deps(): TraceEventHandlerName[] {
  return ['Renderer'];
}
