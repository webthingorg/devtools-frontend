// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {HandlerState, type TraceEventHandlerName} from './types.js';

export interface TrackData {
  name: string;
  extensionName: string;
  flameChartEntries: Types.TraceEvents.SyntheticExtensionEntry[];
  tree: Helpers.TreeHelpers.TraceEntryTree;
  entryToNode: Map<Types.TraceEvents.SyntheticTraceEntry, Helpers.TreeHelpers.TraceEntryNode>;
}

const extensionFlameChartMeasures: Types.TraceEvents.TraceEventExtensionMeasure[] = [];
const extensionFlameChartMarks: Types.TraceEvents.TraceEventExtensionMark[] = [];
const extensionFlameChartEntries: Types.TraceEvents.SyntheticExtensionEntry[] = [];
const dataByTrack = new Map<string, Omit<TrackData, 'tree'|'entryToNode'>>();
const flameChartEntries: TrackData[] = [];

export interface ExtensionTraceData {
  extensionFlameCharts: readonly TrackData[];
}
let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  extensionFlameChartMeasures.length = 0;
  extensionFlameChartMarks.length = 0;
  extensionFlameChartEntries.length = 0;
  handlerState = HandlerState.INITIALIZED;
  dataByTrack.clear();
  flameChartEntries.length = 0;
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
  const mergedTrackEvents = Helpers.Trace.mergeEventsInOrder(pairedMeasures, extensionFlameChartMarks);
  for (const entry of mergedTrackEvents) {
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
          payload?.name, entry.ts, Types.TraceEvents.ProcessID(0), Types.TraceEvents.ThreadID(0)),
      dur: entry.dur,
      cat: 'timeline-extension',
      args: payload,
    };
    const trackData = Platform.MapUtilities.getWithDefault(dataByTrack, payload.group, () => ({
                                                                                         name: payload.group,
                                                                                         extensionName,
                                                                                         flameChartEntries: [],
                                                                                       }));
    trackData.flameChartEntries.push(extensionFlameChartEntry);
  }
  for (const trackData of dataByTrack.values()) {
    const {tree, entryToNode} = Helpers.TreeHelpers.treify(trackData.flameChartEntries);
    flameChartEntries.push({
      ...trackData,
      tree,
      entryToNode,

    });
  }
}

export function data(): ExtensionTraceData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('ExtensionTraceData handler is not finalized');
  }

  return {
    extensionFlameCharts: [...flameChartEntries],
  };
}

export function deps(): TraceEventHandlerName[] {
  return ['Renderer'];
}
