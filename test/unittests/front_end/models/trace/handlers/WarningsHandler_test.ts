// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const {assert} = chai;
import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';

describe.only('WarningsHandler', function() {
  beforeEach(() => {
    TraceEngine.Handlers.ModelHandlers.Warnings.reset();
  });

  it('identifies long tasks', async () => {
    const events = await TraceLoader.rawEvents(this, 'slow-interaction-keydown.json.gz');
    for (const event of events) {
      TraceEngine.Handlers.ModelHandlers.Warnings.handleEvent(event);
    }
    const data = TraceEngine.Handlers.ModelHandlers.Warnings.data();
    // We expect one long task.
    assert.strictEqual(data.perEvent.size, 1);
    const event = Array.from(data.perEvent.keys()).at(0);
    assert.strictEqual(event?.name, TraceEngine.Types.TraceEvents.KnownEventName.RunTask);
  });

  it('identifies idle callbacks that ran over the allotted time', async () => {
    const events = await TraceLoader.rawEvents(this, 'idle-callback.json.gz');
    for (const event of events) {
      TraceEngine.Handlers.ModelHandlers.Warnings.handleEvent(event);
    }
    const data = TraceEngine.Handlers.ModelHandlers.Warnings.data();
    const longIdleCallbacks = data.perWarning.get('IDLE_CALLBACK_OVER_TIME') || [];
    assert.lengthOf(longIdleCallbacks, 1);
    const event = longIdleCallbacks[0];
    assert.deepEqual(data.perEvent.get(event), ['IDLE_CALLBACK_OVER_TIME']);
  });

  it('identifies layout events that take over 10ms', async () => {
    const events = await TraceLoader.rawEvents(this, 'large-layout-small-recalc.json.gz');
    for (const event of events) {
      TraceEngine.Handlers.ModelHandlers.Warnings.handleEvent(event);
    }
    const data = TraceEngine.Handlers.ModelHandlers.Warnings.data();
    const forcedLayout = data.perWarning.get('FORCED_LAYOUT') || [];
    assert.lengthOf(forcedLayout, 1);
    const event = forcedLayout[0];
    assert.deepEqual(data.perEvent.get(event), ['FORCED_LAYOUT']);
  });
});
