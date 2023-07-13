// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../../core/root/root.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Common from '../../../core/common/common.js';
import type * as CPUProfile from '../../cpu_profile/cpu_profile.js';
import * as Types from '../types/types.js';
import {millisecondsToMicroseconds} from './Timing.js';

/**
 * This is a helpers that integrates CPU profiling data coming in the
 * shape of samples, with trace events. Samples indicate what the JS
 * stack trace looked at a given point in time, but they don't have
 * duration. The SamplesIntegrator task is to make an "educated guess"
 * of what the duration of each JS call was, given the sample data and
 * given the trace events profiled during that time. At the end of its
 * execution, the SamplesIntegrator returns an array of ProfileCalls
 * (under SamplesIntegrator::getConstructedProfileCalls()), which
 * represent JS s call, with a call frame and duration. These calls have
 * the shape of a complete trace events and can be treated as flame
 * chart entries in the timeline.
 *
 * The approach to build the profile calls consists in tracking the
 * current stack as the following events happen (in order):
 * 1. A sample was done.
 * 2. A trace event started.
 * 3. A trace event ended.
 * Depending on the event and on the data that's coming with it the
 * stack is updated by adding or removing JS calls to it and updating
 * the duration of the calls in the tracking stack.
 *
 * note: Although this approach has been implemented since long ago, and
 * is relatively efficent (adds a complexity over the trace parsing of
 * O(n) where n is the number of samples) it has proven to be faulty.
 * It might be worthwhile experimenting with improvements or with a
 * completely different approach. Improving the approach is tracked in
 * crbug.com/1417439
 */
export class SamplesIntegrator {
  #constructedProfileCalls: Types.TraceEvents.ProfileCall[] = [];
  #helperJSStack: Types.TraceEvents.ProfileCall[] = [];
  #processId: Types.TraceEvents.ProcessID;
  #threadId: Types.TraceEvents.ThreadID;
  #lockedJsStackDepth: number[] = [];
  #fakeJSInvocation = false;
  #profileModel: CPUProfile.CPUProfileDataModel.CPUProfileDataModel;
  #nodeForGC = new Map<Types.TraceEvents.ProfileCall, CPUProfile.ProfileTreeModel.ProfileNode>();
  constructor(
      profileModel: CPUProfile.CPUProfileDataModel.CPUProfileDataModel, pid: Types.TraceEvents.ProcessID,
      tid: Types.TraceEvents.ThreadID) {
    this.#profileModel = profileModel;
    this.#threadId = tid;
    this.#processId = pid;
  }

  getConstructedProfileCalls(): Types.TraceEvents.ProfileCall[] {
    return this.#constructedProfileCalls;
  }

  onTraceEventStart(e: Types.TraceEvents.TraceEventData): void {
    if (e.ph === Types.TraceEvents.Phase.INSTANT) {
      return;
    }
    // Top level events cannot be nested into JS frames so we reset
    // the stack when we find one.
    if (e.name === Types.TraceEvents.KnownEventName.RunMicrotasks ||
        e.name === Types.TraceEvents.KnownEventName.RunTask) {
      this.#lockedJsStackDepth = [];
      this.#truncateJSStack(0, e.ts);
      this.#fakeJSInvocation = false;
    }

    if (this.#fakeJSInvocation) {
      this.#truncateJSStack(this.#lockedJsStackDepth.pop() || 0, e.ts);
      this.#fakeJSInvocation = false;
    }
    this.#extractStackTrace(e);
    // Keep track of the call frames in the stack before the event
    // happened. For the duration of this event, these frames cannot
    // change (none can be terminated before this event finishes).
    //
    // Also, every frame that is opened after this event, is consider
    // to be a descendat of the event. So once the event finishes, the
    // frames that were opened after it, need to be closed (see
    // onEndEvent).
    //
    // TODO(crbug.com/1417439):
    // The assumption that the stack on top of the event cannot change
    // is incorrect. For example, the JS call that parents the trace
    // event might have been sampled after the event was dispatched.
    // In this case the JS call would be discarded if this event isn't
    // an invocation event, otherwise the call will be considered a
    // child of the event. In both cases, the result would be
    // incorrect.
    this.#lockedJsStackDepth.push(this.#helperJSStack.length);
  }

  onProfileCall(e: Types.TraceEvents.ProfileCall, parent?: Types.TraceEvents.TraceEventData): void {
    if ((parent && SamplesIntegrator.isJSInvocationEvent(parent)) || this.#fakeJSInvocation) {
      this.#extractStackTrace(e);
    } else if (Types.TraceEvents.isProfileCall(e) && this.#helperJSStack.length === 0) {
      // Force JS Samples to show up even if we are not inside a JS
      // invocation event, because we can be missing the start of JS
      // invocation events if we start tracing half-way through. Pretend
      // we have a top-level JS invocation event.
      this.#fakeJSInvocation = true;
      const stackDepthBefore = this.#helperJSStack.length;
      this.#extractStackTrace(e);
      this.#lockedJsStackDepth.push(stackDepthBefore);
    }
  }

