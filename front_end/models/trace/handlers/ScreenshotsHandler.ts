// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {data as metaHandlerData} from './MetaHandler.js';
import {type TraceEventHandlerName} from './types.js';

// Each thread contains events. Events indicate the thread and process IDs, which are
// used to store the event in the correct process thread entry below.
const eventsInProcessThread =
    new Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventSnapshot[]>>();
const unpairedAsyncEvents: Types.TraceEvents.TraceEventNestableAsync[] = [];

let snapshots: Types.TraceEvents.TraceEventSnapshot[] = [];
export function reset(): void {
  eventsInProcessThread.clear();
  snapshots.length = 0;
  unpairedAsyncEvents.length = 0;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (event.name === 'Screenshot') {
    Helpers.Trace.addEventToProcessThread(event, eventsInProcessThread);
  } else if (event.name === 'PipelineReporter') {
    unpairedAsyncEvents.push(event);
  }
}

export async function finalize(): Promise<void> {
  const {browserProcessId, browserThreadId} = metaHandlerData();
  const syntheticEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(unpairedAsyncEvents);

  const pReporterByFrameSequence = Object.fromEntries(
      syntheticEvents.map(e => [e.args?.data.beginEvent.args.chrome_frame_reporter.frame_sequence, e]));

  // Correct the screenshot timestamps
  // The screenshot 'snapshot object' trace event has the "frame sequence number" attached as an ID.
  // We match that up with the "PipelineReporter" trace events as they terminate at presentation.
  // Presentation == when the pixels hit the screen. AKA Swap on the GPU
  const browserThreads = eventsInProcessThread.get(browserProcessId);
  if (browserThreads) {
    snapshots = browserThreads.get(browserThreadId) || [];
    for (const snapshot of snapshots) {
      const frameSequence = parseInt(snapshot.id, 16);
      const matchingPReporter = pReporterByFrameSequence[frameSequence];
      if (matchingPReporter) {
        const presentationTs = Types.Timing.MicroSeconds(matchingPReporter.ts + matchingPReporter.dur);
        // The screenshot trace event's `ts` reflects the "expected display time" which is ESTIMATE.
        // It is set by the compositor frame sink from the `expected_display_time`, which is based on a previously known
        // frame start PLUS the vsync interval (eg 16.6ms)

        // Overwrite the estimated ts with the correct one.
        snapshot.ts = presentationTs;
      } else {
        // We generally don't match the very first screenshot and, sometimes, the last
        // The very first screenshot is requested immediately (even if nothing is painting). As a result there's no compositor
        // instrumentation running alongside.
        // The last screenshot sometimes has no matching PipelineReporter we hit a race condition in collecting the trace events.
      }
    }
  }
}

export function data(): Types.TraceEvents.TraceEventSnapshot[] {
  return [...snapshots];
}

export function deps(): TraceEventHandlerName[] {
  return ['Meta'];
}
