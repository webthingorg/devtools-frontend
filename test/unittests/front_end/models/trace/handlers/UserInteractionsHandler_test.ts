// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {loadEventsFromTraceFile, setTraceModelTimeout} from '../../../helpers/TraceHelpers.js';

describe('UserInteractions', function() {
  setTraceModelTimeout(this);
  beforeEach(async () => {
    TraceModel.Handlers.ModelHandlers.UserInteractions.reset();
  });

  describe('error handling', () => {
    it('throws if not initialized', async () => {
      // Finalize the handler by calling data and then finalize on it.
      TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      await TraceModel.Handlers.ModelHandlers.UserInteractions.finalize();

      assert.throws(() => {
        const fakeEvent = {} as TraceModel.Types.TraceEvents.TraceEventData;
        TraceModel.Handlers.ModelHandlers.UserInteractions.handleEvent(fakeEvent);
      }, 'Handler is not initialized');
    });
  });

  it('returns all user interactions', async () => {
    const traceEvents = await loadEventsFromTraceFile('slow-interaction-button-click.json.gz');
    for (const event of traceEvents) {
      TraceModel.Handlers.ModelHandlers.UserInteractions.handleEvent(event);
    }

    const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
    const clicks = data.allEvents.filter(event => {
      if (!event.args.data) {
        return false;
      }

      return event.args.data.type === 'click';
    });

    assert.strictEqual(data.allEvents.length, 58);
    assert.strictEqual(clicks.length, 1);
  });

  describe('interactions', () => {
    async function processTrace(path: string): Promise<void> {
      const traceEvents = await loadEventsFromTraceFile(path);
      for (const event of traceEvents) {
        TraceModel.Handlers.ModelHandlers.UserInteractions.handleEvent(event);
      }
      await TraceModel.Handlers.ModelHandlers.UserInteractions.finalize();
    }

    it('returns all interaction events', async () => {
      await processTrace('slow-interaction-button-click.json.gz');
      const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      // There are three inct interactions:
      // pointerdown on the button (start of the click)
      // pointerup & click on the button (end of the click)
      assert.strictEqual(data.interactionEvents.length, 3);
    });

    it('identifies the longest interaction', async () => {
      await processTrace('slow-interaction-keydown.json.gz');
      const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      assert.lengthOf(data.interactionEvents, 5);

      const expectedLongestEvent = data.interactionEvents.find(event => {
        return event.type === 'keydown' && event.interactionId === 7378;
      });
      assert.isNotNull(expectedLongestEvent);
      assert.strictEqual(data.longestInteractionEvent, expectedLongestEvent);
    });

    it('sets the `dur` key on each event by finding the begin and end events and subtracting the ts', async () => {
      await processTrace('slow-interaction-button-click.json.gz');
      const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      for (const syntheticEvent of data.interactionEvents) {
        assert.strictEqual(
            syntheticEvent.dur, syntheticEvent.args.data.endEvent.ts - syntheticEvent.args.data.beginEvent.ts);
      }
    });

    it('gets the right interaction IDs for each interaction', async () => {
      await processTrace('slow-interaction-button-click.json.gz');
      const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      assert.deepEqual(data.interactionEvents.map(i => i.interactionId), [
        // pointerdown, pointerup and click are all from the same interaction
        1540,
        1540,
        1540,
      ]);
    });

    it('gets the right interaction IDs for a keypress interaction', async () => {
      await processTrace('slow-interaction-keydown.json.gz');
      const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();
      assert.deepEqual(data.interactionEvents.map(i => i.interactionId), [
        // pointerdown from clicking on the input
        7371,
        // pointerup from clicking on the input
        7371,
        // click from clicking on the input
        7371,
        // keydown from typing character
        7378,
        // keyup from typing character
        7378,
      ]);
    });
  });
});
