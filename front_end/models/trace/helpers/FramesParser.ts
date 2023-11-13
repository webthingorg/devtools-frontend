// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Types from '../types/types.js';
type FramesParserEvent = Types.TraceEvents.TraceEventSetLayerTreeId|Types.TraceEvents.TraceEventBeginFrame|
                         Types.TraceEvents.TraceEventDroppedFrame|
                         Types.TraceEvents.TraceEventRequestMainThreadFrame|
                         Types.TraceEvents.TraceEventBeginMainThreadFrame|Types.TraceEvents.TraceEventCommit|
                         Types.TraceEvents.TraceEventCompositeLayers|Types.TraceEvents.TraceEventActivateLayerTree|
                         Types.TraceEvents.TraceEventDrawFrame;

type FrameStatus = {
  type: 'PENDING',
  beginEvent: Types.TraceEvents.TraceEventBeginFrame,
}|{
  type: 'DROPPED',
  droppedEvent: Types.TraceEvents.TraceEventDroppedFrame,
  isPartial: boolean,
}|{
  type: 'COMMITTED',
  commitEvent: Types.TraceEvents.TraceEventCommit,
}|{
  type: 'DRAWN',
  drawEvent: Types.TraceEvents.TraceEventDrawFrame,
};
// TODO: turn this into a SyntheticFrame event that lives in TraceEvents
export interface Frame {
  seqId: number;
  ts: Types.Timing.MicroSeconds;
  dur: Types.Timing.MicroSeconds;
  isPartial: boolean;
  status: FrameStatus;
  pid: Types.TraceEvents.ProcessID;
  tid: Types.TraceEvents.ThreadID;
}

export interface FramesInThread {
  beginFramesBySequenceId: Map<number, Frame>;
  completeFrames: Frame[];
  activeLayerId: number;
}

export type FrameParserState = Record<Types.TraceEvents.ProcessID, Record<Types.TraceEvents.ThreadID, FramesInThread>>;
export class FramesParser {
  #events: FramesParserEvent[];

  #state: FrameParserState = {};

  constructor(events: FramesParserEvent[]) {
    this.#events = events;
  }

  #emptyStateForThread(): FramesInThread {
    return {
      beginFramesBySequenceId: new Map(),
      completeFrames: [],
      activeLayerId: -1,
    };
  }

  // Only for use in testing and debugging.
  inspectState(): Readonly<FrameParserState> {
    return this.#state;
  }

  run(): Readonly<FrameParserState> {
    /**
     * There are three frame lifecycles that we care about:
     * 1. Has BeginFrame and Dropped frame: frame was dropped. Frame starts at begin.ts and ends...???
     * 2. Has BeginFrame but no DropFrame or DrawFrame event. In this case...???
     * 3. Has BeginFrame and DrawFrame. These are frames that were properly drawn. Frame starts at beginEvent.ts and ends at drawFrameEvent.ts.
     */
    for (const event of this.#events) {
      if (!this.#state[event.pid]) {
        this.#state[event.pid] = {};
      }
      if (!this.#state[event.pid][event.tid]) {
        this.#state[event.pid][event.tid] = this.#emptyStateForThread();
      }

      const stateForThread = this.#state[event.pid][event.tid];

      if (Types.TraceEvents.isTraceEventSetLayerId(event)) {
        stateForThread.activeLayerId = event.args.data.layerTreeId;
        continue;
      }

      if (event.args.layerTreeId !== stateForThread.activeLayerId) {
        // Only parse frames that are on the active layer.
        continue;
      }

      if (Types.TraceEvents.isTraceEventBeginFrame(event)) {
        const frame: Frame = {
          isPartial: false,
          seqId: event.args.frameSeqId,
          pid: event.pid,
          tid: event.tid,
          ts: event.ts,
          dur: Types.Timing.MicroSeconds(0),
          status: {
            type: 'PENDING',
            beginEvent: event,
          },
        };
        stateForThread.beginFramesBySequenceId.set(frame.seqId, frame);
        continue;
      }

      if (Types.TraceEvents.isTraceEventDroppedFrame(event)) {
        const frame = stateForThread.beginFramesBySequenceId.get(event.args.frameSeqId);
        if (!frame) {
          // There used to be a bug in Chromium where DroppedFrames might not
          // have a BeginFrame event; this was fixed in crbug.com/1259990 in
          // Oct 2021 and therefore we now assume that there is a BeginFrame
          // and silently drop it otherwise.
          continue;
        }

        frame.status = {
          type: 'DROPPED',
          isPartial: Boolean(event.args.hasPartialUpdate),
          droppedEvent: event,
        };
        stateForThread.beginFramesBySequenceId.set(frame.seqId, frame);
        continue;
      }

      if (Types.TraceEvents.isTraceEventCommit(event)) {
        const frame = stateForThread.beginFramesBySequenceId.get(event.args.frameSeqId);
        if (!frame) {
          continue;
        }

        frame.status = {
          type: 'COMMITTED',
          commitEvent: event,
        };
        continue;
      }

      if (Types.TraceEvents.isTraceEventDrawFrame(event)) {
        const frame = stateForThread.beginFramesBySequenceId.get(event.args.frameSeqId);
        if (!frame) {
          continue;
        }
        frame.dur = Types.Timing.MicroSeconds(event.ts - frame.ts);
        frame.status = {
          type: 'DRAWN',
          drawEvent: event,
        };
      }
    }

    return this.#state;
  }
}
