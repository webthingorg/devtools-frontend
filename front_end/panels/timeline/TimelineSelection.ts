// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../models/trace/trace.js';

import {eventIsFromNewEngine, timesForEventInMilliseconds} from './EventTypeHelpers.js';

type PermittedObjectTypes = TimelineModel.TimelineFrameModel.TimelineFrame|
                            TimelineModel.TimelineModel.NetworkRequest|SDK.TracingModel.Event|
                            TraceEngine.Types.TraceEvents.TraceEventData|SelectionRange;

const SelectionRangeSymbol = Symbol('SelectionRange');
export type SelectionRange = typeof SelectionRangeSymbol;

export type TimelineSelectionType = TimelineSelection<TimelineModel.TimelineFrameModel.TimelineFrame>|
    TimelineSelection<TimelineModel.TimelineModel.NetworkRequest>|TimelineSelection<SDK.TracingModel.Event>|
    TimelineSelection<TraceEngine.Types.TraceEvents.TraceEventData>|TimelineSelection<SelectionRange>;

export class TimelineSelection<T extends PermittedObjectTypes> {
  readonly startTime: TraceEngine.Types.Timing.MilliSeconds;
  readonly endTime: TraceEngine.Types.Timing.MilliSeconds;
  readonly object: T;

  constructor(
      startTime: TraceEngine.Types.Timing.MilliSeconds, endTime: TraceEngine.Types.Timing.MilliSeconds, object: T) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.object = object;
  }

  static isFrameSelection(instance: TimelineSelectionType):
      instance is TimelineSelection<TimelineModel.TimelineFrameModel.TimelineFrame> {
    return instance.object instanceof TimelineModel.TimelineFrameModel.TimelineFrame;
  }

  static fromFrame(frame: TimelineModel.TimelineFrameModel.TimelineFrame):
      TimelineSelection<TimelineModel.TimelineFrameModel.TimelineFrame> {
    return new TimelineSelection(
        TraceEngine.Types.Timing.MilliSeconds(frame.startTime), TraceEngine.Types.Timing.MilliSeconds(frame.endTime),
        frame);
  }

  static isNetworkRequestSelection(instance: TimelineSelectionType):
      instance is TimelineSelection<TimelineModel.TimelineModel.NetworkRequest> {
    return instance.object instanceof TimelineModel.TimelineModel.NetworkRequest;
  }

  static fromNetworkRequest(request: TimelineModel.TimelineModel.NetworkRequest):
      TimelineSelection<TimelineModel.TimelineModel.NetworkRequest> {
    return new TimelineSelection(
        TraceEngine.Types.Timing.MilliSeconds(request.startTime),
        TraceEngine.Types.Timing.MilliSeconds(request.endTime || request.startTime), request);
  }

  static isTraceEventSelection(instance: TimelineSelectionType):
      instance is TimelineSelection<SDK.TracingModel.Event|TraceEngine.Types.TraceEvents.TraceEventData> {
    if (instance.object instanceof SDK.TracingModel.Event) {
      return true;
    }
    // Sadly new trace events are just raw objects, so now we have to confirm it is a trace event by ruling everything else out.
    if (TimelineSelection.isFrameSelection(instance) || TimelineSelection.isRangeSelection(instance) ||
        TimelineSelection.isNetworkRequestSelection(instance)) {
      return false;
    }
    return eventIsFromNewEngine(instance.object);
  }

  static fromTraceEvent(event: SDK.TracingModel.Event|TraceEngine.Types.TraceEvents.TraceEventData):
      TimelineSelection<SDK.TracingModel.Event|TraceEngine.Types.TraceEvents.TraceEventData> {
    const {startTime, endTime} = timesForEventInMilliseconds(event);
    return new TimelineSelection(startTime, TraceEngine.Types.Timing.MilliSeconds(endTime || (startTime + 1)), event);
  }

  static isRangeSelection(instance: TimelineSelectionType): instance is TimelineSelection<SelectionRange> {
    return instance.object === SelectionRangeSymbol;
  }

  static fromRange(startTime: number, endTime: number): TimelineSelection<SelectionRange> {
    return new TimelineSelection(
        TraceEngine.Types.Timing.MilliSeconds(startTime), TraceEngine.Types.Timing.MilliSeconds(endTime),
        SelectionRangeSymbol);
  }
}
