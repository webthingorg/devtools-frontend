// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';

describe('AnimationHandler', function() {
  it('finds animation events', async function() {
    const events = await TraceLoader.rawEvents(this, 'animation.json.gz');

    for (const event of events) {
      TraceModel.Handlers.ModelHandlers.Animation.handleEvent(event);
    }

    await TraceModel.Handlers.ModelHandlers.Animation.finalize();

    const animationEvents = TraceModel.Handlers.ModelHandlers.Animation.data().animations;
    assert.lengthOf(animationEvents, 5);
  });

  it('checks event length', async function() {
    const events = await TraceLoader.rawEvents(this, 'animation.json.gz');

    for (const event of events) {
      TraceModel.Handlers.ModelHandlers.Animation.handleEvent(event);
    }

    await TraceModel.Handlers.ModelHandlers.Animation.finalize();

    const eventDuration = TraceModel.Handlers.ModelHandlers.Animation.data().animationsSynteticEvents[0].dur;
    assert.strictEqual(eventDuration, 2006450);
  });
});
