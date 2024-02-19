// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';

export interface InitiatorPair {
  event: TraceEngine.Types.TraceEvents.TraceEventData;
  initiator: TraceEngine.Types.TraceEvents.TraceEventData;
}
/**
 * Given an event that the user has selected, this function returns all the
 * pairs of events and their initiators that need to be drawn on the flamechart.
 * The reason that this can return multiple pairs is because we draw the
 * entire chain: for each event's initiator, we see if it had an initiator, and
 * work backwards to draw each one.
 */
export function eventInitiatorPairsToDraw(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    ): readonly InitiatorPair[] {
  const pairs: InitiatorPair[] = [];

  let currentEvent: TraceEngine.Types.TraceEvents.TraceEventData|null = selectedEvent;
  
  // Build event pairs up to the selected one
  while (currentEvent) {
    const currentInitiator = traceEngineData.Initiators.eventToInitiator.get(currentEvent);
    
    if (currentInitiator) {
      // Store the current pair, and then set the initiator to
      // be the current event, so we work back through the
      // trace and find the initiator of the initiator, and so
      // on...
      pairs.push({event: currentEvent, initiator: currentInitiator});
      currentEvent = currentInitiator;
      continue;
    }

    if (!TraceEngine.Types.TraceEvents.isSyntheticTraceEntry(currentEvent)) {
      // If the current event is not a renderer, we have no
      // concept of a parent event, so we can bail.
      currentEvent = null;
      break;
    }

    const nodeForCurrentEvent = traceEngineData.Renderer.entryToNode.get(currentEvent);
    if (!nodeForCurrentEvent) {
      // Should not happen - if it does something odd is going
      // on so let's give up.
      currentEvent = null;
      break;
    }

    // Go up to the parent, and loop again.
    currentEvent = nodeForCurrentEvent.parent?.entry || null;
  }

  // Build event pairs following the selected one using breath first search
  let currentEvent2: TraceEngine.Types.TraceEvents.TraceEventData|null = selectedEvent;
  const eventsQueue = [currentEvent2];
  const seen: {[key: number]: boolean} = {};

  while (eventsQueue.length > 0) {
    console.log("here");
    const currEvent = eventsQueue.pop();

    if(!currEvent) {
      return pairs;
    }
    
    const nodeForCurrentEvent = traceEngineData.Renderer.entryToNode.get(currEvent);
    if(!nodeForCurrentEvent?.id) {
      break;
    }

    seen[nodeForCurrentEvent?.id] = true;

    const currentInitiators = traceEngineData.Initiators.initiatorToEvents.get(currEvent);
    // console.log(traceEngineData.Initiators.initiatorToEvents);

    if (currentInitiators) {
      console.log("initiatooors");
      // Store the current pair, and then set the initiator to
      // be the current event, so we work back through the
      // trace and find the initiator of the initiator, and so
      // on...
      currentInitiators.forEach(initiator => {
        pairs.push({event: currEvent, initiator: initiator});
        eventsQueue.push(initiator);
      });
      // currentEvent = currentInitiator;
      continue;
    }

    // Add children to the queue
    if (!nodeForCurrentEvent) {
      // Should not happen - if it does something odd is going
      // on so let's give up.
      currentEvent = null;
      break;
    }
    const currChildren = nodeForCurrentEvent.children || null;
    currChildren.forEach(child => {
      console.log(child.id);
      if(!seen[child.id]) {
        // console.log("add");
        eventsQueue.push(child.entry);
      } else {
        console.log("repeating");
      }

    })
  }


  return pairs;
}
