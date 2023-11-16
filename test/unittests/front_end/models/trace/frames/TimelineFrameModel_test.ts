// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as TraceEngine from '../../../../../../front_end/models/trace/trace.js';
import {describeWithMockConnection, setMockConnectionResponseHandler} from '../../../helpers/MockConnection.js';
import * as SDK from '../../../../../../front_end/core/sdk/sdk.js';
import {createTarget} from '../../../helpers/EnvironmentHelpers.js';
import {TraceLoader} from '../../../helpers/TraceLoader.js';

describeWithMockConnection('new-TimelineFrameModel', () => {
  it('can parse out a trace and return the frames', async function() {
    const target = createTarget();
    const rawEvents = await TraceLoader.rawEvents(this, 'web-dev-with-commit.json.gz');
    const traceParsedData = await TraceLoader.traceEngine(this, 'web-dev-with-commit.json.gz');
    const frameModel = new TraceEngine.Frames.TimelineFrameModel.TimelineFrameModel(target, rawEvents, traceParsedData);

    const parsedFrames = frameModel.getFrames();
    assert.lengthOf(frameModel.getFrames(), 18);

    // Assert a couple of frames to check the data, including one that is partial and was dropped.
    assert.strictEqual(parsedFrames[0].startTime, 122411104714);
    assert.strictEqual(parsedFrames[0].duration, 37847);
    assert.isFalse(parsedFrames[0].isPartial);
    assert.isFalse(parsedFrames[0].isPartial);

    assert.strictEqual(parsedFrames[2].startTime, 122411159244);
    assert.strictEqual(parsedFrames[2].duration, 16683);
    assert.isTrue(parsedFrames[2].isPartial);
    assert.isTrue(parsedFrames[2].dropped);
  });

  it('can create LayerPaintEvents from Paint and snapshot events', async function() {
    // Advanced instrumentation trace file is large: allow the bots more time
    // to process it.
    this.timeout(20_000);

    const target = createTarget();
    const rawEvents = await TraceLoader.rawEvents(this, 'web-dev-with-advanced-instrumentation.json.gz');
    const traceParsedData = await TraceLoader.traceEngine(this, 'web-dev-with-advanced-instrumentation.json.gz');
    const frameModel = new TraceEngine.Frames.TimelineFrameModel.TimelineFrameModel(target, rawEvents, traceParsedData);

    assert.lengthOf(frameModel.getFrames(), 25);
    const frameWithPaints = frameModel.getFrames().at(2);
    if (!frameWithPaints) {
      throw new Error('Could not find frame at index 2');
    }
    // Check we have the right one.
    assert.strictEqual(frameWithPaints.seqId, 1127448);
    assert.lengthOf(frameWithPaints.paints, 7);
  });

  it('can load the full snapshot from CDP', async function() {
    // Advanced instrumentation trace file is large: allow the bots more time
    // to process it.
    this.timeout(20_000);
    // https://chromedevtools.github.io/devtools-protocol/tot/LayerTree/#method-loadSnapshot
    setMockConnectionResponseHandler('LayerTree.loadSnapshot', async () => {
      return {
        snapshotId: 'fake-snapshot-123',
      };
    });
    // Advanced instrumentation trace file is large: allow the bots more time
    // to process it.
    this.timeout(20_000);

    const target = createTarget();
    const rawEvents = await TraceLoader.rawEvents(this, 'web-dev-with-advanced-instrumentation.json.gz');
    const traceParsedData = await TraceLoader.traceEngine(this, 'web-dev-with-advanced-instrumentation.json.gz');
    const frameModel = new TraceEngine.Frames.TimelineFrameModel.TimelineFrameModel(target, rawEvents, traceParsedData);

    assert.lengthOf(frameModel.getFrames(), 25);
    const frameWithPaints = frameModel.getFrames().at(2);
    const paintEvent = frameWithPaints?.paints.at(0);
    if (!paintEvent) {
      throw new Error('Could not find paint event.');
    }
    const result = await paintEvent.snapshotPromise();
    assert.instanceOf(result?.snapshot, SDK.PaintProfiler.PaintProfilerSnapshot);
  });
});
