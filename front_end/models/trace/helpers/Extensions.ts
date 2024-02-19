// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import type * as Types from '../types/types.js';

import {type TraceEntryNode, type TraceEntryTree, treify} from './TreeHelpers.js';

export interface ExtensionTrackData {
  name: string;
  extensionName: string;
  flameChartEntries: Types.TraceEvents.SyntheticExtensionEntry[];
  tree: TraceEntryTree;
  entryToNode: Map<Types.TraceEvents.SyntheticTraceEntry, TraceEntryNode>;
}

export function buildTrackDataFromExtensionEntries(extensionEntries: Types.TraceEvents.SyntheticExtensionEntry[]):
    ExtensionTrackData[] {
  const dataByTrack = new Map<string, Omit<ExtensionTrackData, 'tree'|'entryToNode'>>();
  const extensionTrackData: ExtensionTrackData[] = [];
  for (const entry of extensionEntries) {
    const trackData = Platform.MapUtilities.getWithDefault(
        dataByTrack, `${entry.args.extensionName}.${entry.args.group}`, () => ({
                                                                          name: entry.args.group,
                                                                          extensionName: entry.args.extensionName,
                                                                          flameChartEntries: [],
                                                                        }));
    trackData.flameChartEntries.push(entry);
  }
  for (const trackData of dataByTrack.values()) {
    const {tree, entryToNode} = treify(trackData.flameChartEntries);
    extensionTrackData.push({
      ...trackData,
      tree,
      entryToNode,
    });
  }
  return extensionTrackData;
}
