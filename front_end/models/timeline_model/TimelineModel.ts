/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
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

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as TraceEngine from '../trace/trace.js';

export class TimelineModelImpl {
  private inspectedTargetEventsInternal!: TraceEngine.Legacy.Event[];
  private sessionId!: string|null;
  private mainFrameNodeId!: number|null;
  private requestsFromBrowser!: Map<string, TraceEngine.Legacy.Event>;
  private lastScheduleStyleRecalculation!: {
    [x: string]: TraceEngine.Types.TraceEvents.TraceEventData,
  };
  private lastPaintForLayer!: {
    [x: string]: TraceEngine.Legacy.Event,
  };
  private currentScriptEvent!: TraceEngine.Legacy.Event|null;
  private eventStack!: TraceEngine.Legacy.Event[];
  private browserFrameTracking!: boolean;
  private currentTaskLayoutAndRecalcEvents: TraceEngine.Legacy.Event[];
  private tracingModelInternal: TraceEngine.Legacy.TracingModel|null;
  private lastRecalculateStylesEvent: TraceEngine.Legacy.Event|null;

  constructor() {
    this.reset();
    this.resetProcessingState();

    this.currentTaskLayoutAndRecalcEvents = [];
    this.tracingModelInternal = null;
    this.lastRecalculateStylesEvent = null;
  }

  /**
   * Iterates events in a tree hierarchically, from top to bottom,
   * calling back on every event's start and end in the order
   * dictated by the corresponding timestamp.
   *
   * Events are assumed to be in ascendent order by timestamp.
   *
   * For example, given this tree, the following callbacks
   * are expected to be made in the following order
   * |---------------A---------------|
   *  |------B------||-------D------|
   *    |---C---|
   *
   * 1. Start A
   * 3. Start B
   * 4. Start C
   * 5. End C
   * 6. End B
   * 7. Start D
   * 8. End D
   * 9. End A
   *
   * By default, async events are filtered. This behaviour can be
   * overriden making use of the filterAsyncEvents parameter.
   */
  static forEachEvent(
      events: TraceEngine.Legacy.CompatibleTraceEvent[],
      onStartEvent: (arg0: TraceEngine.Legacy.CompatibleTraceEvent) => void,
      onEndEvent: (arg0: TraceEngine.Legacy.CompatibleTraceEvent) => void,
      onInstantEvent?:
          ((arg0: TraceEngine.Legacy.CompatibleTraceEvent, arg1: TraceEngine.Legacy.CompatibleTraceEvent|null) => void),
      startTime?: number, endTime?: number, filter?: ((arg0: TraceEngine.Legacy.CompatibleTraceEvent) => boolean),
      ignoreAsyncEvents = true): void {
    startTime = startTime || 0;
    endTime = endTime || Infinity;
    const stack: TraceEngine.Legacy.CompatibleTraceEvent[] = [];
    const startEvent = TimelineModelImpl.topLevelEventEndingAfter(events, startTime);
    for (let i = startEvent; i < events.length; ++i) {
      const e = events[i];
      const {endTime: eventEndTime, startTime: eventStartTime, duration: eventDuration} =
          TraceEngine.Legacy.timesForEventInMilliseconds(e);
      const eventPhase = TraceEngine.Legacy.phaseForEvent(e);
      if ((eventEndTime || eventStartTime) < startTime) {
        continue;
      }
      if (eventStartTime >= endTime) {
        break;
      }
      const canIgnoreAsyncEvent = ignoreAsyncEvents && TraceEngine.Types.TraceEvents.isAsyncPhase(eventPhase);
      if (canIgnoreAsyncEvent || TraceEngine.Types.TraceEvents.isFlowPhase(eventPhase)) {
        continue;
      }
      let last = stack[stack.length - 1];
      let lastEventEndTime = last && TraceEngine.Legacy.timesForEventInMilliseconds(last).endTime;
      while (last && lastEventEndTime !== undefined && lastEventEndTime <= eventStartTime) {
        stack.pop();
        onEndEvent(last);
        last = stack[stack.length - 1];
        lastEventEndTime = last && TraceEngine.Legacy.timesForEventInMilliseconds(last).endTime;
      }

      if (filter && !filter(e)) {
        continue;
      }
      if (eventDuration) {
        onStartEvent(e);
        stack.push(e);
      } else {
        onInstantEvent && onInstantEvent(e, stack[stack.length - 1] || null);
      }
    }
    while (stack.length) {
      const last = stack.pop();
      if (last) {
        onEndEvent(last);
      }
    }
  }

