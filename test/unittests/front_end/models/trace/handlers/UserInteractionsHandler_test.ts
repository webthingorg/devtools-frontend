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

  describe('parsing', () => {
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

    describe('collapsing nested interactions', () => {
      function makeFakeInteraction(options: {startTime: number, endTime: number, interactionId: number}):
          TraceModel.Types.TraceEvents.SyntheticInteractionEvent {
        const event = {
          name: 'EventTiming',
          type: 'pointerdown',
          ts: TraceModel.Types.Timing.MicroSeconds(options.startTime),
          dur: TraceModel.Types.Timing.MicroSeconds(options.endTime - options.startTime),
          interactionId: options.interactionId,
        };

        return event as unknown as TraceModel.Types.TraceEvents.SyntheticInteractionEvent;
      }

      const {removeNestedInteractions} = TraceModel.Handlers.ModelHandlers.UserInteractions;

      it('removes interactions that have the same end time but are not the first event in that block', () => {
        /**
         * ========A=============
         *   ===========B========
         *   ===========C========
         *         =====D========
         */
        const eventA = makeFakeInteraction({startTime: 0, endTime: 10, interactionId: 1});
        const eventB = makeFakeInteraction({startTime: 2, endTime: 10, interactionId: 2});
        const eventC = makeFakeInteraction({startTime: 4, endTime: 10, interactionId: 3});
        const eventD = makeFakeInteraction({startTime: 6, endTime: 10, interactionId: 4});
        const result = removeNestedInteractions([eventA, eventB, eventC, eventD]);
        assert.deepEqual(result, [eventA]);
      });

      it('does not remove interactions that overlap but have a different end time', () => {
        /**
         * ========A=============
         *   ===========B========
         *   ===========C========
         *         =====D================
         */
        const eventA = makeFakeInteraction({startTime: 0, endTime: 10, interactionId: 1});
        const eventB = makeFakeInteraction({startTime: 2, endTime: 10, interactionId: 2});
        const eventC = makeFakeInteraction({startTime: 4, endTime: 10, interactionId: 3});
        const eventD = makeFakeInteraction({startTime: 6, endTime: 20, interactionId: 4});
        const result = removeNestedInteractions([eventA, eventB, eventC, eventD]);
        assert.deepEqual(result, [eventA, eventD]);
      });

      it('correctly identifies nested events when their parent overlaps with multiple events', () => {
        /**
         * Here although it does not look like it on first glance, C is nested
         * within B and should therefore be hidden. Similarly, D is nested within A and
         * so should be hidden.
         *
         * ========A====== ======C====
         *   ===========B=============
         *   ======D======
         */
        const eventA = makeFakeInteraction({startTime: 0, endTime: 5, interactionId: 1});
        const eventB = makeFakeInteraction({startTime: 2, endTime: 20, interactionId: 2});
        const eventC = makeFakeInteraction({startTime: 10, endTime: 20, interactionId: 3});
        const eventD = makeFakeInteraction({startTime: 2, endTime: 5, interactionId: 3});
        const result = removeNestedInteractions([eventA, eventB, eventC, eventD]);
        assert.deepEqual(result, [eventA, eventB]);
      });

      it('returns the events in timestamp order', () => {
        /**
         * None of the events below overlap at all, this test makes sure that the order of events does not change.
         */
        const eventA = makeFakeInteraction({startTime: 0, endTime: 5, interactionId: 1});
        const eventB = makeFakeInteraction({startTime: 10, endTime: 20, interactionId: 2});
        const eventC = makeFakeInteraction({startTime: 30, endTime: 40, interactionId: 3});
        const eventD = makeFakeInteraction({startTime: 50, endTime: 60, interactionId: 4});
        const result = removeNestedInteractions([eventA, eventB, eventC, eventD]);
        assert.deepEqual(result, [eventA, eventB, eventC, eventD]);
      });

      it('can remove nested interactions in a real trace', async () => {
        await processTrace('nested-interactions.json.gz');
        const data = TraceModel.Handlers.ModelHandlers.UserInteractions.data();

        const visibleEventInteractionIds = data.interactionEventsWithNoNesting.map(event => {
          return `${event.type}:${event.interactionId}`;
        });

        // Note: it is very hard to explain in comments all these assertions, so
        // it is highly recommended that you load the trace file above into
        // DevTools to look at the timeline whilst working on this test.

        /**
         * This is a block of events with identical end times, so only the
         * first should be kept:
         * =====[keydown 3579]====
         *    ==[keydown 3558]====
         *       =[keyup 3558]====
         **/
        assert.isTrue(visibleEventInteractionIds.includes('keydown:3579'));
        assert.isFalse(visibleEventInteractionIds.includes('keydown:3558'));
        assert.isFalse(visibleEventInteractionIds.includes('keyup:3558'));

        /** This is a slightly offset block of events:
         * ====[keydown 3572]=====
         *    =[keydown 3565]=====
         *          ====[keydown 3586]========
         * In this test we want to make sure that 3565 is collapsed, but the
         * others are not.
         **/
        assert.isTrue(visibleEventInteractionIds.includes('keydown:3572'));
        assert.isTrue(visibleEventInteractionIds.includes('keydown:3586'));
        assert.isFalse(visibleEventInteractionIds.includes('keydown:3565'));

        /** This is a block of events that have offset overlaps:
         * ====[keydown 3614]=====  =====[keydown 3621]======
         *       =====[keydown 3628]=========================
         * In this test we want to make sure that 3621 is collapsed as it fits
         * iwthin 3628, but 3614 is not collapsed.
         **/
        assert.isTrue(visibleEventInteractionIds.includes('keydown:3614'));
        assert.isTrue(visibleEventInteractionIds.includes('keydown:3628'));
        assert.isFalse(visibleEventInteractionIds.includes('keydown:3621'));
      });
    });
  });
});
