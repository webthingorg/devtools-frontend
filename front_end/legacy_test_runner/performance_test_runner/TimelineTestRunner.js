// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Trace from '../../models/trace/trace.js';
import * as Timeline from '../../panels/timeline/timeline.js';

/**
 * @fileoverview using private properties isn't a Closure violation in tests.
 */
self.PerformanceTestRunner = self.PerformanceTestRunner || {};

PerformanceTestRunner.traceEngineParsedData = function() {
  return Timeline.TimelinePanel.TimelinePanel.instance().getTraceEngineDataForLayoutTests();
};
PerformanceTestRunner.traceEngineRawEvents = function() {
  return Timeline.TimelinePanel.TimelinePanel.instance().getTraceEngineRawTraceEventsForLayoutTests();
};

// NOTE: if you are here and trying to use this method, please think first if
// you can instead add a unit test to the DevTools repository. That is
// preferred to layout tests, if possible.
PerformanceTestRunner.createTraceEngineDataFromEvents = async function(events) {
  const model = Trace.TraceModel.Model.createWithAllHandlers(Trace.Types.Configuration.defaults());
  await model.parse(events);
  // Model only has one trace, so we can hardcode 0 here to get the latest
  // result.
  return model.traceParsedData(0);
};
