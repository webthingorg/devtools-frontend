// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';

import {HandlerState} from './types.js';

let handlerState = HandlerState.UNINITIALIZED;

export type WebSocketTraceEvent = Types.TraceEvents.TraceEventWebSocketCreate|
                                  Types.TraceEvents.TraceEventWebSocketInfo|
                                  Types.TraceEvents.TraceEventWebSocketTransfer;

export interface WebSocketTraceDataForFrame {
  frame: string;
  webSocketIdentifier: number;
  events: WebSocketTraceEvent[];
}
export interface WebSocketTraceDataForWorker {
  workerId: string;
  webSocketIdentifier: number;
  events: WebSocketTraceEvent[];
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

export async function finalize(): Promise<void> {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('UserTimings handler is not initialized');
  }
  handlerState = HandlerState.FINALIZED;
}

export function data(): WebSocketsData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('UserTimings handler is not finalized');
  }

  return {
    traceData: [...webSocketData.values()],
  };
}
