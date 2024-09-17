// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Trace from '../../trace.js';
import * as Lantern from '../lantern.js';

function toLanternTrace(traceEvents: readonly Trace.Types.Events.Event[]): Lantern.Types.Trace {
  return {
    traceEvents: traceEvents as unknown as Lantern.Types.TraceEvent[],
  };
}

async function runTraceEngine(trace: Lantern.Types.Trace) {
  const processor = Trace.Processor.TraceProcessor.createWithAllHandlers();
  await processor.parse(trace.traceEvents as Trace.Types.Events.Event[]);
  if (!processor.parsedTrace) {
    throw new Error('No data');
  }
  return processor.parsedTrace;
}

async function getComputationDataFromFixture({trace, settings, url}: {
  trace: Lantern.Types.Trace,
  settings?: Lantern.Types.Simulation.Settings,
  url?: Lantern.Types.Simulation.URL,
}) {
  settings = settings ?? {} as Lantern.Types.Simulation.Settings;
  if (!settings.throttlingMethod) {
    settings.throttlingMethod = 'simulate';
  }
  const traceEngineData = await runTraceEngine(trace);
  const requests = Trace.LanternComputationData.createNetworkRequests(trace, traceEngineData);
  const networkAnalysis = Lantern.Core.NetworkAnalyzer.analyze(requests);
  const frameId = traceEngineData.Meta.mainFrameId;
  const navigationId = traceEngineData.Meta.mainFrameNavigations[0].args.data?.navigationId;
  if (!navigationId) {
    throw new Error('no navigation id found');
  }

  return {
    simulator: Lantern.Simulation.Simulator.createSimulator({...settings, networkAnalysis}),
    graph: Trace.LanternComputationData.createGraph(requests, trace, traceEngineData, url),
    processedNavigation: Trace.LanternComputationData.createProcessedNavigation(traceEngineData, frameId, navigationId),
  };
}

export {
  toLanternTrace,
  runTraceEngine,
  getComputationDataFromFixture,
};
