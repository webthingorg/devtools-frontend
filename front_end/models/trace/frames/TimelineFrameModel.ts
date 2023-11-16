/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable @typescript-eslint/naming-convention */

import * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';

import {TracingLayerTree} from './TracingLayerTree.js';

type FrameEvent = Types.TraceEvents.TraceEventBeginFrame|Types.TraceEvents.TraceEventDroppedFrame|
                  Types.TraceEvents.TraceEventRequestMainThreadFrame|
                  Types.TraceEvents.TraceEventBeginMainThreadFrame|Types.TraceEvents.TraceEventCommit|
                  Types.TraceEvents.TraceEventCompositeLayers|Types.TraceEvents.TraceEventActivateLayerTree|
                  Types.TraceEvents.TraceEventNeedsBeginFrameChanged|Types.TraceEvents.TraceEventDrawFrame;

function isFrameEvent(event: Types.TraceEvents.TraceEventData): event is FrameEvent {
  return (
      Types.TraceEvents.isTraceEventSetLayerId(event) || Types.TraceEvents.isTraceEventBeginFrame(event) ||
      Types.TraceEvents.isTraceEventDroppedFrame(event) ||
      Types.TraceEvents.isTraceEventRequestMainThreadFrame(event) ||
      Types.TraceEvents.isTraceEventBeginMainThreadFrame(event) ||
      Types.TraceEvents.isTraceEventNeedsBeginFrameChanged(event) ||
      // Note that "Commit" is the replacement for "CompositeLayers" so in a trace
      // we wouldn't expect to see a combination of these. All "new" trace
      // recordings use "Commit", but we can easily support "CompositeLayers" too
      // to not break older traces being imported.
      Types.TraceEvents.isTraceEventCommit(event) || Types.TraceEvents.isTraceEventCompositeLayers(event) ||
      Types.TraceEvents.isTraceEventActivateLayerTree(event) || Types.TraceEvents.isTraceEventDrawFrame(event));
}

function idForEntry(entry: Types.TraceEvents.TraceEventData): string|undefined {
  const scope = Types.TraceEvents.isTraceEventInstant(entry) && entry.s || undefined;

  if (Types.TraceEvents.isNestableAsyncPhase(entry.ph)) {
    const id = Helpers.Trace.extractId(entry as Types.TraceEvents.TraceEventNestableAsync);
    return scope ? `${scope}@${id}` : id;
  }

  return undefined;
}

function entryIsTopLevel(entry: Types.TraceEvents.TraceEventData): boolean {
  const devtoolsTimelineCategory = 'disabled-by-default-devtools.timeline';
  return entry.name === Types.TraceEvents.KnownEventName.RunTask && entry.cat.includes(devtoolsTimelineCategory);
}

export class TimelineFrameModel {
  private frames!: TimelineFrame[];
  private frameById!: {
    [x: number]: TimelineFrame,
  };
  private beginFrameQueue!: TimelineFrameBeginFrameQueue;
  private minimumRecordTime!: Types.Timing.MicroSeconds;
  private lastFrame!: TimelineFrame|null;
  private mainFrameCommitted!: boolean;
  private mainFrameRequested!: boolean;
  private lastLayerTree!: TracingFrameLayerTree|null;
  private framePendingActivation!: PendingFrame|null;
  private target!: SDK.Target.Target|null;
  private framePendingCommit?: PendingFrame|null;
  private lastBeginFrame?: number|null;
  private lastNeedsBeginFrame?: number|null;
  private lastTaskBeginTime: Types.Timing.MicroSeconds|null = null;
  private layerTreeId?: number|null;
  #activeProcessId: Types.TraceEvents.ProcessID|null = null;
  #activeThreadId: Types.TraceEvents.ThreadID|null = null;

  #traceParseData: Handlers.Types.TraceParseData;