  private static topLevelEventEndingAfter(events: TraceEngine.Legacy.CompatibleTraceEvent[], time: number): number {
    let index =
        Platform.ArrayUtilities.upperBound(
            events, time, (time, event) => time - TraceEngine.Legacy.timesForEventInMilliseconds(event).startTime) -
        1;
    while (index > 0 && !TraceEngine.Legacy.TracingModel.isTopLevelEvent(events[index])) {
      index--;
    }
    return Math.max(index, 0);
  }

  setEvents(tracingModel: TraceEngine.Legacy.TracingModel): void {
    this.reset();
    this.resetProcessingState();
    this.tracingModelInternal = tracingModel;

    this.processSyncBrowserEvents(tracingModel);
    if (this.browserFrameTracking) {
      this.processThreadsForBrowserFrames(tracingModel);
    } else {
      // The next line is for loading legacy traces recorded before M67.
      // TODO(alph): Drop the support at some point.
      const metadataEvents = this.processMetadataEvents(tracingModel);
      if (metadataEvents) {
        this.processMetadataAndThreads(metadataEvents);
      } else {
        this.processGenericTrace(tracingModel);
      }
    }
    this.inspectedTargetEventsInternal.sort(TraceEngine.Legacy.Event.compareStartTime);
    this.resetProcessingState();
  }

  private processGenericTrace(tracingModel: TraceEngine.Legacy.TracingModel): void {
    let browserMainThread = TraceEngine.Legacy.TracingModel.browserMainThread(tracingModel);
    if (!browserMainThread && tracingModel.sortedProcesses().length) {
      browserMainThread = tracingModel.sortedProcesses()[0].sortedThreads()[0];
    }
    for (const process of tracingModel.sortedProcesses()) {
      for (const thread of process.sortedThreads()) {
        this.processThreadEvents(thread);
      }
    }
  }

  private processMetadataAndThreads(metadataEvents: MetadataEvents): void {
    let startTime = 0;
    for (let i = 0, length = metadataEvents.page.length; i < length; i++) {
      const metaEvent = metadataEvents.page[i];
      const process = metaEvent.thread.process();
      const endTime = i + 1 < length ? metadataEvents.page[i + 1].startTime : Infinity;
      if (startTime === endTime) {
        continue;
      }
      for (const thread of process.sortedThreads()) {
        this.processThreadEvents(thread);
      }
      startTime = endTime;
    }
  }

  private processThreadsForBrowserFrames(tracingModel: TraceEngine.Legacy.TracingModel): void {
    const processDataByPid = new Map<number, {
      from: number,
      to: number,
      main: boolean,
      url: Platform.DevToolsPath.UrlString,
    }[]>();
    for (const process of tracingModel.sortedProcesses()) {
      const processData = processDataByPid.get(process.id());
      if (!processData) {
        continue;
      }
      // Sort ascending by range starts, followed by range ends
      processData.sort((a, b) => a.from - b.from || a.to - b.to);

      for (const thread of process.sortedThreads()) {
        if (thread.name() === TimelineModelImpl.RendererMainThreadName) {
          this.processThreadEvents(thread);
        } else if (
            thread.name() === TimelineModelImpl.WorkerThreadName ||
            thread.name() === TimelineModelImpl.WorkerThreadNameLegacy) {
          continue;
        } else {
          this.processThreadEvents(thread);
        }
      }
    }
  }

