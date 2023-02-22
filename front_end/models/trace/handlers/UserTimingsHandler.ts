// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as Types from '../types/types.js';

import {HandlerState} from './types.js';

/**
 * IMPORTANT!
 * See UserTimings.md in this directory for some handy documentation on
 * UserTimings and the trace events we parse currently.
 **/
const syntheticEvents: Types.TraceEvents.TraceEventSyntheticUserTiming[] = [];
type TraceEventUserTiming = Types.TraceEvents.TraceEventUserTimingBegin|Types.TraceEvents.TraceEventUserTimingEnd|
                            Types.TraceEvents.TraceEventUserTimingMark;
const timingEvents: TraceEventUserTiming[] = [];

interface UserTimingsData {
  timings: readonly Types.TraceEvents.TraceEventSyntheticUserTiming[];
}
let handlerState = HandlerState.UNINITIALIZED;

export function reset(): void {
  syntheticEvents.length = 0;
  timingEvents.length = 0;
  handlerState = HandlerState.INITIALIZED;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('UserTimings handler is not initialized');
  }
  const resourceTimingNames = [
    'workerStart',
    'redirectStart',
    'redirectEnd',
    'fetchStart',
    'domainLookupStart',
    'domainLookupEnd',
    'connectStart',
    'connectEnd',
    'secureConnectionStart',
    'requestStart',
    'responseStart',
    'responseEnd',
  ];
  const navTimingNames = [
    'navigationStart',
    'unloadEventStart',
    'unloadEventEnd',
    'redirectStart',
    'redirectEnd',
    'fetchStart',
    'commitNavigationEnd',
    'domainLookupStart',
    'domainLookupEnd',
    'connectStart',
    'connectEnd',
    'secureConnectionStart',
    'requestStart',
    'responseStart',
    'responseEnd',
    'domLoading',
    'domInteractive',
    'domContentLoadedEventStart',
    'domContentLoadedEventEnd',
    'domComplete',
    'loadEventStart',
    'loadEventEnd',
  ];
  // These are events dispatched under the blink.user_timing category
  // but that the user didn't add. Filter them out so that they do not
  // Appear in the timings track (they still appear in the main thread
  // flame chart).
  const ignoredNames = [...resourceTimingNames, ...navTimingNames];
  if (ignoredNames.includes(event.name)) {
    return;
  }

  if (Types.TraceEvents.isTraceEventUserTiming(event)) {
    timingEvents.push(event);
  }
}

export async function finalize(): Promise<void> {
  if (handlerState !== HandlerState.INITIALIZED) {
    throw new Error('UserTimings handler is not initialized');
  }
  type UserTiming = {
    mark?: Types.TraceEvents.TraceEventUserTimingMark,
    begin?: Types.TraceEvents.TraceEventUserTimingBegin,
    end?: Types.TraceEvents.TraceEventUserTimingEnd,
  };

  const matchedEvents: Map<string, UserTiming> = new Map();
  for (const event of timingEvents) {
    const eventId = event.id || event.name;
    const otherEventsWithID =
        Platform.MapUtilities.getWithDefault<string, UserTiming>(matchedEvents, eventId, () => ({}));
    const isStartEvent = event.ph === Types.TraceEvents.TraceEventPhase.ASYNC_NESTABLE_START;
    const isEndEvent = event.ph === Types.TraceEvents.TraceEventPhase.ASYNC_NESTABLE_END;

    if (isStartEvent) {
      otherEventsWithID.begin = event;
    } else if (isEndEvent) {
      otherEventsWithID.end = event;
    } else {
      otherEventsWithID.mark = event;
    }
  }

  for (const [id, userTimingEvent] of matchedEvents.entries()) {
    if (!userTimingEvent.begin && !userTimingEvent.mark) {
      // Shouldn't happen due to how matchedEvents is built
      continue;
    }
    if (userTimingEvent.begin && userTimingEvent.mark) {
      // Shouldn't happen due to how matchedEvents is built
      continue;
    }

    const dur = (userTimingEvent.begin && userTimingEvent.end) ?
        Types.Timing.MicroSeconds(userTimingEvent.end.ts - userTimingEvent.begin.ts) :
        Types.Timing.MicroSeconds(0);
    const defaultEvent = (userTimingEvent.begin || userTimingEvent.mark) as TraceEventUserTiming;

    const event: Types.TraceEvents.TraceEventSyntheticUserTiming = {
      cat: defaultEvent.cat,
      ph: defaultEvent.ph,
      pid: defaultEvent.pid,
      tid: defaultEvent.tid,
      id,
      // Both events have the same name, so it doesn't matter which we pick to
      // use as the description
      name: defaultEvent.name,
      dur,
      ts: defaultEvent.ts,
      args: {
        data: {
          beginEvent: userTimingEvent.begin,
          mark: userTimingEvent.mark,
          endEvent: userTimingEvent.end,
        },
      },
    };
    syntheticEvents.push(event);
  }
  syntheticEvents.sort((event1, event2) => {
    if (event1.ts > event2.ts) {
      return 1;
    }
    if (event2.ts > event1.ts) {
      return -1;
    }
    return 0;
  });
  handlerState = HandlerState.FINALIZED;
}

export function data(): UserTimingsData {
  if (handlerState !== HandlerState.FINALIZED) {
    throw new Error('UserTimings handler is not finalized');
  }

  return {
    timings: [...syntheticEvents],
  };
}
