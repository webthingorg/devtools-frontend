// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  type SyntheticTraceEntry,
  type TraceEventArgs,
  type TraceEventData,
} from './TraceEvents.js';

export const enum ExtensionEntryType {
  FLAME_CHART_ENTRY = 'flame-chart-entry',
  MARKER = 'marker',
}
export enum ExtensionColorFromPalette {
  // Palette of colors we define. We only expose the key names and the values they map to on
  // each devtools theme.
  BLUE = 'blue',
  RED = 'red',
  PURPLE = 'purple',
  TEAL = 'teal',
  GREEN = 'green',
}

export function extensionColorMapping(color: ExtensionColorFromPalette): string|null {
  switch (color) {
    case ExtensionColorFromPalette.BLUE:
      return 'blue';
    case ExtensionColorFromPalette.RED:
      return 'red';
    case ExtensionColorFromPalette.PURPLE:
      return 'rebeccapurple';
    case ExtensionColorFromPalette.TEAL:
      return 'teal';
    case ExtensionColorFromPalette.GREEN:
      return 'green';
    default:
      return null;
  }
}

export interface ExtensionDataPayload {
  metadata: {dataType: ExtensionEntryType, extensionName: string};
}
export interface ExtensionFlameChartEntryPayload extends ExtensionDataPayload {
  metadata: ExtensionDataPayload['metadata']&{dataType: ExtensionEntryType.FLAME_CHART_ENTRY};
  color: ExtensionColorFromPalette;
  track: string;
  detailsPairs?: [string, string][];
  hintText?: string;
}

export interface ExtensionMarkerPayload extends ExtensionDataPayload {
  metadata: ExtensionDataPayload['metadata']&{dataType: ExtensionEntryType.MARKER};
  color: ExtensionColorFromPalette;
  detailsText?: [string, string][];
  hintText?: string;
}

export interface SyntheticExtensionFlameChartEntry extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionFlameChartEntryPayload;
}

export interface SyntheticExtensionMarker extends SyntheticTraceEntry {
  args: TraceEventArgs&ExtensionMarkerPayload;
}

export type SyntheticExtensionEntry = SyntheticExtensionFlameChartEntry|SyntheticExtensionMarker;

export function getValidColorInPayload(payload: ExtensionDataPayload): string|null {
  if (!('color' in payload)) {
    return null;
  }
  const color = payload['color'] as ExtensionColorFromPalette;
  return extensionColorMapping(color);
}

export function isExtensionPayloadMarker(payload: ExtensionDataPayload): payload is ExtensionMarkerPayload {
  const color = getValidColorInPayload(payload);
  // Add any other field validation
  if (payload.metadata.dataType === ExtensionEntryType.MARKER && color === null) {
    console.error(`Got an invalid color for extension marker: ${payload}`);
  }
  return payload.metadata.dataType === ExtensionEntryType.MARKER && color !== null;
}

export function isExtensionPayloadFlameChartEntry(payload: ExtensionDataPayload):
    payload is ExtensionFlameChartEntryPayload {
  const color = getValidColorInPayload(payload);
  // Add any other field validation
  if (payload.metadata.dataType === ExtensionEntryType.FLAME_CHART_ENTRY && color === null) {
    console.error(`Got an invalid color for extension entry: ${payload}`);
  }
  return payload.metadata.dataType === ExtensionEntryType.FLAME_CHART_ENTRY;
}

export function isSyntheticExtensionEntry(entry: TraceEventData): entry is SyntheticExtensionEntry {
  return entry.cat === 'timeline-extension';
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
