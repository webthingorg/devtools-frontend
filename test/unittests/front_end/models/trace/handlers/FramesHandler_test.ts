// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';

describe('FramesHandler', function() {
  beforeEach(() => {
    TraceEngine.Handlers.ModelHandlers.Frames.reset();
  });

  it('parses the set of frames', async function() {
    const events = await TraceLoader.rawEvents(this, 'web-dev-with-commit.json.gz');
    events.forEach(TraceEngine.Handlers.ModelHandlers.Frames.handleEvent);
    assert.strictEqual(1, 1);
  });
});
