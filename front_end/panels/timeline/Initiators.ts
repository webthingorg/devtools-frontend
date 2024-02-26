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
 * entire chain: for each, we see if it had an initiator, and
 * work backwards to draw each one, as well as the events initiated directly by the entry.
 */
export function eventInitiatorPairsToDraw(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    hiddenEvents: TraceEngine.Types.TraceEvents.TraceEventData[],
    modifiedEntries: TraceEngine.Types.TraceEvents.TraceEventData[]
    ): readonly InitiatorPair[] {
  return [
    ...findEventInitiatorPairsPredecessors(traceEngineData, selectedEvent, hiddenEvents, modifiedEntries),
    ...findEventInitiatorPairsDirectSuccessors(traceEngineData, selectedEvent, hiddenEvents, modifiedEntries),
  ];
}

function findEventInitiatorPairsPredecessors(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    hiddenEvents: TraceEngine.Types.TraceEvents.TraceEventData[],
    modifiedEntries: TraceEngine.Types.TraceEvents.TraceEventData[],
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
      
      let currentEventVisible = currentEvent;
      let currentInitiatorVisible = currentInitiator;
      // this saves wrong
      if(hiddenEvents.includes(currentEvent)) {
        currentEventVisible = getLastModifiedParent(traceEngineData, currentEventVisible, modifiedEntries);
      }

      if(hiddenEvents.includes(currentInitiator)) {
        currentInitiatorVisible = getLastModifiedParent(traceEngineData, currentInitiatorVisible, modifiedEntries);
      }

      pairs.push({event: currentEventVisible, initiator: currentInitiatorVisible});

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

function findEventInitiatorPairsDirectSuccessors(
    traceEngineData: TraceEngine.Handlers.Types.TraceParseData,
    selectedEvent: TraceEngine.Types.TraceEvents.TraceEventData,
    hiddenEvents: TraceEngine.Types.TraceEvents.TraceEventData[],
    modifiedEntries: TraceEngine.Types.TraceEvents.TraceEventData[],
    ): readonly InitiatorPair[] {
  const pairs: InitiatorPair[] = [];

  // Add all of the initiated events to the pairs array.
  const eventsInitiatedByCurrent = traceEngineData.Initiators.initiatorToEvents.get(selectedEvent);
  if (eventsInitiatedByCurrent) {
    eventsInitiatedByCurrent.forEach(event => {
      let currentEventVisible = event;
      let currentInitiatorVisible = selectedEvent;

      if(hiddenEvents.includes(currentEventVisible)) {
        currentEventVisible = getLastModifiedParent(traceEngineData, currentEventVisible, modifiedEntries);
      }

      if(hiddenEvents.includes(currentInitiatorVisible)) {
        currentInitiatorVisible = getLastModifiedParent(traceEngineData, currentInitiatorVisible, modifiedEntries);
      }

      pairs.push({event: currentEventVisible, initiator: currentInitiatorVisible});
    });
  }

  return pairs;
}

function getLastModifiedParent(traceEngineData: TraceEngine.Handlers.Types.TraceParseData, entry: TraceEngine.Types.TraceEvents.TraceEventData, modifiedEntries: TraceEngine.Types.TraceEvents.TraceEventData[]): TraceEngine.Types.TraceEvents.TraceEventData {

// Find the closest visible ancestor and replace with it
  let nextParent = traceEngineData.Renderer.entryToNode.get(entry)?.parent;
  while(nextParent?.entry && !modifiedEntries.includes(nextParent?.entry)) {
    nextParent = nextParent.parent ?? undefined;
  }
  return (nextParent?.entry) ? nextParent.entry : entry;

}