  constructor(
      target: SDK.Target.Target|null, allEvents: readonly Types.TraceEvents.TraceEventData[],
      traceParseData: Handlers.Types.TraceParseData) {
    this.reset();
    this.#traceParseData = traceParseData;
    const mainThreads = Handlers.Threads.threadsInTrace(traceParseData).filter(thread => {
      return thread.type === Handlers.Threads.ThreadType.MAIN_THREAD && thread.processIsOnMainFrame;
    });
    const threadData = mainThreads.map(thread => {
      return {
        tid: thread.tid,
        pid: thread.pid,
        startTime: thread.entries[0].ts,
      };
    });

    this.addTraceEvents(target, allEvents, threadData);
  }

  getFrames(): TimelineFrame[] {
    return this.frames;
  }

  getFramesWithinWindow(startTime: number, endTime: number): TimelineFrame[] {
    const firstFrame =
        Platform.ArrayUtilities.lowerBound(this.frames, startTime || 0, (time, frame) => time - frame.endTime);
    const lastFrame =
        Platform.ArrayUtilities.lowerBound(this.frames, endTime || Infinity, (time, frame) => time - frame.startTime);
    return this.frames.slice(firstFrame, lastFrame);
  }

  hasRasterTile(rasterTask: Types.TraceEvents.TraceEventRasterTask): boolean {
    const data = rasterTask.args['tileData'];
    if (!data) {
      return false;
    }
    const frameId = data['sourceFrameNumber'];
    const frame = frameId && this.frameById[frameId];
    if (!frame || !frame.layerTree) {
      return false;
    }
    return true;
  }

  async rasterTilePromise(rasterTask: Types.TraceEvents.TraceEventRasterTask): Promise<{
    rect: Protocol.DOM.Rect,
    snapshot: SDK.PaintProfiler.PaintProfilerSnapshot,
  }|null> {
    if (!this.target) {
      return Promise.resolve(null);
    }
    const data = rasterTask.args['tileData'];
    const frameId = (data['sourceFrameNumber'] as number);
    const tileId = data['tileId'] && data['tileId']['id_ref'];
    const frame = frameId && this.frameById[frameId];
    if (!frame || !frame.layerTree || !tileId) {
      return Promise.resolve(null);
    }

    return frame.layerTree.layerTreePromise().then(layerTree => layerTree && layerTree.pictureForRasterTile(tileId));
  }

  reset(): void {
    this.minimumRecordTime = Types.Timing.MicroSeconds(Infinity);
    this.frames = [];
    this.frameById = {};
    this.beginFrameQueue = new TimelineFrameBeginFrameQueue();
    this.lastFrame = null;
    this.lastLayerTree = null;
    this.mainFrameCommitted = false;
    this.mainFrameRequested = false;
    this.framePendingCommit = null;
    this.lastBeginFrame = null;
    this.lastNeedsBeginFrame = null;
    this.framePendingActivation = null;
    this.lastTaskBeginTime = null;
    this.target = null;
    this.layerTreeId = null;
  }

  handleBeginFrame(startTime: Types.Timing.MicroSeconds, seqId: number): void {
    if (!this.lastFrame) {
      this.startFrame(startTime, seqId);
    }
    this.lastBeginFrame = startTime;

    this.beginFrameQueue.addFrameIfNotExists(seqId, startTime, false, false);
  }

  handleDroppedFrame(startTime: Types.Timing.MicroSeconds, seqId: number, isPartial: boolean): void {
    if (!this.lastFrame) {
      this.startFrame(startTime, seqId);
    }

    // This line handles the case where no BeginFrame event is issued for
    // the dropped frame. In this situation, add a BeginFrame to the queue
    // as if it actually occurred.
    this.beginFrameQueue.addFrameIfNotExists(seqId, startTime, true, isPartial);
    this.beginFrameQueue.setDropped(seqId, true);
    this.beginFrameQueue.setPartial(seqId, isPartial);
  }