  private processMetadataEvents(tracingModel: TraceEngine.Legacy.TracingModel): MetadataEvents|null {
    const metadataEvents = tracingModel.devToolsMetadataEvents();

    const pageDevToolsMetadataEvents = [];
    const workersDevToolsMetadataEvents = [];
    for (const event of metadataEvents) {
      if (event.name === TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInPage) {
        pageDevToolsMetadataEvents.push(event);
      } else if (event.name === TimelineModelImpl.DevToolsMetadataEvent.TracingSessionIdForWorker) {
        workersDevToolsMetadataEvents.push(event);
      } else if (event.name === TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser) {
        console.assert(!this.mainFrameNodeId, 'Multiple sessions in trace');
        this.mainFrameNodeId = event.args['frameTreeNodeId'];
      }
    }
    if (!pageDevToolsMetadataEvents.length) {
      return null;
    }

    const sessionId =
        pageDevToolsMetadataEvents[0].args['sessionId'] || pageDevToolsMetadataEvents[0].args['data']['sessionId'];
    this.sessionId = sessionId;

    const mismatchingIds = new Set<any>();
    function checkSessionId(event: TraceEngine.Legacy.Event): boolean {
      let args = event.args;
      // FIXME: put sessionId into args["data"] for TracingStartedInPage event.
      if (args['data']) {
        args = args['data'];
      }
      const id = args['sessionId'];
      if (id === sessionId) {
        return true;
      }
      mismatchingIds.add(id);
      return false;
    }
    const result = {
      page: pageDevToolsMetadataEvents.filter(checkSessionId).sort(TraceEngine.Legacy.Event.compareStartTime),
      workers: workersDevToolsMetadataEvents.sort(TraceEngine.Legacy.Event.compareStartTime),
    };
    if (mismatchingIds.size) {
      Common.Console.Console.instance().error(
          'Timeline recording was started in more than one page simultaneously. Session id mismatch: ' +
          this.sessionId + ' and ' + [...mismatchingIds] + '.');
    }
    return result;
  }

  private processSyncBrowserEvents(tracingModel: TraceEngine.Legacy.TracingModel): void {
    const browserMain = TraceEngine.Legacy.TracingModel.browserMainThread(tracingModel);
    if (browserMain) {
      browserMain.events().forEach(this.processBrowserEvent, this);
    }
  }

  private resetProcessingState(): void {
    this.lastScheduleStyleRecalculation = {};
    this.lastPaintForLayer = {};
    this.currentScriptEvent = null;
    this.eventStack = [];
    this.browserFrameTracking = false;
  }

