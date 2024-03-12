// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  isSyntheticUserTiming,
  isTraceEventPerformanceMark,
  type SyntheticTraceEntry,
  type SyntheticUserTimingPair,
  type TraceEventArgs,
  type TraceEventData,
  type TraceEventPerformanceMark,
} from './TraceEvents.js';

export const enum ExtensionEntryType {
  FLAME_CHART_ENTRY = 'FLAME_CHART_ENTRY',
  MARKER = 'MARKER',
}

export interface ExtensionDataPayload {
  metadata: {dataType: ExtensionEntryType, extensionName: string};
}
export interface ExtensionFlameChartEntryPayload extends ExtensionDataPayload {
  metadata: ExtensionDataPayload['metadata']&{dataType: ExtensionEntryType.FLAME_CHART_ENTRY};
  color: string;
  track: string;
  detailsText?: string;
  hintText?: string;
}

export interface ExtensionMarkerPayload extends ExtensionDataPayload {
  metadata: ExtensionDataPayload['metadata']&{dataType: ExtensionEntryType.MARKER};
  color: string;
  detailsText?: string;
  hintText?: string;
}

export interface SyntheticExtensionFlameChartEntry extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionFlameChartEntryPayload;
}

export interface SyntheticExtensionMarker extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionMarkerPayload;
}

export type SyntheticExtensionEntry = SyntheticExtensionFlameChartEntry|SyntheticExtensionMarker;

export function isExtensionPayloadFlameChartEntry(payload: ExtensionDataPayload):
    payload is ExtensionFlameChartEntryPayload {
  return payload.metadata.dataType === ExtensionEntryType.FLAME_CHART_ENTRY;
}

export function isExtensionPayloadMarker(payload: ExtensionDataPayload): payload is ExtensionMarkerPayload {
  return payload.metadata.dataType === ExtensionEntryType.MARKER;
}

export function isSyntheticExtensionEntry(entry: TraceEventData): entry is SyntheticExtensionEntry {
  return (isSyntheticUserTiming(entry) || isTraceEventPerformanceMark(entry)) && Boolean(extensionDataInTiming(entry));
}

export function extensionDataInTiming(timing: SyntheticUserTimingPair|TraceEventPerformanceMark): ExtensionDataPayload|
    null {
  const timingDetail =
      isTraceEventPerformanceMark(timing) ? timing.args.detail : timing.args.data.beginEvent.args.detail;
  if (!timingDetail) {
    return null;
  }
  const detailObj = JSON.parse(timingDetail);
  if (!('devtools' in detailObj)) {
    return null;
  }
  if (!('metadata' in detailObj['devtools'])) {
    return null;
  }
  return detailObj;
}

/**
 * Synthetic events created for extension tracks.
 */
export interface SyntheticExtensionFlameChartEntry extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionFlameChartEntryPayload;
  cat: 'timeline-extension';
}

/**
 * Synthetic events created for extension marks.
 */
export interface SyntheticExtensionMarker extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionMarkerPayload;
  cat: 'timeline-extension';
}

export interface ExtensionTrackData {
  name: string;
  extensionName: string;
  flameChartEntries: SyntheticExtensionFlameChartEntry[];
}
