// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Protocol from '../../../generated/protocol.js';

import {type TraceWindowMicroSeconds} from './Timing.js';
import {type ProcessID, type SampleIndex, type ThreadID, type TraceEventData} from './TraceEvents.js';

export type TraceFile = {
  traceEvents: readonly TraceEventData[],
  metadata: MetaData,
};

export interface Breadcrumb {
  window: TraceWindowMicroSeconds;
  child: Breadcrumb|null;
}

export const enum DataOrigin {
  CPUProfile = 'CPUProfile',
  TraceEvents = 'TraceEvents',
}

// Serializable keys are created for trace events to be able to save
// references to timeline events in a trace file. These keys enable
// user modifications that can be saved. See go/cpq:event-data-json for
// more details on the key format.
export type RawEventKeyValues = {
  type: 'r',
  number: number,
};

export type SyntheticEventKeyValues = {
  type: 's',
  number: number,
};

export type ProfileCallKeyValues = {
  type: 'p',
  processID: ProcessID,
  shreadID: ThreadID,
  sampleIndex: SampleIndex,
  protocol: Protocol.integer,
};

export type TraceEventSerializableKeyValues = RawEventKeyValues|ProfileCallKeyValues|SyntheticEventKeyValues;

export function traceEventKeyToValues(key: TraceEventSerializableKey): TraceEventSerializableKeyValues {
  const parts = key.split('-');
  const type = parts[0];

  switch (type) {
    case 'p':
      if (parts.length !== 5 ||
          !(parts.every((entry, i) => i === 0 || typeof entry === 'number' || !isNaN(parseInt(entry, 10))))) {
        throw new Error(`Invalid ProfileCallKey: ${key}`);
      }
      return {
        type: parts[0],
        processID: parseInt(parts[1], 10),
        shreadID: parseInt(parts[2], 10),
        sampleIndex: parseInt(parts[3], 10),
        protocol: parseInt(parts[4], 10),
      } as ProfileCallKeyValues;
    case 'r':
      if (parts.length !== 2 || !(typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)))) {
        throw new Error(`Invalid RawEvent Key: ${key}`);
      }
      return {
        type: parts[0],
        number: parseInt(parts[1], 10),
      } as RawEventKeyValues;
    case 's':
      if (parts.length !== 2 || !(typeof key[1] === 'number' || !isNaN(parseInt(key[1], 10)))) {
        throw new Error(`Invalid SyntheticEvent Key: ${key}`);
      }
      return {
        type: parts[0],
        number: parseInt(parts[1], 10),
      } as SyntheticEventKeyValues;
    default:
      throw new Error(`Unknown trace event key: ${key}`);
  }
}

export type RawEventKey = `r-${number}`;
export type SyntheticEventKey = `s-${number}`;
export type ProfileCallKey = `p-${ProcessID}-${ThreadID}-${SampleIndex}-${Protocol.integer}`;
export type TraceEventSerializableKey = RawEventKey|ProfileCallKey|SyntheticEventKey;

export interface Modifications {
  entriesModifications: {
    // Entries hidden by the user
    hiddenEntries: TraceEventSerializableKey[],
    // Entries that parent a hiddenEntry
    expandableEntries: TraceEventSerializableKey[],
  };
  initialBreadcrumb: Breadcrumb;
}

/**
 * Trace metadata that we persist to the file. This will allow us to
 * store specifics for the trace, e.g., which tracks should be visible
 * on load.
 */
export interface MetaData {
  source?: 'DevTools';
  startTime?: string;
  networkThrottling?: string;
  cpuThrottling?: number;
  hardwareConcurrency?: number;
  dataOrigin?: DataOrigin;
  modifications?: Modifications;
}

export type Contents = TraceFile|TraceEventData[];