  onTraceEventEnd(e: Types.TraceEvents.TraceEventData): void {
    // Because the event has ended, any frames that happened after
    // this event are terminated. Frames that are ancestors to this
    // event are extended to cover its ending.
    const endTime = Types.Timing.MicroSeconds(e.ts + (e.dur || 0));
    this.#truncateJSStack(this.#lockedJsStackDepth.pop() || 0, endTime);
  }

  /**
   * Builds the initial calls with no duration from samples. Their
   * purpose is to be merged with the trace event array being parsed so
   * that they can be traversed in order with them and their duration
   * can be updated as the SampleIntegrator callbacks are invoked.
   */
  callsFromProfileSamples(): Types.TraceEvents.ProfileCall[] {
    const samples = this.#profileModel.samples;
    const timestamps = this.#profileModel.timestamps;
    if (!samples) {
      return [];
    }
    const calls: Types.TraceEvents.ProfileCall[] = [];
    let prevNode;
    for (let i = 0; i < samples.length; i++) {
      const node = this.#profileModel.nodeByIndex(i);
      const timestamp = millisecondsToMicroseconds(Types.Timing.MilliSeconds(timestamps[i]));
      if (!node) {
        continue;
      }
      const call = SamplesIntegrator.makeProfileCall(node, timestamp, this.#processId, this.#threadId);
      calls.push(call);
      if (node.id === this.#profileModel.gcNode?.id && prevNode) {
        // GC samples have no stack, so we just put GC node on top of the
        // last recorded sample. Cache the previous sample for future
        // reference.
        this.#nodeForGC.set(call, prevNode);
        continue;
      }
      prevNode = node;
    }
    return calls;
  }

  #getStackTraceFromProfileCall(e: Types.TraceEvents.ProfileCall): Types.TraceEvents.ProfileCall[] {
    let node = this.#profileModel.nodeById(e.nodeId);
    const isGarbageCollection = Boolean(node?.id === this.#profileModel.gcNode?.id);
    if (isGarbageCollection) {
      // Because GC don't have a stack, we use the stack of the previous
      // sample.
      node = this.#nodeForGC.get(e) || null;
    }
    if (!node) {
      return [];
    }
    const callFrames = new Array<Types.TraceEvents.ProfileCall>(node.depth + 1 + Number(isGarbageCollection));
    // Add the stack trace in reverse order (bottom first).
    let i = callFrames.length - 1;
    if (isGarbageCollection) {
      callFrames[i--] = e;
    }
    while (node) {
      callFrames[i--] = SamplesIntegrator.makeProfileCall(node, e.ts, this.#processId, this.#threadId);
      node = node.parent;
    }
    return callFrames;
  }

  /**
   * Update tracked stack using this event's call stack.
   */
  #extractStackTrace(e: Types.TraceEvents.TraceEventData): void {
    const stackTrace = Types.TraceEvents.isProfileCall(e) ? this.#getStackTraceFromProfileCall(e) : this.#helperJSStack;
    SamplesIntegrator.filterStackFrames(stackTrace);

    const endTime = e.ts + (e.dur || 0);
    const minFrames = Math.min(stackTrace.length, this.#helperJSStack.length);
    let i;
    // Merge a sample's stack frames with the stack frames we have
    // so far if we detect they are equivalent.
    // Graphically
    // This:
    // Current stack trace       Sample
    // [-------A------]          [A]
    // [-------B------]          [B]
    // [-------C------]          [C]
    //                ^ t = x1    ^ t = x2

    // Becomes this:
    // New stack trace after merge
    // [--------A-------]
    // [--------B-------]
    // [--------C-------]
    //                  ^ t = x2
    for (i = this.#lockedJsStackDepth.at(-1) || 0; i < minFrames; ++i) {
      const newFrame = stackTrace[i].callFrame;
      const oldFrame = this.#helperJSStack[i].callFrame;
      if (!SamplesIntegrator.framesAreEqual(newFrame, oldFrame)) {
        break;
      }
      // Scoot the right edge of this callFrame to the right
      this.#helperJSStack[i].dur =
          Types.Timing.MicroSeconds(Math.max(this.#helperJSStack[i].dur, endTime - this.#helperJSStack[i].ts));
    }

    // If there are call frames in the sample that differ with the stack
    // we have, update the stack, but keeping the common frames in place
    // Graphically
    // This:
    // Current stack trace       Sample
    // [-------A------]          [A]
    // [-------B------]          [B]
    // [-------C------]          [C]
    // [-------D------]          [E]
    //                ^ t = x1    ^ t = x2
    // Becomes this:
    // New stack trace after merge
    // [--------A-------]
    // [--------B-------]
    // [--------C-------]
    //                [E]
    //                  ^ t = x2
    this.#truncateJSStack(i, e.ts);
    for (; i < stackTrace.length; ++i) {
      const call = stackTrace[i];
      this.#helperJSStack.push(call);
      if (call.nodeId === this.#profileModel.programNode?.id || call.nodeId === this.#profileModel.root?.id) {
        // Skip (root) and (program) frames.
        continue;
      }
      this.#constructedProfileCalls.push(call);
    }
  }

  /**
   * When a call stack that differs from the one we are tracking has
   * been detected in the samples, the latter is "truncated" by
   * setting the ending time of its call frames and removing the top
   * call frames that aren't shared with the new call stack. This way,
   * we can update the tracked stack with the new call frames on top.
   * @param depth the amount of call frames from bottom to top that
   * should be kept in the tracking stack trace. AKA amount of shared
   * call frames between two stacks.
   * @param time the new end of the call frames in the stack.
   */
  #truncateJSStack(depth: number, time: Types.Timing.MicroSeconds): void {
    if (this.#lockedJsStackDepth.length) {
      const lockedDepth = this.#lockedJsStackDepth.at(-1);
      if (lockedDepth && depth < lockedDepth) {
        console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
        depth = lockedDepth;
      }
    }
    if (this.#helperJSStack.length < depth) {
      console.error(`Trying to truncate higher than the current stack size at ${time}`);
      depth = this.#helperJSStack.length;
    }
    for (let k = 0; k < this.#helperJSStack.length; ++k) {
      this.#helperJSStack[k].dur = Types.Timing.MicroSeconds(Math.max(time - this.#helperJSStack[k].ts, 0));
    }
    this.#helperJSStack.length = depth;
  }

  /**
   * Generally, before JS is executed, a trace event is dispatched that
   * parents the JS calls. These we call "invocation" events. This
   * function determines if an event is one of such.
   */
  static isJSInvocationEvent(e: Types.TraceEvents.TraceEventData): boolean {
    switch (e.name) {
      case Types.TraceEvents.KnownEventName.RunMicrotasks:
      case Types.TraceEvents.KnownEventName.FunctionCall:
      case Types.TraceEvents.KnownEventName.EvaluateScript:
      case Types.TraceEvents.KnownEventName.EvaluateModule:
      case Types.TraceEvents.KnownEventName.EventDispatch:
      case Types.TraceEvents.KnownEventName.V8Execute:
        return true;
    }
    // Also consider any new v8 trace events. (eg 'V8.RunMicrotasks' and 'v8.run')
    if (e.name.startsWith('v8') || e.name.startsWith('V8')) {
      return true;
    }
    return false;
  }

  static framesAreEqual(frame1: Protocol.Runtime.CallFrame, frame2: Protocol.Runtime.CallFrame): boolean {
    return frame1.scriptId === frame2.scriptId && frame1.functionName === frame2.functionName &&
        frame1.lineNumber === frame2.lineNumber;
  }

  static showNativeName(name: string): boolean {
    const showRuntimeCallStats = Root.Runtime.experiments.isEnabled('timelineV8RuntimeCallStats');
    return showRuntimeCallStats && Boolean(SamplesIntegrator.nativeGroup(name));
  }

  static nativeGroup(nativeName: string): string|null {
    if (nativeName.startsWith('Parse')) {
      return 'Parse';
    }
    if (nativeName.startsWith('Compile') || nativeName.startsWith('Recompile')) {
      return 'Compile';
    }
    return null;
  }

  static isNativeRuntimeFrame(frame: Protocol.Runtime.CallFrame): boolean {
    return frame.url === 'native V8Runtime';
  }

  static filterStackFrames(stack: Types.TraceEvents.ProfileCall[]): void {
    const showAllEvents = Root.Runtime.experiments.isEnabled('timelineShowAllEvents');
    const showNativeFunctions = Common.Settings.Settings.hasInstance() &&
        Common.Settings.Settings.instance().moduleSetting('showNativeFunctionsInJSProfile').get();
    if (showAllEvents) {
      return;
    }
    let previousNativeFrameName: (string|null)|null = null;
    let j = 0;
    for (let i = 0; i < stack.length; ++i) {
      const frame = stack[i].callFrame;
      const url = frame.url;
      const isNativeFrame = url && url.startsWith('native ');
      if (!showNativeFunctions && isNativeFrame) {
        continue;
      }
      const nativeRuntimeFrame = SamplesIntegrator.isNativeRuntimeFrame(frame);
      if (nativeRuntimeFrame && !SamplesIntegrator.showNativeName(frame.functionName)) {
        continue;
      }
      const nativeFrameName = nativeRuntimeFrame ? SamplesIntegrator.nativeGroup(frame.functionName) : null;
      if (previousNativeFrameName && previousNativeFrameName === nativeFrameName) {
        continue;
      }
      previousNativeFrameName = nativeFrameName;
      stack[j++] = stack[i];
    }
    stack.length = j;
  }

  static makeProfileCall(
      node: CPUProfile.ProfileTreeModel.ProfileNode, ts: Types.Timing.MicroSeconds, pid: Types.TraceEvents.ProcessID,
      tid: Types.TraceEvents.ThreadID): Types.TraceEvents.ProfileCall {
    return {
      cat: '',
      name: 'ProfileCall',
      nodeId: node.id,
      children: [],
      ph: Types.TraceEvents.Phase.COMPLETE,
      pid,
      tid,
      ts,
      dur: Types.Timing.MicroSeconds(0),
      selfTime: Types.Timing.MicroSeconds(0),
      callFrame: node.callFrame,
    };
  }
}
