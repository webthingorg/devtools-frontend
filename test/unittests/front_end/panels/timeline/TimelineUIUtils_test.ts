// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as TimelineModel from '../../../../../front_end/models/timeline_model/timeline_model.js';
import type * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as TraceEngine from '../../../../../front_end/models/trace/trace.js';
import * as Timeline from '../../../../../front_end/panels/timeline/timeline.js';
import {createTarget} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';
import {FakeStorage} from '../../helpers/TimelineHelpers.js';
import {allModelsFromFile, getAllTracingModelPayloadEvents} from '../../helpers/TraceHelpers.js';

const {assert} = chai;

describeWithMockConnection('TimelineUIUtils', () => {
  let tracingModel: SDK.TracingModel.TracingModel;
  let process: SDK.TracingModel.Process;
  let thread: SDK.TracingModel.Thread;
  let target: SDK.Target.Target;
  const SCRIPT_ID = 'SCRIPT_ID';

  beforeEach(() => {
    target = createTarget();
    tracingModel = new SDK.TracingModel.TracingModel(new FakeStorage());
    process = new SDK.TracingModel.Process(tracingModel, 1);
    thread = new SDK.TracingModel.Thread(process, 1);
  });

  it('creates top frame location text for function calls', async () => {
    const event = new SDK.TracingModel.ConstructedEvent(
        'devtools.timeline', 'FunctionCall', TraceEngine.Types.TraceEvents.Phase.COMPLETE, 10, thread);

    event.addArgs({
      data: {
        functionName: 'test',
        url: 'test.js',
        scriptId: SCRIPT_ID,
        lineNumber: 0,
        columnNumber: 0,
      },
    });
    assert.strictEqual(
        'test.js:1:1', await Timeline.TimelineUIUtils.TimelineUIUtils.buildDetailsTextForTraceEvent(event));
  });

  it('creates top frame location text as a fallback', async () => {
    // 'TimerInstall' is chosen such that we run into the 'default' case.
    const event = new SDK.TracingModel.ConstructedEvent(
        'devtools.timeline', 'TimerInstall', TraceEngine.Types.TraceEvents.Phase.COMPLETE, 10, thread);

    event.addArgs({
      data: {
        stackTrace: [
          {
            functionName: 'test',
            url: 'test.js',
            scriptId: SCRIPT_ID,
            lineNumber: 0,
            columnNumber: 0,
          },
        ],
      },
    });
    const data = TimelineModel.TimelineModel.TimelineData.forEvent(event);
    data.stackTrace = event.args.data.stackTrace;
    assert.strictEqual(
        'test.js:1:1', await Timeline.TimelineUIUtils.TimelineUIUtils.buildDetailsTextForTraceEvent(event));
  });

  describe('script location as an URL', () => {
    let event: SDK.TracingModel.ConstructedEvent;
    beforeEach(() => {
      event = new SDK.TracingModel.ConstructedEvent(
          'devtools.timeline', TimelineModel.TimelineModel.RecordType.FunctionCall,
          TraceEngine.Types.TraceEvents.Phase.COMPLETE, 10, thread);

      event.addArgs({
        data: {
          functionName: 'test',
          url: 'https://google.com/test.js',
          scriptId: SCRIPT_ID,
          lineNumber: 0,
          columnNumber: 0,
        },
      });
      const data = TimelineModel.TimelineModel.TimelineData.forEvent(event);
      data.stackTrace = event.args.data.stackTrace;
    });
    it('makes the script location of a call frame a full URL when the inspected target is not the same the call frame was taken from (e.g. a loaded file)',
       async () => {
         target.setInspectedURL('https://not-google.com' as Platform.DevToolsPath.UrlString);
         const node = await Timeline.TimelineUIUtils.TimelineUIUtils.buildDetailsNodeForTraceEvent(event);
         if (!node) {
           throw new Error('Node was unexpectedly null');
         }
         assert.strictEqual(node.textContent, 'test @ google.com/test.js:1:1');
       });

    it('makes the script location of a call frame a script name when the inspected target is the one the call frame was taken from',
       async () => {
         target.setInspectedURL('https://google.com' as Platform.DevToolsPath.UrlString);
         const node = await Timeline.TimelineUIUtils.TimelineUIUtils.buildDetailsNodeForTraceEvent(event);
         if (!node) {
           throw new Error('Node was unexpectedly null');
         }
         assert.strictEqual(node.textContent, 'test @ /test.js:1:1');
       });
  });

  describe('adjusting timestamps for events and navigations', () => {
    it('adjusts the time for a DCL event after a navigation', async () => {
      const data = await allModelsFromFile('web-dev.json.gz');
      const allSDKEvents = getAllTracingModelPayloadEvents(data.tracingModel);
      const mainFrameID = data.timelineModel.mainFrameID();
      const dclSDKEvent = allSDKEvents.find(event => {
        return event.name === TimelineModel.TimelineModel.RecordType.MarkDOMContent &&
            mainFrameID === event.args.data.frame;
      });
      if (!dclSDKEvent) {
        throw new Error('Could not find DCL event');
      }

      // Round the time to 2DP to avoid needlessly long expectation numbers!
      const unAdjustedTime = (dclSDKEvent.startTime - data.timelineModel.minimumRecordTime()).toFixed(2);
      assert.strictEqual(unAdjustedTime, String(190.79));

      const adjustedTime = Timeline.TimelineUIUtils.timeStampForEventAdjustedForClosestNavigationIfPossible(
          dclSDKEvent, data.timelineModel, data.traceParsedData);
      assert.strictEqual(adjustedTime.toFixed(2), String(178.92));
    });

    it('falls back to the legacy model if the new data is not available', async () => {
      const data = await allModelsFromFile('web-dev.json.gz');
      const allSDKEvents = getAllTracingModelPayloadEvents(data.tracingModel);
      const lcpSDKEvent = allSDKEvents.find(event => {
        // Can use find here as this trace file only has one LCP Candidate
        return event.name === TimelineModel.TimelineModel.RecordType.MarkLCPCandidate && event.args.data.isMainFrame;
      });
      if (!lcpSDKEvent) {
        throw new Error('Could not find LCP event');
      }

      const adjustedLCPTime = Timeline.TimelineUIUtils.timeStampForEventAdjustedForClosestNavigationIfPossible(
          lcpSDKEvent,
          data.timelineModel,
          // Fake the new engine not being available by passing in null here.
          null,
      );
      assert.strictEqual(adjustedLCPTime.toFixed(2), String(118.44));
    });

    it('can adjust the times for events that are not PageLoad markers', async () => {
      const data = await allModelsFromFile('user-timings.json.gz');
      const allSDKEvents = getAllTracingModelPayloadEvents(data.tracingModel);
      // Use a performance.mark event. Exact event is unimportant except that
      // it should not be a Page Load event as those are covered by the tests
      // above.
      const userMark = allSDKEvents.find(event => {
        return event.hasCategory('blink.user_timing') && event.name === 'mark1';
      });
      if (!userMark) {
        throw new Error('Could not find user mark');
      }

      const adjustedMarkTime = Timeline.TimelineUIUtils.timeStampForEventAdjustedForClosestNavigationIfPossible(
          userMark, data.timelineModel, data.traceParsedData);
      assert.strictEqual(adjustedMarkTime.toFixed(2), String(79.88));
    });
  });
});