  handleDrawFrame(startTime: Types.Timing.MicroSeconds, seqId: number): void {
    if (!this.lastFrame) {
      this.startFrame(startTime, seqId);
      return;
    }

    // - if it wasn't drawn, it didn't happen!
    // - only show frames that either did not wait for the main thread frame or had one committed.
    if (this.mainFrameCommitted || !this.mainFrameRequested) {
      if (this.lastNeedsBeginFrame) {
        const idleTimeEnd = this.framePendingActivation ? this.framePendingActivation.triggerTime :
                                                          (this.lastBeginFrame || this.lastNeedsBeginFrame);
        if (idleTimeEnd > this.lastFrame.startTime) {
          this.lastFrame.idle = true;
          this.lastBeginFrame = null;
        }
        this.lastNeedsBeginFrame = null;
      }

      const framesToVisualize = this.beginFrameQueue.processPendingBeginFramesOnDrawFrame(seqId);

      // Visualize the current frame and all pending frames before it.
      for (const frame of framesToVisualize) {
        const isLastFrameIdle = this.lastFrame.idle;

        // If |frame| is the first frame after an idle period, the CPU time
        // will be logged ("committed") under |frame| if applicable.
        this.startFrame(frame.startTime, seqId);
        if (isLastFrameIdle && this.framePendingActivation) {
          this.commitPendingFrame();
        }
        if (frame.isDropped) {
          this.lastFrame.dropped = true;
        }
        if (frame.isPartial) {
          this.lastFrame.isPartial = true;
        }
      }
    }
    this.mainFrameCommitted = false;
  }

  handleActivateLayerTree(): void {
    if (!this.lastFrame) {
      return;
    }
    if (this.framePendingActivation && !this.lastNeedsBeginFrame) {
      this.commitPendingFrame();
    }
  }

  handleRequestMainThreadFrame(): void {
    if (!this.lastFrame) {
      return;
    }
    this.mainFrameRequested = true;
  }

  handleCommit(): void {
    if (!this.framePendingCommit) {
      return;
    }
    this.framePendingActivation = this.framePendingCommit;
    this.framePendingCommit = null;
    this.mainFrameRequested = false;
    this.mainFrameCommitted = true;
  }

  handleLayerTreeSnapshot(layerTree: TracingFrameLayerTree): void {
    this.lastLayerTree = layerTree;
  }

  handleNeedFrameChanged(startTime: Types.Timing.MicroSeconds, needsBeginFrame: boolean): void {
    if (needsBeginFrame) {
      this.lastNeedsBeginFrame = startTime;
    }
  }

  private startFrame(startTime: Types.Timing.MicroSeconds, seqId: number): void {
    if (this.lastFrame) {
      this.flushFrame(this.lastFrame, startTime);
    }
    this.lastFrame = new TimelineFrame(seqId, startTime, Types.Timing.MicroSeconds(startTime - this.minimumRecordTime));
  }

  private flushFrame(frame: TimelineFrame, endTime: Types.Timing.MicroSeconds): void {
    frame.setLayerTree(this.lastLayerTree);
    frame.setEndTime(endTime);
    if (this.lastLayerTree) {
      this.lastLayerTree.setPaints(frame.paints);
    }
    const lastFrame = this.frames[this.frames.length - 1];
    if (this.frames.length && lastFrame && (frame.startTime !== lastFrame.endTime || frame.startTime > frame.endTime)) {
      console.assert(
          false, `Inconsistent frame time for frame ${this.frames.length} (${frame.startTime} - ${frame.endTime})`);
    }
    this.frames.push(frame);
    if (typeof frame.mainFrameId === 'number') {
      this.frameById[frame.mainFrameId] = frame;
    }
  }

  private commitPendingFrame(): void {
    if (!this.framePendingActivation || !this.lastFrame) {
      return;
    }

    this.lastFrame.paints = this.framePendingActivation.paints;
    this.lastFrame.mainFrameId = this.framePendingActivation.mainFrameId;
    this.framePendingActivation = null;
  }

