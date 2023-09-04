// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type SyntheticAuctionWorkletEvent} from '../types/TraceEvents.js';
import * as Types from '../types/types.js';

/**
 * There are two metadata events that we care about.
 * => AuctionWorkletRunningInProcess tells us which process the Auction Worklet
 *    has taken to run in.
 * => AuctionWorkletDoneWithProcess tells us when the worklet is done with that
 *    process. This is less useful - but in the future we might want to surface
 *    this information so we still parse and return the event.
 *
 * It is important to note that the top level PID on these events is NOT the
 * PID that the worklet is running on; instead we have to look at its
 * args.data.pid property, which is the PID of the process that it is running
 * on.
 *
 * For any given RunningInProcess event, we would typically expect to see a
 * DoneWithProcess event, however this is not guaranteed, especially as users
 * can record any chunk of time in DevTools.
 *
 * Similarly, it is also possible to see a DoneWithProcess event without a
 * RunningInProcess event, if the user started recording after the auction
 * worklets started. Therefore we are happy to create
 * SyntheticAuctionWorkletEvents as long as we see just one of these events.
 *
 * If we do get two events and need to pair them, we can use the
 * args.data.target property, which is a string ID shared by both
 * events.
 */
const runningInProcessEvents: Types.TraceEvents.TraceEventAuctionWorkletRunningInProcess[] = [];
const doneWithProcessEvents: Types.TraceEvents.TraceEventAuctionWorkletDoneWithProcess[] = [];

// Keyed by the string `args.data.target`.
const createdSyntheticEvents: Map<string, Types.TraceEvents.SyntheticAuctionWorkletEvent> = new Map();

// Each AuctonWorklet takes over a process and has 2 threads (that we care
// about and want to show as tracks):
// 1. A CrUtilityMain thread which is known as the "control process".
// 2. A AuctionV8HelperThread which is the actual auction worklet and will be
//    either a "Seller" or a "Bidder"
// To detect these we look for the metadata thread_name events. We key these by
// PID so that we can easily look them up later without having to loop through.
const utilityThreads: Map<Types.TraceEvents.ProcessID, Types.TraceEvents.TraceEventThreadName> = new Map();
const v8HelperThreads: Map<Types.TraceEvents.ProcessID, Types.TraceEvents.TraceEventThreadName> = new Map();

export function reset(): void {
  runningInProcessEvents.length = 0;
  doneWithProcessEvents.length = 0;
  createdSyntheticEvents.clear();
  utilityThreads.clear();
  v8HelperThreads.clear();
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (Types.TraceEvents.isTraceEventIsAuctionWorkletRunningInProcess(event)) {
    runningInProcessEvents.push(event);
    return;
  }

  if (Types.TraceEvents.isTraceEventIsAuctionWorkletDoneWithProcess(event)) {
    doneWithProcessEvents.push(event);
    return;
  }

  if (Types.TraceEvents.isThreadName(event)) {
    if (event.args.name === 'auction_worklet.CrUtilityMain') {
      utilityThreads.set(event.pid, event);
      return;
    }
    if (event.args.name === 'AuctionV8HelperThread') {
      v8HelperThreads.set(event.pid, event);
    }
  }
}

function workletType(input: string): Types.TraceEvents.AuctionWorkletType {
  switch (input) {
    case 'seller':
      return Types.TraceEvents.AuctionWorkletType.SELLER;
    case 'bidder':
      return Types.TraceEvents.AuctionWorkletType.BIDDER;
    default:
      return Types.TraceEvents.AuctionWorkletType.UNKNOWN;
  }
}

/**
 * We cannot make the full event without knowing the type of event, but we can
 * create everything other than the `args` field, as those are identical
 * regardless of the type of event.
 */
function makeSyntheticEventBase(event: Types.TraceEvents.TraceEventAuctionWorkletDoneWithProcess|
                                Types.TraceEvents.TraceEventAuctionWorkletRunningInProcess):
    Omit<Types.TraceEvents.SyntheticAuctionWorkletEvent, 'args'> {
  return {
    name: 'SyntheticAuctionWorkletEvent',
    s: Types.TraceEvents.TraceEventScope.THREAD,
    cat: event.cat,
    tid: event.tid,
    ts: event.ts,
    ph: Types.TraceEvents.Phase.INSTANT,
    pid: event.args.data.pid,
    host: event.args.data.host,
    target: event.args.data.target,
    type: workletType(event.args.data.type),
  };
}

export async function finalize(): Promise<void> {
  // Now we go through all runningIn and doneWith events to create the
  // SyntheticAuctionWorkletEvents. We have to check both arrays as we can
  // represent a worklet with just one event. If we do find pairs we pair them
  // up and avoid creating SyntheticAuctionWorkletEvent events.
  // The order is not important here - we could start with either the
  // runningInProcessEvents or the doneWithProcessEvents.

  for (const runningEvent of runningInProcessEvents) {
    const utilityThread = utilityThreads.get(runningEvent.args.data.pid);
    const v8HelperThread = v8HelperThreads.get(runningEvent.args.data.pid);
    if (!utilityThread || !v8HelperThread) {
      // The trace events are incomplete and we cannot show this, so drop it.
      continue;
    }

    const {target} = runningEvent.args.data;
    const existingEvent = createdSyntheticEvents.get(target);
    if (existingEvent) {
      existingEvent.args.data.runningInProcessEvent = runningEvent;
      continue;
    }

    const syntheticEvent: SyntheticAuctionWorkletEvent = {
      ...makeSyntheticEventBase(runningEvent),
      args: {
        data: {
          runningInProcessEvent: runningEvent,
          utilityThread,
          v8HelperThread,
        },
      },
    };
    createdSyntheticEvents.set(target, syntheticEvent);
  }

  for (const doneWithEvent of doneWithProcessEvents) {
    const utilityThread = utilityThreads.get(doneWithEvent.args.data.pid);
    const v8HelperThread = v8HelperThreads.get(doneWithEvent.args.data.pid);
    if (!utilityThread || !v8HelperThread) {
      // The trace events are incomplete and we cannot show this, so drop it.
      continue;
    }

    const {target} = doneWithEvent.args.data;
    const existingEvent = createdSyntheticEvents.get(target);
    if (existingEvent) {
      existingEvent.args.data.doneWithProcessEvent = doneWithEvent;
      continue;
    }

    const syntheticEvent: SyntheticAuctionWorkletEvent = {
      ...makeSyntheticEventBase(doneWithEvent),
      args: {
        data: {
          doneWithProcessEvent: doneWithEvent,
          utilityThread,
          v8HelperThread,
        },
      },
    };
    createdSyntheticEvents.set(target, syntheticEvent);
  }
}

export interface AuctionWorkletsData {
  worklets: readonly SyntheticAuctionWorkletEvent[];
}

export function data(): AuctionWorkletsData {
  return {
    // The mapping of ID=>Event is only useful when creating them, end users
    // only need an array of the discovered worklets.
    worklets: Array.from(createdSyntheticEvents.values()),
  };
}
