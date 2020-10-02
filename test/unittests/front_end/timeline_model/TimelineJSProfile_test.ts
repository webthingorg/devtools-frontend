// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../front_end/sdk/sdk.js';
import * as Common from '../../../../front_end/common/common.js';

import {resetSettingsStorage} from '../common/SettingsHelper.js';
import {TimelineJSProfileProcessor} from '../../../../front_end/timeline_model/TimelineJSProfile.js';

describe('TimelineJSProfile', () => {
  let tracingModel: SDK.TracingModel.TracingModel;
  let process: SDK.TracingModel.Process;
  let thread: SDK.TracingModel.Thread;

  before(() => {
    tracingModel = new SDK.TracingModel.TracingModel(new FakeStorage());
    process = new SDK.TracingModel.Process(tracingModel, 1);
    thread = new SDK.TracingModel.Thread(process, 1);
  });

  beforeEach(() => {
    const settings = resetSettingsStorage();
    // TODO(petermarshall): Avoid reaching into settings internals just to make module settings work.
    settings._moduleSettings.set(
        'showNativeFunctionsInJSProfile',
        settings.createSetting('showNativeFunctionsInJSProfile', true, Common.Settings.SettingStorageType.Global));
  });
  afterEach(resetSettingsStorage);

  it('generateJSFrameEvents returns an empty array for an empty input', () => {
    const events: SDK.TracingModel.Event[] = [];
    const returnedEvents = TimelineJSProfileProcessor.generateJSFrameEvents(events);
    assert.deepEqual(returnedEvents, []);
  });

  it('generateJSFrameEvents creates JS frame events with a top-level V8 invocation', () => {
    const callEvent = new SDK.TracingModel.Event('devtools.timeline', 'FunctionCall', 'X', 10, thread);
    callEvent.setEndTime(20);
    const sampleEvent = new SDK.TracingModel.Event('devtools.timeline', 'JSSample', 'I', 5, thread);
    sampleEvent.addArgs({data: {stackTrace: [{callFrame: {}}]}});
    const events: SDK.TracingModel.Event[] = [callEvent, sampleEvent];

    const returnedEvents = TimelineJSProfileProcessor.generateJSFrameEvents(events);
    assert.strictEqual(returnedEvents.length, 1);
    assert.strictEqual(returnedEvents[0].name, 'JSFrame');
    assert.strictEqual(returnedEvents[0].startTime, 5);
    assert.strictEqual(returnedEvents[0].endTime, 20);
  });

  it('generateJSFrameEvents creates JS frame events without a top-level V8 invocation', () => {
    const sampleEvent = new SDK.TracingModel.Event('devtools.timeline', 'JSSample', 'I', 5, thread);
    sampleEvent.addArgs({data: {stackTrace: [{callFrame: {}}]}});
    const events: SDK.TracingModel.Event[] = [sampleEvent];

    const returnedEvents = TimelineJSProfileProcessor.generateJSFrameEvents(events);
    assert.strictEqual(returnedEvents.length, 1);
    assert.strictEqual(returnedEvents[0].name, 'JSFrame');
    assert.strictEqual(returnedEvents[0].startTime, 5);
    assert.strictEqual(returnedEvents[0].endTime, 5);
  });
});

class FakeStorage extends SDK.TracingModel.BackingStorage {
  /**
   * @override
   */
  appendString() {
    throw new Error('Not implemented yet');
  }

  /**
   * @override
   */
  appendAccessibleString(): () => Promise<string|null> {
    throw new Error('Not implemented yet');
  }

  /**
   * @override
   */
  finishWriting() {
    throw new Error('Not implemented yet');
  }

  /**
   * @override
   */
  reset() {
    throw new Error('Not implemented yet');
  }
}
