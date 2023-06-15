// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceModel from '../../../../../../front_end/models/trace/trace.js';
import {loadEventsFromTraceFile} from '../../../helpers/TraceHelpers.js';

describe('GPUHandler', () => {
  beforeEach(() => {
    TraceModel.Handlers.Meta.initialize();
    TraceModel.Handlers.GPU.initialize();
  });

  it('finds all the GPU Tasks for the main GPU Thread', async () => {
    const events = await loadEventsFromTraceFile('threejs-gpu.json.gz');

    for (const event of events) {
      TraceModel.Handlers.Meta.handleEvent(event);
      TraceModel.Handlers.GPU.handleEvent(event);
    }
    await TraceModel.Handlers.Meta.finalize();
    await TraceModel.Handlers.GPU.finalize();

    const gpuEvents = TraceModel.Handlers.GPU.data().mainGPUThreadTasks;
    assert.lengthOf(gpuEvents, 201);
  });
});