  private processThreadEvents(thread: TraceEngine.Legacy.Thread): void {
    const events = thread.events();
    this.eventStack = [];
    const eventStack = this.eventStack;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      let last: TraceEngine.Legacy.Event = eventStack[eventStack.length - 1];
      while (last && last.endTime !== undefined && last.endTime <= event.startTime) {
        eventStack.pop();
        last = eventStack[eventStack.length - 1];
      }
      if (!this.processEvent(event)) {
        continue;
      }
      if (!TraceEngine.Types.TraceEvents.isAsyncPhase(event.phase) && event.duration) {
        if (eventStack.length) {
          const parent = eventStack[eventStack.length - 1];
          if (parent) {
            parent.selfTime -= event.duration;
            if (parent.selfTime < 0) {
              parent.selfTime = 0;
            }
          }
        }
        event.selfTime = event.duration;
        eventStack.push(event);
      }

      this.inspectedTargetEventsInternal.push(event);
    }
  }

  private processEvent(event: TraceEngine.Legacy.Event): boolean {
    const eventStack = this.eventStack;

    if (!eventStack.length) {
      this.currentTaskLayoutAndRecalcEvents = [];
    }

    if (this.currentScriptEvent) {
      if (this.currentScriptEvent.endTime !== undefined && event.startTime > this.currentScriptEvent.endTime) {
        this.currentScriptEvent = null;
      }
    }

    const eventData = event.args['data'] || event.args['beginData'] || {};
    switch (event.name) {
      case RecordType.ScheduleStyleRecalculation: {
        if (!(event instanceof TraceEngine.Legacy.PayloadEvent)) {
          break;
        }
        this.lastScheduleStyleRecalculation[eventData['frame']] = event.rawPayload();
        break;
      }

      case RecordType.UpdateLayoutTree: {
        if (this.currentScriptEvent) {
          this.currentTaskLayoutAndRecalcEvents.push(event);
        }
        break;
      }

      case RecordType.Layout: {
        const frameId = event.args?.beginData?.frame;
        if (!frameId) {
          break;
        }
        if (this.currentScriptEvent) {
          this.currentTaskLayoutAndRecalcEvents.push(event);
        }
        break;
      }

      case RecordType.RunMicrotasks: {
        // Microtasks technically are not necessarily scripts, but for purpose of
        // forced sync style recalc or layout detection they are.
        if (!this.currentScriptEvent) {
          this.currentScriptEvent = event;
        }
        break;
      }

      case RecordType.Paint: {
        // Only keep layer paint events, skip paints for subframes that get painted to the same layer as parent.
        if (!eventData['layerId']) {
          break;
        }
        const layerId = eventData['layerId'];
        this.lastPaintForLayer[layerId] = event;
        break;
      }

      case RecordType.SelectorStats: {
        this.lastRecalculateStylesEvent?.addArgs(event.args);
        break;
      }
    }
    return true;
  }

  private processBrowserEvent(event: TraceEngine.Legacy.Event): void {
    if (event.name === RecordType.ResourceWillSendRequest) {
      const requestId = event.args?.data?.requestId;
      if (typeof requestId === 'string') {
        this.requestsFromBrowser.set(requestId, event);
      }
      return;
    }

    if (event.hasCategory(TraceEngine.Legacy.DevToolsMetadataEventCategory) && event.args['data']) {
      const data = event.args['data'];
      if (event.name === TimelineModelImpl.DevToolsMetadataEvent.TracingStartedInBrowser) {
        if (!data['persistentIds']) {
          return;
        }
        this.browserFrameTracking = true;
        this.mainFrameNodeId = data['frameTreeNodeId'];
        return;
      }
    }
  }

  private reset(): void {
    this.inspectedTargetEventsInternal = [];
    this.sessionId = null;
    this.mainFrameNodeId = null;
    this.requestsFromBrowser = new Map();
  }

  tracingModel(): TraceEngine.Legacy.TracingModel|null {
    return this.tracingModelInternal;
  }

  inspectedTargetEvents(): TraceEngine.Legacy.Event[] {
    return this.inspectedTargetEventsInternal;
  }
}

export enum RecordType {
  Task = 'RunTask',
  Program = 'Program',
  EventDispatch = 'EventDispatch',

  GPUTask = 'GPUTask',

  Animation = 'Animation',
  RequestMainThreadFrame = 'RequestMainThreadFrame',
  BeginFrame = 'BeginFrame',
  NeedsBeginFrameChanged = 'NeedsBeginFrameChanged',
  BeginMainThreadFrame = 'BeginMainThreadFrame',
  ActivateLayerTree = 'ActivateLayerTree',
  DrawFrame = 'DrawFrame',
  DroppedFrame = 'DroppedFrame',
  HitTest = 'HitTest',
  ScheduleStyleRecalculation = 'ScheduleStyleRecalculation',
  UpdateLayoutTree = 'UpdateLayoutTree',
  InvalidateLayout = 'InvalidateLayout',
  Layerize = 'Layerize',
  Layout = 'Layout',
  LayoutShift = 'LayoutShift',
  UpdateLayer = 'UpdateLayer',
  UpdateLayerTree = 'UpdateLayerTree',
  PaintSetup = 'PaintSetup',
  Paint = 'Paint',
  PaintImage = 'PaintImage',
  PrePaint = 'PrePaint',
  Rasterize = 'Rasterize',
  RasterTask = 'RasterTask',
  ScrollLayer = 'ScrollLayer',
  Commit = 'Commit',
  CompositeLayers = 'CompositeLayers',
  ComputeIntersections = 'IntersectionObserverController::computeIntersections',
  InteractiveTime = 'InteractiveTime',