  addTraceEvents(target: SDK.Target.Target|null, events: readonly Types.TraceEvents.TraceEventData[], threadData: {
    pid: Types.TraceEvents.ProcessID,
    tid: Types.TraceEvents.ThreadID,
    startTime: Types.Timing.MicroSeconds,
  }[]): void {
    this.target = target;
    let j = 0;
    this.#activeThreadId = threadData.length && threadData[0].tid || null;
    this.#activeProcessId = threadData.length && threadData[0].pid || null;
    for (let i = 0; i < events.length; ++i) {
      while (j + 1 < threadData.length && threadData[j + 1].startTime <= events[i].ts) {
        this.#activeThreadId = threadData[++j].tid;
        this.#activeProcessId = threadData[j].pid;
      }
      this.addTraceEvent(events[i], this.#traceParseData.Meta.mainFrameId);
    }
    this.#activeThreadId = null;
    this.#activeProcessId = null;
  }

  private addTraceEvent(event: Types.TraceEvents.TraceEventData, mainFrameId: string): void {
    if (event.ts && event.ts < this.minimumRecordTime) {
      this.minimumRecordTime = event.ts;
    }

    const entryId = idForEntry(event);

    if (Types.TraceEvents.isTraceEventSetLayerId(event) && event.args.data.frame === mainFrameId) {
      this.layerTreeId = event.args.data.layerTreeId;
    } else if (
        entryId && Types.TraceEvents.isTraceEventLayerTreeHostImplSnapshot(event) &&
        Number(entryId) === this.layerTreeId && this.target) {
      this.handleLayerTreeSnapshot(new TracingFrameLayerTree(this.target, event));
    } else {
      if (isFrameEvent(event)) {
        this.processCompositorEvents(event);
      }
      // Make sure we only use events from the main thread: we check the PID as
      // well in case two processes have a thread with the same TID.
      if (event.tid === this.#activeThreadId && event.pid === this.#activeProcessId) {
        this.addMainThreadTraceEvent(event);
      }
    }
  }

  private processCompositorEvents(entry: FrameEvent): void {
    if (entry.args['layerTreeId'] !== this.layerTreeId) {
      return;
    }
    if (Types.TraceEvents.isTraceEventBeginFrame(entry)) {
      this.handleBeginFrame(entry.ts, entry.args['frameSeqId']);
    } else if (Types.TraceEvents.isTraceEventDrawFrame(entry)) {
      this.handleDrawFrame(entry.ts, entry.args['frameSeqId']);
    } else if (Types.TraceEvents.isTraceEventActivateLayerTree(entry)) {
      this.handleActivateLayerTree();
    } else if (Types.TraceEvents.isTraceEventRequestMainThreadFrame(entry)) {
      this.handleRequestMainThreadFrame();
    } else if (Types.TraceEvents.isTraceEventNeedsBeginFrameChanged(entry)) {
      // needsBeginFrame property will either be 0 or 1, which represents
      // true/false in this case, hence the Boolean() wrapper.
      this.handleNeedFrameChanged(entry.ts, entry.args['data'] && Boolean(entry.args['data']['needsBeginFrame']));
    } else if (Types.TraceEvents.isTraceEventDroppedFrame(entry)) {
      this.handleDroppedFrame(entry.ts, entry.args['frameSeqId'], Boolean(entry.args['hasPartialUpdate']));
    }
  }

  private addMainThreadTraceEvent(entry: Types.TraceEvents.TraceEventData): void {
    if (entryIsTopLevel(entry)) {
      this.lastTaskBeginTime = entry.ts;
    }
    if (!this.framePendingCommit &&
        TimelineFrameModel.mainFrameMarkers.indexOf(entry.name as Types.TraceEvents.KnownEventName) >= 0) {
      this.framePendingCommit = new PendingFrame(this.lastTaskBeginTime || entry.ts);
    }
    if (!this.framePendingCommit) {
      return;
    }

    if (Types.TraceEvents.isTraceEventBeginMainThreadFrame(entry) && entry.args.data.frameId) {
      this.framePendingCommit.mainFrameId = entry.args.data.frameId;
    }
    if (Types.TraceEvents.isTraceEventPaint(entry)) {
      const snapshot = this.#traceParseData.LayerTreeHandler.paintsToSnapshots.get(entry);
      if (snapshot) {
        this.framePendingCommit.paints.push(new LayerPaintEvent(entry, snapshot, this.target));
      }
    }
    // Commit will be replacing CompositeLayers but CompositeLayers is kept
    // around for backwards compatibility.
    if ((Types.TraceEvents.isTraceEventCompositeLayers(entry) || Types.TraceEvents.isTraceEventCommit(entry)) &&
        entry.args['layerTreeId'] === this.layerTreeId) {
      this.handleCommit();
    }
  }

  private static readonly mainFrameMarkers: Types.TraceEvents.KnownEventName[] = [
    Types.TraceEvents.KnownEventName.ScheduleStyleRecalculation,
    Types.TraceEvents.KnownEventName.InvalidateLayout,
    Types.TraceEvents.KnownEventName.BeginMainThreadFrame,
    Types.TraceEvents.KnownEventName.ScrollLayer,
  ];
}

export class TracingFrameLayerTree {
  private readonly target: SDK.Target.Target;
  private readonly snapshot: Types.TraceEvents.TraceEventLayerTreeHostImplSnapshot;
  private paintsInternal!: LayerPaintEvent[]|undefined;

