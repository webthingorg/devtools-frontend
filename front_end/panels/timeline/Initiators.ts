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
 * entire chain: the initiators that lead to the event or its parent event, as
 * well as the pairs of events that were initiated by the children of selected event.
 */
export function eventInitiatorPairsToDraw(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    ): readonly InitiatorPair[] {
  // return [...findEventInitiatorPairsAncestors(traceEngineData, selectedEvent), ...findEventInitiatorPairsPredesessors(traceEngineData, selectedEvent)];
  return [
    ...findEventInitiatorPairsAncestors(traceEngineData, selectedEvent),
    ...findEventInitiatorPairsPredesessors(traceEngineData, selectedEvent),
  ];
}

function findEventInitiatorPairsAncestors(
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

  return pairs;
}

function findEventInitiatorPairsPredesessors(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    ): readonly InitiatorPair[] {
  const pairs: InitiatorPair[] = [];

  /* To find all event initiators associated with the selected entry's predecessors, create a queue of entries to check for in the map that contains events for initiators.
  * Because an entry can have multiple children, we keep adding them all to the queue. This method is similar to breadth-first search.
  * Once an entry that is an initiator is found, add it to the queue and proceed to check its children.
  * Start the queue with selected entry and loop until all predecessors are checked.
  */
  const eventsQueue: TraceEngine.Types.TraceEvents.TraceEventData[] = [selectedEvent];

  while (eventsQueue.length > 0) {
    const currentEvent: TraceEngine.Types.TraceEvents.TraceEventData|undefined = eventsQueue.pop();
    if (!currentEvent) {
      return pairs;
    }

    const eventsInitiatedByCurrent = traceEngineData.Initiators.initiatorToEvents.get(currentEvent);
    if (eventsInitiatedByCurrent) {
      eventsInitiatedByCurrent.forEach(event => {
        // Store the found pair of initiators and push the found initiator to the queue to later check it' children.
        pairs.push({event: event, initiator: currentEvent});
        eventsQueue.push(event);
      });
      continue;
    }

    const nodeForCurrentEvent = traceEngineData.Renderer.entryToNode.get(currentEvent);
    if (!nodeForCurrentEvent) {
      // Should not happen - if it does something odd is going
      // on so let's give up.
      break;
    }

    // Add the children of current entry to the queue to check if they are initiators for any events.
    nodeForCurrentEvent.children.forEach(child => {
      eventsQueue.push(child.entry);
    });
  }

  return pairs;
}