  ParseHTML = 'ParseHTML',
  ParseAuthorStyleSheet = 'ParseAuthorStyleSheet',

  TimerInstall = 'TimerInstall',
  TimerRemove = 'TimerRemove',
  TimerFire = 'TimerFire',

  XHRReadyStateChange = 'XHRReadyStateChange',
  XHRLoad = 'XHRLoad',
  CompileScript = 'v8.compile',
  CompileCode = 'V8.CompileCode',
  OptimizeCode = 'V8.OptimizeCode',
  EvaluateScript = 'EvaluateScript',
  CacheScript = 'v8.produceCache',
  CompileModule = 'v8.compileModule',
  EvaluateModule = 'v8.evaluateModule',
  CacheModule = 'v8.produceModuleCache',
  WasmStreamFromResponseCallback = 'v8.wasm.streamFromResponseCallback',
  WasmCompiledModule = 'v8.wasm.compiledModule',
  WasmCachedModule = 'v8.wasm.cachedModule',
  WasmModuleCacheHit = 'v8.wasm.moduleCacheHit',
  WasmModuleCacheInvalid = 'v8.wasm.moduleCacheInvalid',

  FrameStartedLoading = 'FrameStartedLoading',
  CommitLoad = 'CommitLoad',
  MarkLoad = 'MarkLoad',
  MarkDOMContent = 'MarkDOMContent',
  MarkFirstPaint = 'firstPaint',
  MarkFCP = 'firstContentfulPaint',
  MarkLCPCandidate = 'largestContentfulPaint::Candidate',
  MarkLCPInvalidate = 'largestContentfulPaint::Invalidate',
  NavigationStart = 'navigationStart',

  TimeStamp = 'TimeStamp',
  ConsoleTime = 'ConsoleTime',
  UserTiming = 'UserTiming',
  EventTiming = 'EventTiming',

  ResourceWillSendRequest = 'ResourceWillSendRequest',
  ResourceSendRequest = 'ResourceSendRequest',
  ResourceReceiveResponse = 'ResourceReceiveResponse',
  ResourceReceivedData = 'ResourceReceivedData',
  ResourceFinish = 'ResourceFinish',
  ResourceMarkAsCached = 'ResourceMarkAsCached',

  RunMicrotasks = 'RunMicrotasks',
  FunctionCall = 'FunctionCall',
  GCEvent = 'GCEvent',
  MajorGC = 'MajorGC',
  MinorGC = 'MinorGC',

  // The following types are used for CPUProfile.
  // JSRoot is used for the root node.
  // JSIdleFrame and JSIdleSample are used for idle nodes.
  // JSSystemFrame and JSSystemSample are used for other system nodes.
  // JSFrame and JSSample are used for other nodes, and will be categorized as |scripting|.
  JSFrame = 'JSFrame',
  JSSample = 'JSSample',
  JSIdleFrame = 'JSIdleFrame',
  JSIdleSample = 'JSIdleSample',
  JSSystemFrame = 'JSSystemFrame',
  JSSystemSample = 'JSSystemSample',
  JSRoot = 'JSRoot',

  // V8Sample events are coming from tracing and contain raw stacks with function addresses.
  // After being processed with help of JitCodeAdded and JitCodeMoved events they
  // get translated into function infos and stored as stacks in JSSample events.
  V8Sample = 'V8Sample',
  JitCodeAdded = 'JitCodeAdded',
  JitCodeMoved = 'JitCodeMoved',
  StreamingCompileScript = 'v8.parseOnBackground',
  StreamingCompileScriptWaiting = 'v8.parseOnBackgroundWaiting',
  StreamingCompileScriptParsing = 'v8.parseOnBackgroundParsing',
  BackgroundDeserialize = 'v8.deserializeOnBackground',
  FinalizeDeserialization = 'V8.FinalizeDeserialization',
  V8Execute = 'V8.Execute',

  UpdateCounters = 'UpdateCounters',

  RequestAnimationFrame = 'RequestAnimationFrame',
  CancelAnimationFrame = 'CancelAnimationFrame',
  FireAnimationFrame = 'FireAnimationFrame',

