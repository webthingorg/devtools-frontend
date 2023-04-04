// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import {loadModelDataFromTraceFile} from '../../../helpers/TraceHelpers.js';
const {assert} = chai;

describe('TraceEvent types', () => {
  const {Phase, isNestableAsyncPhase, isAsyncPhase, isFlowPhase} = TraceEngine.Types.TraceEvents;
  it('is able to determine if a phase is a nestable async phase', () => {
    assert.isTrue(isNestableAsyncPhase(Phase.ASYNC_NESTABLE_START));
    assert.isTrue(isNestableAsyncPhase(Phase.ASYNC_NESTABLE_END));
    assert.isTrue(isNestableAsyncPhase(Phase.ASYNC_NESTABLE_INSTANT));
  });

  it('is able to determine if a phase is not a nestable async phase', () => {
    assert.isFalse(isNestableAsyncPhase(Phase.BEGIN));
    assert.isFalse(isNestableAsyncPhase(Phase.END));
    assert.isFalse(isNestableAsyncPhase(Phase.ASYNC_BEGIN));
  });

  it('is able to determine if a phase is an async phase', () => {
    assert.isTrue(isAsyncPhase(Phase.ASYNC_NESTABLE_START));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_NESTABLE_END));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_NESTABLE_INSTANT));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_BEGIN));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_STEP_INTO));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_STEP_PAST));
    assert.isTrue(isAsyncPhase(Phase.ASYNC_END));
  });

  it('is able to determine if a phase is not an async phase', () => {
    assert.isFalse(isAsyncPhase(Phase.BEGIN));
    assert.isFalse(isAsyncPhase(Phase.METADATA));
    assert.isFalse(isAsyncPhase(Phase.OBJECT_CREATED));
  });

  it('is able to determine if a phase is a flow phase', () => {
    assert.isTrue(isFlowPhase(Phase.FLOW_START));
    assert.isTrue(isFlowPhase(Phase.FLOW_STEP));
    assert.isTrue(isFlowPhase(Phase.FLOW_END));
  });

  it('is able to determine if a phase is not a flow phase', () => {
    assert.isFalse(isFlowPhase(Phase.ASYNC_STEP_INTO));
    assert.isFalse(isFlowPhase(Phase.ASYNC_NESTABLE_START));
    assert.isFalse(isFlowPhase(Phase.BEGIN));
  });

  it('is able to determine that an event is a synthetic user timing event', async () => {
    const traceParsedData = await loadModelDataFromTraceFile('timings-track.json.gz');
    const timingEvent = traceParsedData.UserTimings.performanceMeasures[0];
    assert.isTrue(TraceEngine.Types.TraceEvents.isSyntheticUserTimingTraceEvent(timingEvent));
    const consoleEvent = traceParsedData.UserTimings.consoleTimings[0];
    assert.isFalse(TraceEngine.Types.TraceEvents.isSyntheticUserTimingTraceEvent(consoleEvent));
  });

  it('is able to determine that an event is a synthetic console event', async () => {
    const traceParsedData = await loadModelDataFromTraceFile('timings-track.json.gz');
    const consoleEvent = traceParsedData.UserTimings.consoleTimings[0];
    assert.isTrue(TraceEngine.Types.TraceEvents.isSyntheticConsoleTimingTraceEvent(consoleEvent));
    const timingEvent = traceParsedData.UserTimings.performanceMeasures[0];
    assert.isFalse(TraceEngine.Types.TraceEvents.isSyntheticConsoleTimingTraceEvent(timingEvent));
  });

  it('is able to detemrine that an event is a synthetic network request event', async () => {
    const traceParsedData = await loadModelDataFromTraceFile('lcp-images.json.gz');
    const networkEvent = traceParsedData.NetworkRequests.byTime[0];
    assert.isTrue(TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(networkEvent));
    const otherEvent = traceParsedData.Renderer.allRendererEvents[0];
    assert.isFalse(TraceEngine.Types.TraceEvents.isSyntheticNetworkRequestDetailsEvent(otherEvent));
  });
});
