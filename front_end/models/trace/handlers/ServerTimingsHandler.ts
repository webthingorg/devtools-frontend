// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {data as networkData} from './NetworkRequestsHandler.js';
import {HandlerState, type TraceEventHandlerName} from './types.js';

const serverTimings: Types.TraceEvents.SyntheticServerTiming[] = [];

let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  serverTimings.length = 0;
  handlerState = HandlerState.UNINITIALIZED;
}

export function initialize(): void {
  handlerState = HandlerState.INITIALIZED;
}

export function handleEvent(_event: Types.TraceEvents.TraceEventData): void {
  // Implementation not needed because data is sourced from NetworkRequestsHandler
}

export async function finalize(): Promise<void> {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('Server Timings handler is not initialized');
  }
  extractServerTimings();
  Helpers.Trace.sortTraceEventsInPlace(serverTimings);
  handlerState = HandlerState.FINALIZED;
}

/**
 * Creates synthetic trace events based on server timings in the
 * `Server-Timing` response header. A non-standard `start` param is
 * expected on each metric that contains the start time of the timing
 * based on the server clock.
 *
 * In order to estimate the offset between the server and client clocks,
 * we look for the non-standard `response-start` and `response-end`
 * metrics in the response header, which contain the start and end
 * timestamps of the network request processing in the server. We
 * compare these with the times the request was sent and received in the
 * client to estimate the offset between the client and the server
 * clocks.
 *
 * With this offset estimation at hand, we can map timestamps from the
 * server clock to the tracing clock and locate the timings in the
 * performance timeline.
 */
function extractServerTimings(): void {
  for (const networkEvent of networkData().byTime) {
    let timingsInRequest: Platform.ServerTimings.ServerTiming[]|null = null;
    for (const header of networkEvent.args.data.responseHeaders) {
      const headerName = header.name.toLocaleLowerCase();
      if (headerName === 'server-timing-hehe' || headerName === 'server-timing') {
        header.name = 'server-timing';
        timingsInRequest = Platform.ServerTimings.ServerTiming.parseHeaders([header]);
        continue;
      }
    }
    const serverStart = timingsInRequest?.find(timing => timing.metric === 'response-start')?.start;
    const serverEnd = timingsInRequest?.find(timing => timing.metric === 'response-end')?.start;
    if (serverStart && serverEnd && timingsInRequest) {
      const tracingoffset = 0;
      const serverStartInMicro = serverStart * 1_000 + tracingoffset;
      const serverEndInMicro = serverEnd * 1_000 + tracingoffset;
      serverTimings.push(...convertServerTimings(networkEvent, serverStartInMicro, serverEndInMicro, timingsInRequest));
    }
  }
}
function convertServerTimings(
    request: Types.TraceEvents.SyntheticNetworkRequest, serverStart: number, serverEnd: number,
    timingsInRequest: Platform.ServerTimings.ServerTiming[]): Types.TraceEvents.SyntheticServerTiming[] {
  const clientStart = request.args.data.syntheticData.sendStartTime;
  const clientEndTime = request.args.data.syntheticData.sendStartTime + request.args.data.syntheticData.waiting;
  const offset = Types.Timing.MicroSeconds((serverStart - clientStart + serverEnd - clientEndTime) / 2);
  const convertedServerTimings: Types.TraceEvents.SyntheticServerTiming[] = [];
  for (const timing of timingsInRequest) {
    if (timing.start === null) {
      continue;
    }
    const convertedTimestamp =
        Helpers.Timing.millisecondsToMicroseconds(Types.Timing.MilliSeconds(timing.start)) - offset;
    const serverTiming = Helpers.SyntheticEvents.SyntheticEventsManager.registerServerTiming({
      rawSourceEvent: request.rawSourceEvent,
      name: timing.metric,
      ph: Types.TraceEvents.Phase.COMPLETE,
      pid: Types.TraceEvents.ProcessID(0),
      tid: Types.TraceEvents.ThreadID(0),
      ts: Types.Timing.MicroSeconds(convertedTimestamp),
      dur: Helpers.Timing.millisecondsToMicroseconds(Types.Timing.MilliSeconds(timing.value)),
      cat: 'devtools.server-timing',
      args: {data: {desc: timing.description || undefined}},
    });

    if (!request.args.data.syntheticServerTimings) {
      request.args.data.syntheticServerTimings = [];
    }
    request.args.data.syntheticServerTimings.push(serverTiming);
    convertedServerTimings.push(serverTiming);
  }
  return convertedServerTimings;
}

export function data(): {serverTimings: Types.TraceEvents.SyntheticServerTiming[]} {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('Server Timing handler is not finalized');
  }

  return {
    serverTimings: serverTimings,
  };
}

export function deps(): TraceEventHandlerName[] {
  return ['NetworkRequests'];
}
