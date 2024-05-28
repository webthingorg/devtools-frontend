// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {TraceLoader} from '../../../testing/TraceLoader.js';
import * as TraceModel from '../trace.js';

describe('SyntheticEvents', function() {
  describe('Initialization', () => {
    afterEach(() => {
      TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.reset();
    });
    it('does not throw when invoking getActiveManager after executing the trace engine', async function() {
      await TraceLoader.traceEngine(this, 'web-dev.json.gz');
      assert.doesNotThrow(TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager);
    });

    it('returns the last active SyntheticEventsManager with getActiveManager', async function() {
      await TraceLoader.traceEngine(this, 'web-dev.json.gz');
      const firstActiveManager = TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager();
      await TraceLoader.traceEngine(this, 'basic.json.gz');
      const secondActiveManager = TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager();
      assert.notEqual(firstActiveManager, secondActiveManager);
    });
    it('returns the SyntheticEventsManager for a given trace index with getManagerForTrace', async function() {
      await TraceLoader.traceEngine(this, 'web-dev.json.gz');
      const firstActiveManager = TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager();
      await TraceLoader.traceEngine(this, 'basic.json.gz');
      const testActiveManaget = TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getManagerForTrace(0);
      assert.strictEqual(firstActiveManager, testActiveManaget);
    });
  });

  describe('SyntheticBasedEvent registration', () => {
    it('stores synthetic based events at the same index as their corresponding raw event in the source array',
       async function() {
         const rawEvents = await TraceLoader.rawEvents(this, 'web-dev.json.gz');
         const traceData = await TraceLoader.traceEngine(this, 'web-dev.json.gz');
         const allSyntheticEvents =
             [...traceData.Animations.animations, ...traceData.NetworkRequests.byTime, ...traceData.Screenshots];
         const syntheticEventsManager = TraceModel.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager();
         for (const syntheticEvent of allSyntheticEvents) {
           const rawEventIndex = rawEvents.indexOf(syntheticEvent.rawSourceEvent);
           // Test synthetic events are stored in the correct position.
           assert.strictEqual(syntheticEventsManager.syntheticEventForRawEventIndex(rawEventIndex), syntheticEvent);
         }
         const allSyntheticEventsInManagerCount = syntheticEventsManager.allSyntheticEventsForTest().reduce(
             (count, event) => event !== undefined ? (count + 1) : 0, 0);
         // Test synthetic events are stored only once.
         assert.strictEqual(allSyntheticEventsInManagerCount, allSyntheticEvents.length);
       });
  });
});
