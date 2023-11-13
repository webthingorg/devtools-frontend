// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import {describeWithEnvironment} from '../../../helpers/EnvironmentHelpers.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';
import {makeCompleteEvent} from '../../../helpers/TraceHelpers.js';
import type * as Protocol from '../../../../../../front_end/generated/protocol.js';

function makeBeginFrame(config: {
  frameSeqId: number,
  layerTreeId: number,
}): TraceEngine.Types.TraceEvents.TraceEventBeginFrame {
  return {
    args: {frameSeqId: config.frameSeqId, layerTreeId: config.layerTreeId},
    cat: 'disabled-by-default-devtools.timeline.frame',
    name: TraceEngine.Types.TraceEvents.KnownEventName.BeginFrame,
    ph: TraceEngine.Types.TraceEvents.Phase.INSTANT,
    pid: 1 as TraceEngine.Types.TraceEvents.ProcessID,
    s: TraceEngine.Types.TraceEvents.TraceEventScope.THREAD,
    tid: 1 as TraceEngine.Types.TraceEvents.ThreadID,
    ts: TraceEngine.Types.Timing.MicroSeconds(100),
  };
}

describe('FramesParser', () => {
  beforeEach(() => {
    TraceEngine.Handlers.ModelHandlers.Frames.reset();
  });

  it('creates a pending frame from a begin frame event', async function() {
    const event = makeBeginFrame({
      frameSeqId: 1,
      layerTreeId: 1,
    });
    const parser = new TraceEngine.Helpers.FramesParser.FramesParser([event]);
    parser.run();
    assert.deepEqual(
        parser.inspectState().beginFramesBySequenceId.get(1),
        {
          isPartial: false,
          seqId: 1,
          ts: event.ts,
          dur: TraceEngine.Types.Timing.MicroSeconds(0),
          status: 'PENDING',
        },
    );
  });
});