  constructor(target: SDK.Target.Target, snapshot: Types.TraceEvents.TraceEventLayerTreeHostImplSnapshot) {
    this.target = target;
    this.snapshot = snapshot;
  }

  async layerTreePromise(): Promise<TracingLayerTree|null> {
    // TODO: find an example event that has all this data. Do we need advanced isntrumentation turned on perhaps?
    const result = this.snapshot.args;
    const viewport = result['device_viewport_size'];
    const tiles = result['active_tiles'];
    const rootLayer = result['active_tree']['root_layer'];
    const layers = result['active_tree']['layers'];
    const layerTree = new TracingLayerTree(this.target);
    layerTree.setViewportSize(viewport);
    layerTree.setTiles(tiles);

    await layerTree.setLayers(rootLayer, layers, this.paintsInternal || []);
    return layerTree;
  }

  paints(): LayerPaintEvent[] {
    return this.paintsInternal || [];
  }

  setPaints(paints: LayerPaintEvent[]): void {
    this.paintsInternal = paints;
  }
}

export class TimelineFrame {
  startTime: Types.Timing.MicroSeconds;
  startTimeOffset: Types.Timing.MicroSeconds;
  endTime: Types.Timing.MicroSeconds;
  duration: Types.Timing.MicroSeconds;
  idle: boolean;
  dropped: boolean;
  isPartial: boolean;
  layerTree: TracingFrameLayerTree|null;
  paints: LayerPaintEvent[];
  mainFrameId: number|undefined;
  readonly seqId: number;

  constructor(seqId: number, startTime: Types.Timing.MicroSeconds, startTimeOffset: Types.Timing.MicroSeconds) {
    this.seqId = seqId;
    this.startTime = startTime;
    this.startTimeOffset = startTimeOffset;
    this.endTime = this.startTime;
    this.duration = Types.Timing.MicroSeconds(0);
    this.idle = false;
    this.dropped = false;
    this.isPartial = false;
    this.layerTree = null;
    this.paints = [];
    this.mainFrameId = undefined;
  }

  setEndTime(endTime: Types.Timing.MicroSeconds): void {
    this.endTime = endTime;
    this.duration = Types.Timing.MicroSeconds(this.endTime - this.startTime);
  }

  setLayerTree(layerTree: TracingFrameLayerTree|null): void {
    this.layerTree = layerTree;
  }
}

export interface LayerPaintEventPicture {
  rect: Array<number>;
  serializedPicture: string;
}
export class LayerPaintEvent {
  private readonly eventInternal: Types.TraceEvents.TraceEventPaint;
  private readonly target: SDK.Target.Target|null;
  #snapshot: Types.TraceEvents.TraceEventDisplayItemListSnapshot;

  constructor(
      event: Types.TraceEvents.TraceEventPaint, snapshot: Types.TraceEvents.TraceEventDisplayItemListSnapshot,
      target: SDK.Target.Target|null) {
    this.eventInternal = event;
    this.#snapshot = snapshot;
    this.target = target;
  }

  layerId(): string {
    // TODO: could make this function return a number?
    return String(this.eventInternal.args['data']['layerId']);
  }

  event(): Types.TraceEvents.TraceEventPaint {
    return this.eventInternal;
  }