  RequestIdleCallback = 'RequestIdleCallback',
  CancelIdleCallback = 'CancelIdleCallback',
  FireIdleCallback = 'FireIdleCallback',

  WebSocketCreate = 'WebSocketCreate',
  WebSocketSendHandshakeRequest = 'WebSocketSendHandshakeRequest',
  WebSocketReceiveHandshakeResponse = 'WebSocketReceiveHandshakeResponse',
  WebSocketDestroy = 'WebSocketDestroy',
  WebSocketSend = 'WebSocketSend',
  WebSocketReceive = 'WebSocketReceive',
  EmbedderCallback = 'EmbedderCallback',

  SetLayerTreeId = 'SetLayerTreeId',
  TracingStartedInPage = 'TracingStartedInPage',
  TracingSessionIdForWorker = 'TracingSessionIdForWorker',
  StartProfiling = 'CpuProfiler::StartProfiling',

  DecodeImage = 'Decode Image',
  DrawLazyPixelRef = 'Draw LazyPixelRef',
  DecodeLazyPixelRef = 'Decode LazyPixelRef',

  LazyPixelRef = 'LazyPixelRef',
  LayerTreeHostImplSnapshot = 'cc::LayerTreeHostImpl',
  PictureSnapshot = 'cc::Picture',
  DisplayItemListSnapshot = 'cc::DisplayItemList',
  InputLatencyMouseMove = 'InputLatency::MouseMove',
  InputLatencyMouseWheel = 'InputLatency::MouseWheel',
  ImplSideFling = 'InputHandlerProxy::HandleGestureFling::started',
  GCCollectGarbage = 'BlinkGC.AtomicPhase',

  CryptoDoEncrypt = 'DoEncrypt',
  CryptoDoEncryptReply = 'DoEncryptReply',
  CryptoDoDecrypt = 'DoDecrypt',
  CryptoDoDecryptReply = 'DoDecryptReply',
  CryptoDoDigest = 'DoDigest',
  CryptoDoDigestReply = 'DoDigestReply',
  CryptoDoSign = 'DoSign',
  CryptoDoSignReply = 'DoSignReply',
  CryptoDoVerify = 'DoVerify',
  CryptoDoVerifyReply = 'DoVerifyReply',

  // CpuProfile is a virtual event created on frontend to support
  // serialization of CPU Profiles within tracing timeline data.
  CpuProfile = 'CpuProfile',
  Profile = 'Profile',

  AsyncTask = 'AsyncTask',

  SelectorStats = 'SelectorStats',
}

export namespace TimelineModelImpl {
  export const Category = {
    Console: 'blink.console',
    UserTiming: 'blink.user_timing',
    Loading: 'loading',
  };

  export const WorkerThreadName = 'DedicatedWorker thread';
  export const WorkerThreadNameLegacy = 'DedicatedWorker Thread';
  export const RendererMainThreadName = 'CrRendererMain';
  export const BrowserMainThreadName = 'CrBrowserMain';
  // The names of threads before M111 were exactly this, but afterwards have
  // it a suffix after the exact role.
  export const UtilityMainThreadNameSuffix = 'CrUtilityMain';

  export const DevToolsMetadataEvent = {
    TracingStartedInBrowser: 'TracingStartedInBrowser',
    TracingStartedInPage: 'TracingStartedInPage',
    TracingSessionIdForWorker: 'TracingSessionIdForWorker',
    FrameCommittedInBrowser: 'FrameCommittedInBrowser',
    ProcessReadyInBrowser: 'ProcessReadyInBrowser',
    FrameDeletedInBrowser: 'FrameDeletedInBrowser',
  };

  export const Thresholds = {
    LongTask: 50,
    Handler: 150,
    RecurringHandler: 50,
    ForcedLayout: 30,
    IdleCallbackAddon: 5,
  };
}

export interface MetadataEvents {
  page: TraceEngine.Legacy.Event[];
  workers: TraceEngine.Legacy.Event[];
}
