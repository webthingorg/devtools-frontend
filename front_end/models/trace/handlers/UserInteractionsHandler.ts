// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';

import {HandlerState} from './types.js';

// This handler serves two purposes. It generates a list of evnets that are
// used to show user clicks in the timeline. It is also used to gather
// EventTimings into Interactions, which we use to show interactions and
// highlight long interactions to the user, along with INP.

// We don't need to know which process / thread these events occurred in,
// because they are effectively global, so we just track all that we find.
const allEvents: Types.TraceEvents.TraceEventEventTiming[] = [];

export interface UserInteractionsData {
  allEvents: readonly Types.TraceEvents.TraceEventEventTiming[];
  interactionEvents: readonly SyntheticInteractionEvent[];
}

export interface SyntheticInteractionEvent {
  startEvent: Types.TraceEvents.TraceEventEventTimingStart;
  endEvent: Types.TraceEvents.TraceEventEventTimingEnd;
  // InteractionID and type are available within the startEvent's data, but we
  // put them on the top level for ease of access.
  interactionId: number;
  type: string;
  // This is equivalent to startEvent.ts;
  ts: Types.Timing.MicroSeconds;
  // This duration can be calculated via endEvent.ts - startEvent.ts, but we do
  // that and put it here to make it easier. This also makes these events
  // consistent with real events that have a dur field.
  dur: Types.Timing.MicroSeconds;
}

const interactionEvents: SyntheticInteractionEvent[] = [];
const eventTimingEndEventsById = new Map<string, Types.TraceEvents.TraceEventEventTimingEnd>();
const eventTimingStartEventsForInteractions: Types.TraceEvents.TraceEventEventTimingStart[] = [];

let handlerState = HandlerState.UNINITIALIZED;
export function reset(): void {
  allEvents.length = 0;
  interactionEvents.length = 0;
  eventTimingStartEventsForInteractions.length = 0;
  eventTimingEndEventsById.clear();
  handlerState = HandlerState.INITIALIZED;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('Handler is not initialized');
  }

  if (!Types.TraceEvents.isTraceEventEventTiming(event)) {
    return;
  }

  if (Types.TraceEvents.isTraceEventEventTimingEnd(event)) {
    // Store the end event; for each start event that is an interaction, we need the matching end event to calculate the duration correctly.
    eventTimingEndEventsById.set(event.id, event);
  }

  allEvents.push(event);

  // From this point on we want to find events that represent interactions.
  // These events are always start events - those are the ones that contain all
  // the metadata about the interaction.
  if (!event.args.data || !Types.TraceEvents.isTraceEventEventTimingStart(event)) {
    return;
  }
  const {duration, interactionId} = event.args.data;
  // We exclude events for the sake of interactions if:
  // 1. They have no duration.
  // 2. They have no interactionId
  // 3. They have an interactionId of 0: this indicates that it's not an
  //    interaction that we care about because it hasn't had its own interactionId
  //    set (0 is the default on the backend).
  // See: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/timing/responsiveness_metrics.cc;l=133;drc=40c209a9c365ebb9f16fb99dfe78c7fe768b9594

  if (duration < 1 || interactionId === undefined || interactionId === 0) {
    return;
  }

  // Store the start event. In the finalize() function we will pair this with
  // its end event and create the synthetic interaction event.
  eventTimingStartEventsForInteractions.push(event);
}

export async function finalize(): Promise<void> {
  // For each interaction start event, find the async end event by the ID, and then create the Synthetic Interaction event.
  for (const interactionStartEvent of eventTimingStartEventsForInteractions) {
    const endEvent = eventTimingEndEventsById.get(interactionStartEvent.id);
    if (!endEvent) {
      // If we cannot find an end event, bail and drop this event.
      continue;
    }
    if (!interactionStartEvent.args.data?.type || !interactionStartEvent.args.data?.interactionId) {
      // A valid interaction event that we care about has to have a type (e.g.
      // pointerdown, keyup).
      //
      // We also need to ensure it has an interactionId. We already checked
      // this in the handleEvent() function, but we do it here also to satisfy
      // TypeScript.
      continue;
    }

    const interactionEvent: SyntheticInteractionEvent = {
      startEvent: interactionStartEvent,
      endEvent: endEvent,
      ts: interactionStartEvent.ts,
      dur: Types.Timing.MicroSeconds(endEvent.ts - interactionStartEvent.ts),
      type: interactionStartEvent.args.data.type,
      interactionId: interactionStartEvent.args.data.interactionId,
    };
    interactionEvents.push(interactionEvent);
  }
  handlerState = HandlerState.FINALIZED;
}

export function data(): UserInteractionsData {
  return {
    allEvents: [...allEvents],
    interactionEvents: [...interactionEvents],
  };
}