  picture(): LayerPaintEventPicture|null {
    // TODO(crbug.com/1453234): this function does not need to be async now
    const rect = this.#snapshot.args.snapshot.params?.layer_rect;
    const pictureData = this.#snapshot.args.snapshot.skp64;
    return rect && pictureData ? {rect: rect, serializedPicture: pictureData} : null;
  }

  async snapshotPromise(): Promise<{
    rect: Array<number>,
    snapshot: SDK.PaintProfiler.PaintProfilerSnapshot,
  }|null> {
    const paintProfilerModel = this.target && this.target.model(SDK.PaintProfiler.PaintProfilerModel);
    const picture = this.picture();
    if (!picture || !paintProfilerModel) {
      return null;
    }
    const snapshot = await paintProfilerModel.loadSnapshot(picture.serializedPicture);
    return snapshot ? {rect: picture.rect, snapshot: snapshot} : null;
  }
}

export class PendingFrame {
  paints: LayerPaintEvent[];
  mainFrameId: number|undefined;
  triggerTime: number;
  constructor(triggerTime: number) {
    this.paints = [];
    this.mainFrameId = undefined;
    this.triggerTime = triggerTime;
  }
}

// The parameters of an impl-side BeginFrame.
class BeginFrameInfo {
  seqId: number;
  startTime: Types.Timing.MicroSeconds;
  isDropped: boolean;
  isPartial: boolean;
  constructor(seqId: number, startTime: Types.Timing.MicroSeconds, isDropped: boolean, isPartial: boolean) {
    this.seqId = seqId;
    this.startTime = startTime;
    this.isDropped = isDropped;
    this.isPartial = isPartial;
  }
}

// A queue of BeginFrames pending visualization.
// BeginFrames are added into this queue as they occur; later when their
// corresponding DrawFrames occur (or lack thereof), the BeginFrames are removed
// from the queue and their timestamps are used for visualization.
export class TimelineFrameBeginFrameQueue {
  private queueFrames: number[] = [];

  // Maps frameSeqId to BeginFrameInfo.
  private mapFrames: {
    [x: number]: BeginFrameInfo,
  } = {};

  // Add a BeginFrame to the queue, if it does not already exit.
  addFrameIfNotExists(seqId: number, startTime: Types.Timing.MicroSeconds, isDropped: boolean, isPartial: boolean):
      void {
    if (!(seqId in this.mapFrames)) {
      this.mapFrames[seqId] = new BeginFrameInfo(seqId, startTime, isDropped, isPartial);
      this.queueFrames.push(seqId);
    }
  }

  // Set a BeginFrame in queue as dropped.
  setDropped(seqId: number, isDropped: boolean): void {
    if (seqId in this.mapFrames) {
      this.mapFrames[seqId].isDropped = isDropped;
    }
  }

  setPartial(seqId: number, isPartial: boolean): void {
    if (seqId in this.mapFrames) {
      this.mapFrames[seqId].isPartial = isPartial;
    }
  }

  processPendingBeginFramesOnDrawFrame(seqId: number): BeginFrameInfo[] {
    const framesToVisualize: BeginFrameInfo[] = [];

    // Do not visualize this frame in the rare case where the current DrawFrame
    // does not have a corresponding BeginFrame.
    if (seqId in this.mapFrames) {
      // Pop all BeginFrames before the current frame, and add only the dropped
      // ones in |frames_to_visualize|.
      // Non-dropped frames popped here are BeginFrames that are never
      // drawn (but not considered dropped either for some reason).
      // Those frames do not require an proactive visualization effort and will
      // be naturally presented as continuationss of other frames.
      while (this.queueFrames[0] !== seqId) {
        const currentSeqId = this.queueFrames[0];
        if (this.mapFrames[currentSeqId].isDropped) {
          framesToVisualize.push(this.mapFrames[currentSeqId]);
        }

        delete this.mapFrames[currentSeqId];
        this.queueFrames.shift();
      }

      // Pop the BeginFrame associated with the current DrawFrame.
      framesToVisualize.push(this.mapFrames[seqId]);
      delete this.mapFrames[seqId];
      this.queueFrames.shift();
    }
    return framesToVisualize;
  }
}
