// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {data as metaHandlerData} from './MetaHandler.js';
import {type TraceEventHandlerName} from './types.js';

// Each thread contains events. Events indicate the thread and process IDs, which are
// used to store the event in the correct process thread entry below.
const eventsInProcessThread = new Map<
    Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventScreenshotSnapshot[]>>();
const unpairedAsyncEvents: Types.TraceEvents.TraceEventNestableAsync[] = [];

let screenshotEvents: Types.TraceEvents.TraceEventScreenshotSnapshot[] = [];
let frameSequenceToTs: Record<string, Types.Timing.MicroSeconds> = {};
export function reset(): void {
  eventsInProcessThread.clear();
  screenshotEvents.length = 0;
  unpairedAsyncEvents.length = 0;
  frameSequenceToTs = {};
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (event.name === 'Screenshot') {
    Helpers.Trace.addEventToProcessThread(event, eventsInProcessThread);
  } else if (event.name === 'PipelineReporter') {
    unpairedAsyncEvents.push(event as Types.TraceEvents.TraceEventNestableAsync);
  }
}

export async function finalize(): Promise<void> {
  const syntheticEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(unpairedAsyncEvents) as
      Types.TraceEvents.TraceEventSyntheticPipelineReporter[];

  frameSequenceToTs = Object.fromEntries(syntheticEvents.map(evt => {
    const frameSequenceId = evt.args.data.beginEvent.args.chrome_frame_reporter.frame_sequence;
    const presentationTs = Types.Timing.MicroSeconds(evt.ts + evt.dur);
    return [frameSequenceId, presentationTs];
  }));

  const {browserProcessId, browserThreadId} = metaHandlerData();
  const browserThreads = eventsInProcessThread.get(browserProcessId);
  if (browserThreads) {
    screenshotEvents = browserThreads.get(browserThreadId) || [];
  }
}

/**
 * Correct the screenshot timestamps
 * The screenshot 'snapshot object' trace event has the "frame sequence number" attached as an ID.
 * We match that up with the "PipelineReporter" trace events as they terminate at presentation.
 * Presentation == when the pixels hit the screen. AKA Swap on the GPU
 */
export function getPresentationTimestamp(screenshotEvent: Types.TraceEvents.TraceEventScreenshotSnapshot):
    Types.Timing.MicroSeconds {
  const frameSequence = parseInt(screenshotEvent.id, 16);
  // The screenshot trace event's `ts` reflects the "expected display time" which is ESTIMATE.
  // It is set by the compositor frame sink from the `expected_display_time`, which is based on a previously known
  // frame start PLUS the vsync interval (eg 16.6ms)
  const updatedTs = frameSequenceToTs[frameSequence];
  // Do we always find a match? No...
  // We generally don't match the very first screenshot and, sometimes, the last
  // The very first screenshot is requested immediately (even if nothing is painting). As a result there's no compositor
  // instrumentation running alongside.
  // The last one is sometimes missing as because the trace terminates right before the associated PipelineReporter is emitted.
  return updatedTs ?? screenshotEvent.ts;
}

export function data(): Types.TraceEvents.TraceEventScreenshotSnapshot[] {
  return screenshotEvents;
}

export function deps(): TraceEventHandlerName[] {
  return ['Meta'];
}
