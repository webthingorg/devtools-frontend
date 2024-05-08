// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';
import {getMainThread} from '../../testing/TraceHelpers.js';
import {TraceLoader} from '../../testing/TraceLoader.js';

import * as Timeline from './timeline.js';

describeWithEnvironment('TimelineFilters', () => {
  describe('IsLong', () => {
    it('returns true if the event is longer than the defined duration for a new engine event', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'one-second-interaction.json.gz');
      const longEvent = getMainThread(traceParsedData.Renderer).entries.find(event => {
        return event.dur &&
            event.dur >
            TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(50));
      });
      if (!longEvent) {
        throw new Error('Could not find expected long event.');
      }

      const filter = new Timeline.TimelineFilters.IsLong();
      filter.setMinimumRecordDuration(TraceEngine.Types.Timing.MilliSeconds(50));
      assert.isTrue(filter.accept(longEvent));
    });

    it('returns false if the event is shorter than the defined duration for a new engine event', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'one-second-interaction.json.gz');
      const longEvent = getMainThread(traceParsedData.Renderer).entries.find(event => {
        return event.dur &&
            event.dur >
            TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(50)) &&
            event.dur <
            TraceEngine.Helpers.Timing.millisecondsToMicroseconds(TraceEngine.Types.Timing.MilliSeconds(100));
      });
      if (!longEvent) {
        throw new Error('Could not find expected long event.');
      }

      const filter = new Timeline.TimelineFilters.IsLong();
      filter.setMinimumRecordDuration(TraceEngine.Types.Timing.MilliSeconds(101));
      assert.isFalse(filter.accept(longEvent));
    });
  });

  describe('Category', () => {
    it('returns false for a new event if it has a category that is hidden', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'user-timings.json.gz');
      // These events are usually visible, so make the category hidden before
      // running this test.
      Timeline.EventUICategory.getCategoryStyles()['scripting'].hidden = true;

      const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
      if (!userTimingEvent) {
        throw new Error('Could not find expected event.');
      }
      const filter = new Timeline.TimelineFilters.Category();
      assert.isFalse(filter.accept(userTimingEvent));
      Timeline.EventUICategory.getCategoryStyles()['scripting'].hidden = false;
    });

    it('returns true for a new event if it has a category that is visible', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'user-timings.json.gz');
      const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
      if (!userTimingEvent) {
        throw new Error('Could not find expected event.');
      }
      const filter = new Timeline.TimelineFilters.Category();
      assert.isTrue(filter.accept(userTimingEvent));
      Timeline.EventUICategory.getCategoryStyles()['scripting'].hidden = false;
    });
  });

  describe('TimelineVisibleEventsFilter', () => {
    it('accepts events that are set in the constructor and rejects other events', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'user-timings.json.gz');
      const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
      assert.isOk(userTimingEvent);

      const visibleFilter = new Timeline.TimelineFilters.TimelineVisibleEventsFilter([
        // Set an random record type to be visible - the exact type is not important for the test.
        TraceEngine.Types.TraceEvents.KnownEventName.UserTiming,
      ]);

      assert.isTrue(visibleFilter.accept(userTimingEvent));
    });

    describe('eventType', () => {
      it('returns ConsoleTime if the event has the blink.console category', async function() {
        const traceParsedData = await TraceLoader.traceEngine(this, 'timings-track.json.gz');
        const consoleTimingEvent = (traceParsedData.UserTimings.consoleTimings).at(0);
        assert.isOk(consoleTimingEvent);
        assert.strictEqual(
            Timeline.TimelineFilters.TimelineVisibleEventsFilter.eventType(consoleTimingEvent),
            TraceEngine.Types.TraceEvents.KnownEventName.ConsoleTime);
      });

      it('returns UserTiming if the event has the blink.user_timing category', async function() {
        const traceParsedData = await TraceLoader.traceEngine(this, 'timings-track.json.gz');
        const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
        assert.isOk(userTimingEvent);
        assert.strictEqual(
            Timeline.TimelineFilters.TimelineVisibleEventsFilter.eventType(userTimingEvent),
            TraceEngine.Types.TraceEvents.KnownEventName.UserTiming);
      });

      it('returns the event name if the event is any other category', async function() {
        const traceParsedData = await TraceLoader.traceEngine(this, 'cls-single-frame.json.gz');
        const layoutShiftEvent = traceParsedData.LayoutShifts.clusters.at(0)?.events.at(0);
        assert.isOk(layoutShiftEvent);
        assert.strictEqual(
            Timeline.TimelineFilters.TimelineVisibleEventsFilter.eventType(layoutShiftEvent),
            TraceEngine.Types.TraceEvents.KnownEventName.LayoutShift);
      });
    });
  });

  describe('TimelineInvisibleEventsFilter', () => {
    it('does not accept events that have been set as invisible', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'user-timings.json.gz');
      const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
      assert.isOk(userTimingEvent);

      const invisibleFilter = new Timeline.TimelineFilters.TimelineInvisibleEventsFilter([
        TraceEngine.Types.TraceEvents.KnownEventName.UserTiming,

      ]);
      assert.isFalse(invisibleFilter.accept(userTimingEvent));
    });

    it('accepts events that have not been set as invisible', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'cls-single-frame.json.gz');
      const layoutShiftEvent = traceParsedData.LayoutShifts.clusters.at(0)?.events.at(0);
      assert.isOk(layoutShiftEvent);

      const invisibleFilter = new Timeline.TimelineFilters.TimelineInvisibleEventsFilter([
        TraceEngine.Types.TraceEvents.KnownEventName.UserTiming,

      ]);
      assert.isTrue(invisibleFilter.accept(layoutShiftEvent));
    });
  });

  describe('ExclusiveNameFilter', () => {
    it('accepts events that do not match the provided set of names to exclude', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'user-timings.json.gz');
      const userTimingEvent = (traceParsedData.UserTimings.performanceMeasures).at(0);
      assert.isOk(userTimingEvent);

      const filter = new Timeline.TimelineFilters.ExclusiveNameFilter([
        TraceEngine.Types.TraceEvents.KnownEventName.LayoutShift,
      ]);
      assert.isTrue(filter.accept(userTimingEvent));
    });

    it('rejects events that match the provided set of names to exclude', async function() {
      const traceParsedData = await TraceLoader.traceEngine(this, 'cls-single-frame.json.gz');
      const layoutShiftEvent = traceParsedData.LayoutShifts.clusters.at(0)?.events.at(0);
      assert.isOk(layoutShiftEvent);

      const filter = new Timeline.TimelineFilters.ExclusiveNameFilter([
        TraceEngine.Types.TraceEvents.KnownEventName.LayoutShift,
      ]);
      assert.isFalse(filter.accept(layoutShiftEvent));
    });
  });
});
