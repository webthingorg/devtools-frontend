// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../../front_end/core/sdk/sdk.js';
import * as TraceEngine from '../../../../../front_end/models/trace/trace.js';
import {describeWithEnvironment} from '../../helpers/EnvironmentHelpers.js';
import {allModelsFromFile, loadModelDataFromTraceFile} from '../../helpers/TraceHelpers.js';

describeWithEnvironment('FilmStripModel', () => {
  it('parses out frames from a trace', async () => {
    const {tracingModel} = await allModelsFromFile('web-dev.json.gz');
    const filmStrip = new SDK.FilmStripModel.FilmStripModel(tracingModel);
    assert.strictEqual(filmStrip.frames().length, 5);
  });

  it('exposes the image for each frame', async () => {
    const {tracingModel} = await allModelsFromFile('web-dev.json.gz');
    const filmStrip = new SDK.FilmStripModel.FilmStripModel(tracingModel);
    const allImages = await Promise.all(filmStrip.frames().map(frame => {
      return frame.imageDataPromise();
    }));
    // Ensure that the image for each frame exists and returns a string.
    assert.isTrue(allImages.every(imageStr => imageStr && imageStr.length > 0));
  });

  it('returns the frame closest to the given timestamp', async () => {
    const {tracingModel} = await allModelsFromFile('web-dev.json.gz');
    const filmStrip = new SDK.FilmStripModel.FilmStripModel(tracingModel);
    const frameTimestamps = filmStrip.frames().map(frame => frame.timestamp);
    assert.deepEqual(frameTimestamps, [1020034823.345, 1020034961.883, 1020035045.298, 1020035061.981, 1020035112.03]);

    const timestampNearestFirstFrame = frameTimestamps[0] + 10;
    assert.strictEqual(filmStrip.frameByTimestamp(timestampNearestFirstFrame), filmStrip.frames().at(0));
    const timestampNearestThirdFrame = frameTimestamps[2] + 10;
    assert.strictEqual(filmStrip.frameByTimestamp(timestampNearestThirdFrame), filmStrip.frames().at(2));

    const timestampBeforeAnyFrames = frameTimestamps[0] - 100;
    assert.isNull(filmStrip.frameByTimestamp(timestampBeforeAnyFrames));
  });

  describe('FilmStrip backed by new trace engine', () => {
    it('identifies the frames from a trace', async () => {
      const traceParsedData = await loadModelDataFromTraceFile('web-dev.json.gz');
      const filmStrip = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      assert.lengthOf(filmStrip.frames, 5);
    });

    it('caches the film strip based on the trace data and the zero time', async () => {
      const traceParsedData = await loadModelDataFromTraceFile('web-dev.json.gz');
      const filmStrip1 = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      const filmStrip2 = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      // It is from cache so you get back the exact same object.
      assert.strictEqual(filmStrip1, filmStrip2);

      const filmStrip3 =
          SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData, TraceEngine.Types.Timing.MicroSeconds(0));
      const filmStrip4 =
          SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData, TraceEngine.Types.Timing.MicroSeconds(5));
      // Not equal as the calls had different start times.
      assert.notStrictEqual(filmStrip3, filmStrip4);
    });

    it('exposes the snapshot string for each frame', async () => {
      const traceParsedData = await loadModelDataFromTraceFile('web-dev.json.gz');
      const filmStrip = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      assert.isTrue(filmStrip.frames.every(frame => {
        return typeof frame.screenshotAsString === 'string' && frame.screenshotAsString.length > 0;
      }));
    });

    it('can use a custom zero time to filter out screenshots', async () => {
      const traceParsedData = await loadModelDataFromTraceFile('web-dev.json.gz');
      const filmStrip = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      // Set a custom zero time after the first screenshot and ensure that we now only have four events.
      const newCustomZeroTime = TraceEngine.Types.Timing.MicroSeconds(filmStrip.frames[0].screenshotEvent.ts + 1000);
      const newFilmStrip = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData, newCustomZeroTime);
      // Check that the new film strip is all the frames other than the first, now we have set a custom time.
      assert.deepEqual(newFilmStrip.frames.map(f => f.screenshotAsString), [
        filmStrip.frames[1].screenshotAsString,
        filmStrip.frames[2].screenshotAsString,
        filmStrip.frames[3].screenshotAsString,
        filmStrip.frames[4].screenshotAsString,
      ]);
    });

    it('can return the frame closest to a given timestamp', async () => {
      const traceParsedData = await loadModelDataFromTraceFile('web-dev.json.gz');
      const filmStrip = SDK.FilmStripModel.filmStripFromTraceEngine(traceParsedData);
      const frameTimestamps = filmStrip.frames.map(frame => frame.screenshotEvent.ts);
      assert.deepEqual(frameTimestamps, [1020034823345, 1020034961883, 1020035045298, 1020035061981, 1020035112030]);

      const timestampNearestFirstFrame = TraceEngine.Types.Timing.MicroSeconds(frameTimestamps[0] + 10);
      assert.strictEqual(
          SDK.FilmStripModel.filmStripFrameClosestToTimestamp(filmStrip, timestampNearestFirstFrame),
          filmStrip.frames.at(0));
      const timestampNearestThirdFrame = TraceEngine.Types.Timing.MicroSeconds(frameTimestamps[2] + 10);
      assert.strictEqual(
          SDK.FilmStripModel.filmStripFrameClosestToTimestamp(filmStrip, timestampNearestThirdFrame),
          filmStrip.frames.at(2));

      const timestampBeforeAnyFrames = TraceEngine.Types.Timing.MicroSeconds(frameTimestamps[0] - 100);
      assert.isNull(SDK.FilmStripModel.filmStripFrameClosestToTimestamp(filmStrip, timestampBeforeAnyFrames));
    });
  });

  describe('creating frames', () => {
    it('can create a frame from a screenshot snapshot event or a trace engine snapshot event and both are equivalent',
       async () => {
         const {tracingModel, traceParsedData} = await allModelsFromFile('web-dev.json.gz');
         const browserMain = SDK.TracingModel.TracingModel.browserMainThread(tracingModel);
         const sdkSnapshot = browserMain?.events().find(event => {
           return event.name === 'Screenshot';
         });
         if (!sdkSnapshot) {
           throw new Error('Could not find expected screenshot event');
         }
         const traceEngineSnapshot = traceParsedData.Screenshots.at(0);
         if (!traceEngineSnapshot) {
           throw new Error('Could not find expected screenshot event');
         }
         const filmStrip = new SDK.FilmStripModel.FilmStripModel(tracingModel);
         const frameFromSDK =
             SDK.FilmStripModel.Frame.fromSnapshot(filmStrip, sdkSnapshot as SDK.TracingModel.ObjectSnapshot, 0);
         const frameFromTrace = SDK.FilmStripModel.Frame.fromTraceEvent(filmStrip, traceEngineSnapshot, 0);
         const imageDataSDK = await frameFromSDK.imageDataPromise();
         const imageDataTrace = await frameFromTrace.imageDataPromise();
         assert.typeOf(imageDataSDK, 'string');
         assert.typeOf(imageDataTrace, 'string');
         assert.strictEqual(imageDataTrace, imageDataSDK);
       });
  });
});
