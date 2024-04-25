// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as Types from '../types/types.js';

const DevToolsTimelineEventCategory = 'disabled-by-default-devtools.timeline';
function isTopLevelEvent(event: Types.TraceEvents.TraceEventData): boolean {
  return event.cat.includes(DevToolsTimelineEventCategory) && event.name === Types.TraceEvents.KnownEventName.RunTask;
}

function topLevelEventIndexEndingAfter(
    events: Types.TraceEvents.TraceEventData[], time: Types.Timing.MicroSeconds): number {
  let index = Platform.ArrayUtilities.upperBound(events, time, (time, event) => time - event.ts) - 1;
  while (index > 0 && !isTopLevelEvent(events[index])) {
    index--;
  }
  return Math.max(index, 0);
}
export function findUpdateLayoutTreeEvents(
    events: Types.TraceEvents.TraceEventData[], startTime: Types.Timing.MicroSeconds,
    endTime?: Types.Timing.MicroSeconds): Types.TraceEvents.TraceEventUpdateLayoutTree[] {
  const foundEvents: Types.TraceEvents.TraceEventUpdateLayoutTree[] = [];
  const startEventIndex = topLevelEventIndexEndingAfter(events, startTime);
  for (let i = startEventIndex; i < events.length; i++) {
    const event = events[i];
    if (!Types.TraceEvents.isTraceEventUpdateLayoutTree(event)) {
      // TODO: figure out what to do about RecalcStyles + the fact that MS
      // mutate the event.
      continue;
    }
    if (event.ts >= (endTime || Infinity)) {
      continue;
    }
    foundEvents.push(event);
  }
  return foundEvents;
}
