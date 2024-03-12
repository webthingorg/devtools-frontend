// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {type SyntheticTraceEntry, type TraceEventArgs} from './TraceEvents.js';

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

export function isExtensionPayloadFlameChartEntry(payload: ExtensionDataPayload):
    payload is ExtensionFlameChartEntryPayload {
  return payload.metadata.dataType === ExtensionEntryType.FLAME_CHART_ENTRY;
}

export function isExtensionPayloadMarker(payload: ExtensionDataPayload): payload is ExtensionMarkerPayload {
  return payload.metadata.dataType === ExtensionEntryType.MARKER;
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
