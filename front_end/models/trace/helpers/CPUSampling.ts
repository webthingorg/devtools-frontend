// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../../core/root/root.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as Common from '../../../core/common/common.js';
import type * as CPUProfile from '../../../models/cpu_profile/cpu_profile.js';
import * as Types from '../types/types.js';
import {millisecondsToMicroseconds} from './Timing.js';

type ProfileCallName = 'IdleProfileCall'|'SystemProfileCall'|'ProfileCall';

export class SamplesIntegrator {
  #profileCalls: Types.TraceEvents.ProfileCall[] = [];
  #helperJSStack: Types.TraceEvents.ProfileCall[] = [];
  #processId: Types.TraceEvents.ProcessID;
  #threadId: Types.TraceEvents.ThreadID;
  #lockedJsStackDepth: number[] = [];
  #fakeJSInvocation = false;
  #modelData: CPUProfile.CPUProfileDataModel.CPUProfileDataModel;

  constructor(
      modelData: CPUProfile.CPUProfileDataModel.CPUProfileDataModel, pid: Types.TraceEvents.ProcessID,
      tid: Types.TraceEvents.ThreadID) {
    this.#modelData = modelData;
    this.#threadId = tid;
    this.#processId = pid;
  }

  getProfileCalls(): Types.TraceEvents.ProfileCall[] {
    return this.#profileCalls;
  }

  onTraceEventStart(e: Types.TraceEvents.TraceEventData): void {
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

  onEventInstant(e: Types.TraceEvents.TraceEventData, parent: Types.TraceEvents.TraceEventData): void {
    if ((parent && SamplesIntegrator.isJSInvocationEvent(parent)) || this.#fakeJSInvocation) {
      this.#extractStackTrace(e);
    } else if (
        Types.TraceEvents.isProfileCall(e) && e.args?.data?.stackTrace?.length && this.#helperJSStack.length === 0) {
      // Force JS Samples to show up even if we are not inside a JS invocation event, because we
      // can be missing the start of JS invocation events if we start tracing half-way through.
      // Pretend we have a top-level JS invocation event.
      this.#fakeJSInvocation = true;
      const stackDepthBefore = this.#helperJSStack.length;
      this.#extractStackTrace(e);
      this.#lockedJsStackDepth.push(stackDepthBefore);
    }
  }

  onEventEnd(e: Types.TraceEvents.TraceEventData): void {
    // Because the event has ended, any frames that happened after
    // this event are terminated. Frames that are ancestors to this
    // event are extended to cover its ending.
    const endTime = Types.Timing.MicroSeconds(e.ts + (e.dur || 0));
    this.#truncateJSStack(this.#lockedJsStackDepth.pop() || 0, endTime);
  }
  static getProfileCall(
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
  getStackTraceFromProfileCall(e: Types.TraceEvents.ProfileCall): Types.TraceEvents.ProfileCall[] {
    const callFrames = [];
    let node = this.#modelData.nodeByIndex(e.nodeId);
    while (node) {
      callFrames.unshift(SamplesIntegrator.getProfileCall(node, e.ts, this.#processId, this.#threadId));
      node = node.parent;
    }
    return callFrames;
  }

  getNameForProfileCall(call: Types.TraceEvents.ProfileCall): ProfileCallName {
    if (this.#modelData.gcNode?.id === call.nodeId) {
      return 'SystemProfileCall';
    }
    if (this.#modelData.idleNode?.id === call.nodeId) {
      return 'IdleProfileCall';
    }
    return 'ProfileCall';
  }

  /**
   * Update tracked stack using this event's call stack.
   */
  #extractStackTrace(e: Types.TraceEvents.TraceEventData): void {
    const profileCalls =
        Types.TraceEvents.isProfileCall(e) ? this.getStackTraceFromProfileCall(e) : this.#helperJSStack;
    SamplesIntegrator.filterStackFrames(profileCalls);
    const endTime = e.ts + (e.dur || 0);
    const minFrames = Math.min(profileCalls.length, this.#helperJSStack.length);
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
      const newFrame = profileCalls[i].callFrame;
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
    for (; i < profileCalls.length; ++i) {
      const call = profileCalls[i];
      this.#helperJSStack.push(call);
      this.#profileCalls.push(call);
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
      const callDur = this.#helperJSStack[k].dur;
      this.#helperJSStack[k].dur = Types.Timing.MicroSeconds(Math.max(callDur, time - callDur));
    }
    this.#helperJSStack.length = depth;
  }

  static callsFromProfileSamples(
      profile: CPUProfile.CPUProfileDataModel.CPUProfileDataModel, processId: Types.TraceEvents.ProcessID,
      threadId: Types.TraceEvents.ThreadID): Types.TraceEvents.ProfileCall[] {
    const samples = profile.samples;
    const timestamps = profile.timestamps;
    if (!samples) {
      return [];
    }
    const calls = [];
    for (let i = 0; i < samples.length; i++) {
      const node = profile.nodeByIndex(i);
      const timestamp = millisecondsToMicroseconds(Types.Timing.MilliSeconds(timestamps[i]));
      if (!node) {
        continue;
      }
      calls.push(SamplesIntegrator.getProfileCall(node, timestamp, processId, threadId));
    }
    return calls;
  }
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
}
