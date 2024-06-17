// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as TraceModel from '../../trace.js';
import * as Lantern from '../lantern.js';

async function runTraceEngine(traceEvents: TraceModel.Types.TraceEvents.TraceEventData[]) {
  const processor = TraceModel.Processor.TraceProcessor.createWithAllHandlers();
  await processor.parse(traceEvents);
  if (!processor.traceParsedData) {
    throw new Error('No data');
  }
  return processor.traceParsedData;
}

async function getComputationDataFromFixture(
    {trace, settings, URL}:
        {trace: Lantern.Trace, settings?: Lantern.Simulation.Settings, URL?: Lantern.Simulation.URL}) {
  settings = settings ?? {} as Lantern.Simulation.Settings;
  if (!settings.throttlingMethod) {
    settings.throttlingMethod = 'simulate';
  }
  const traceEngineData = await runTraceEngine(
      trace.traceEvents as TraceModel.Types.TraceEvents.TraceEventData[],
  );
  const requests = Lantern.TraceEngineComputationData.createNetworkRequests(trace, traceEngineData);
  const networkAnalysis = Lantern.Simulation.NetworkAnalyzer.analyze(requests);

  return {
    simulator: Lantern.Simulation.Simulator.createSimulator({...settings, networkAnalysis}),
    graph: Lantern.TraceEngineComputationData.createGraph(requests, trace, traceEngineData, URL),
    processedNavigation: Lantern.TraceEngineComputationData.createProcessedNavigation(traceEngineData),
  };
}

export {
  runTraceEngine,
  getComputationDataFromFixture,
};
