// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getMainThread} from '../../../testing/TraceHelpers.js';
import {TraceLoader} from '../../../testing/TraceLoader.js';
import * as TraceEngine from '../trace.js';

import * as Helpers from './helpers.js';

describe('StyleSelectors', () => {
  it('returns the set of UpdateLayoutTree events within the right time range', async function() {
    const traceParsedData = await TraceLoader.traceEngine(this, 'selector-stats.json.gz');
    const mainThread = getMainThread(traceParsedData.Renderer);
    const foundEvents = Helpers.StyleSelectors.findUpdateLayoutTreeEvents(
        mainThread.entries,
        traceParsedData.Meta.traceBounds.min,
    );
    assert.lengthOf(foundEvents, 11);

    const lastEvent = foundEvents.at(-1);
    assert.isOk(lastEvent);

    // Check we can filter by endTime by making the endTime less than the start
    // time of the last event:
    const filteredByEndTimeEvents = Helpers.StyleSelectors.findUpdateLayoutTreeEvents(
        mainThread.entries,
        traceParsedData.Meta.traceBounds.min,
        TraceEngine.Types.Timing.MicroSeconds(lastEvent.ts - 1_000),
    );
    assert.lengthOf(filteredByEndTimeEvents, 10);
  });
});
