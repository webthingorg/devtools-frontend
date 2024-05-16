// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';

import {data as metaHandlerData} from './MetaHandler.js';
import {HandlerState} from './types.js';

let handlerState = HandlerState.UNINITIALIZED;

export interface WebSocketTraceDataForFrame {
  frame: string;
  webSocketIdentifier: number;
  events: Types.TraceEvents.WebSocketEvent[];
}
export interface WebSocketTraceDataForWorker {
  workerId: string;
  webSocketIdentifier: number;
  events: Types.TraceEvents.WebSocketEvent[];
}
export type WebSocketTraceData = WebSocketTraceDataForFrame|WebSocketTraceDataForWorker;
export interface WebSocketsData {
  traceData: WebSocketTraceData[];
}

const webSocketData: Map<number, WebSocketTraceData> = new Map();
export function reset(): void {
  handlerState = HandlerState.INITIALIZED;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('WebSockets Handler is not initialized');
  }

  if (Types.TraceEvents.isTraceEventWebSocketCreate(event) || Types.TraceEvents.isTraceEventWebSocketInfo(event) ||
      Types.TraceEvents.isTraceEventWebSocketTransfer(event)) {
    const identifier = event.args.data.identifier;
    if (!webSocketData.has(identifier)) {
      if (event.args.data.frame) {
        webSocketData.set(identifier, {
          frame: event.args.data.frame,
          webSocketIdentifier: identifier,
          events: [],
        });
      } else if (event.args.data.workerId) {
        webSocketData.set(identifier, {
          workerId: event.args.data.workerId,
          webSocketIdentifier: identifier,
          events: [],
        });
      }
    }

    webSocketData.get(identifier)?.events.push(event);
  }
}

function createSyntheticWebSocketEvent(
    startEvent: Types.TraceEvents.WebSocketEvent,
    endEvent: Types.TraceEvents.TraceEventWebSocketDestroy|null): Types.TraceEvents.SyntheticWebSocketEvent {
  let duration = 0;
  const {traceBounds} = metaHandlerData();
  if (Types.TraceEvents.isTraceEventWebSocketCreate(startEvent)) {
    if (endEvent) {  // we have both connection create and destroy events
      duration = endEvent.ts - startEvent.ts;
    } else {  // we only have connection create event
      duration = traceBounds.max - startEvent.ts;
    }
  } else {
    if (endEvent) {  // we only have connection destroy event, the connection create event is missing
      duration = endEvent.ts - traceBounds.min;
    } else {  // we have neither connection create nor destroy events
      duration = traceBounds.max - traceBounds.min;
    }
  }

  const mainEvent = startEvent || endEvent;
  return {
    name: 'SyntheticWebSocketEvent',
    cat: mainEvent.cat,
    ph: mainEvent.ph,
    ts: mainEvent.ts,
    dur: duration as Types.Timing.MicroSeconds,
    pid: mainEvent.pid,
    tid: mainEvent.tid,
    s: mainEvent.s,
    args: {
      data: {
        identifier: mainEvent.args.data.identifier,
      },
    },
  };
}

export async function finalize(): Promise<void> {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('WebSockets handler is not initialized');
  }
  // Creating a synthetic WebSocket event for each WebSocket connection
  webSocketData.forEach(data => {
    let startEvent: Types.TraceEvents.WebSocketEvent|null = null;
    let endEvent: Types.TraceEvents.TraceEventWebSocketDestroy|null = null;
    for (const event of data.events) {
      if (Types.TraceEvents.isTraceEventWebSocketCreate(event)) {
        startEvent = event;
      }
      if (Types.TraceEvents.isTraceEventWebSocketDestroy(event)) {
        endEvent = event;
      }
    }
    if (!startEvent) {
      startEvent = data.events[0];
    }
    const syntheticWebSocketEvent = createSyntheticWebSocketEvent(startEvent, endEvent);
    data.events.unshift(syntheticWebSocketEvent);
  });
  handlerState = HandlerState.FINALIZED;
}

export function data(): WebSocketsData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('WebSockets handler is not finalized');
  }

  return {
    traceData: [...webSocketData.values()],
  };
}
