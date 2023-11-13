// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

/**
 * BeginFrame
DroppedFrame (with the same timestamp as BeginFrame)
RequestMainFrame
BeginMainThreadFrame
CompositeLayer (aka “Commit”)
ActivateLayerTree
DrawFrame (aka “SubmitCompositorFrame”)
 */

type FramesHandlerEvent =
    Types.TraceEvents.TraceEventSetLayerTreeId|Types.TraceEvents.TraceEventBeginFrame|
    Types.TraceEvents.TraceEventDroppedFrame|Types.TraceEvents.TraceEventRequestMainThreadFrame|
    Types.TraceEvents.TraceEventBeginMainThreadFrame|Types.TraceEvents.TraceEventCommit|
    Types.TraceEvents.TraceEventCompositeLayers|Types.TraceEvents.TraceEventActivateLayerTree|
    Types.TraceEvents.TraceEventDrawFrameBegin|Types.TraceEvents.TraceEventDrawFrameEnd;

const eventsToProcess: FramesHandlerEvent[] = [];

export function reset(): void {
  eventsToProcess.length = 0;
}

export function handleEvent(event: Types.TraceEvents.TraceEventData): void {
  // Gather all events relating to frames into one array. In the finalize()
  // method we will walk through these and use them to construct frames.
  if (Types.TraceEvents.isTraceEventSetLayerId(event) || Types.TraceEvents.isTraceEventBeginFrame(event) ||
      Types.TraceEvents.isTraceEventDroppedFrame(event) ||
      Types.TraceEvents.isTraceEventRequestMainThreadFrame(event) ||
      Types.TraceEvents.isTraceEventBeginMainThreadFrame(event) ||

      // Note that "Commit" is the replacement for "CompositeLayers" so in a trace
      // we wouldn't expect to see a combination of these. All "new" trace
      // recordings use "Commit", but we can easily support "CompositeLayers" too
      // to not break older traces being imported.
      Types.TraceEvents.isTraceEventCommit(event) || Types.TraceEvents.isTraceEventCompositeLayers(event) ||
      Types.TraceEvents.isTraceEventActivateLayerTree(event) || Types.TraceEvents.isTraceEventDrawFrame(event)

  ) {
    eventsToProcess.push(event);
    return;
  }
}

export function finalize(): void {
  eventsToProcess.sort((a, b) => a.ts - b.ts);
  const parser = new Helpers.FramesParser.FramesParser(eventsToProcess);
  const frames = parser.run();

  let activeLayerId: number = -1;
  let mainFrameRequested: boolean = false;

  const completeFrames: Frame[] = [];
  const beginFramesQueue: Set<Frame> = new Set();
  const beginFramesBySequenceID: Map<number, Frame> = new Map();

  for (const event of eventsToProcess) {
    if (Types.TraceEvents.isTraceEventSetLayerId(event)) {
      activeLayerId = event.args.data.layerTreeId;
    } else if (Types.TraceEvents.isTraceEventBeginFrame(event) && typeof event.args.frameSeqId !== 'undefined') {
      const frame: Frame = {
        isPartial: false,
        seqId: event.args.frameSeqId,
        ts: event.ts,
        status: 'PENDING',
      };
      beginFramesBySequenceID.set(frame.seqId, frame);
    } else if (Types.TraceEvents.isTraceEventDroppedFrame(event) && typeof event.args.frameSeqId !== 'undefined') {
      const frame = beginFramesBySequenceID.get(event.args.frameSeqId);
      if (frame) {
        frame.status = 'DROPPED';
        frame.isPartial = Boolean(event.args.hasPartialUpdate);
      } else {
        // If the BeginFrame event was not found, we fake it and create the
        // frame.
        const frame: Frame = {
          isPartial: Boolean(event.args.hasPartialUpdate),
          seqId: event.args.frameSeqId,
          ts: event.ts,
          status: 'DROPPED',
        };
        beginFramesQueue.add(frame);
        beginFramesBySequenceID.set(frame.seqId, frame);
      }
    } else if (Types.TraceEvents.isTraceEventRequestMainThreadFrame(event)) {
      if (event.args.layerTreeId === activeLayerId) {
        mainFrameRequested = true;
      }
    }
  }
}

// TODO: turn this into a SyntheticFrame event that lives in TraceEvents
export interface Frame {
  // TODO: Newer traces will always give us this, but older traces will not contain
  // this information. Not really sure what we should do with old traces?
  seqId: number;
  ts: Types.Timing.MicroSeconds;
  isPartial: boolean;
  status: 'COMPLETE'|'DROPPED'|'PENDING';
}
export interface FramesData {}

export function data(): FramesData {
  return {};
}
