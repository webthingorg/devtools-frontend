// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Lantern from '../lantern.js';
import {Extras} from '../Metric.js';

type Node = Lantern.Node;

class MaxPotentialFID extends Lantern.Metric {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get COEFFICIENTS(): Lantern.Simulation.MetricCoefficients {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  static getOptimisticGraph(dependencyGraph: Node): Node {
    return dependencyGraph;
  }

  static getPessimisticGraph(dependencyGraph: Node): Node {
    return dependencyGraph;
  }

  static getEstimateFromSimulation(simulation: Lantern.Simulation.Result, extras: Extras): Lantern.Simulation.Result {
    if (!extras.fcpResult) {
      throw new Error('missing fcpResult');
    }

    // Intentionally use the opposite FCP estimate, a more pessimistic FCP means that more tasks
    // are excluded from the FID computation, so a higher FCP means lower FID for same work.
    const fcpTimeInMs = extras.optimistic ? extras.fcpResult.pessimisticEstimate.timeInMs :
                                            extras.fcpResult.optimisticEstimate.timeInMs;

    const timings = MaxPotentialFID.getTimingsAfterFCP(
        simulation.nodeTimings,
        fcpTimeInMs,
    );

    return {
      timeInMs: Math.max(...timings.map(timing => timing.duration), 16),
      nodeTimings: simulation.nodeTimings,
    };
  }

  static compute(
      data: Lantern.Simulation.MetricComputationDataInput,
      extras?: Omit<import('../Metric.js').Extras, 'optimistic'>): Promise<Lantern.Metrics.Result> {
    const fcpResult = extras?.fcpResult;
    if (!fcpResult) {
      throw new Error('FCP is required to calculate the Max Potential FID metric');
    }

    return super.compute(data, extras);
  }

  static getTimingsAfterFCP(nodeTimings: Lantern.Simulation.Result['nodeTimings'], fcpTimeInMs: number):
      Array<{duration: number}> {
    return Array.from(nodeTimings.entries())
        .filter(([node, timing]) => node.type === Lantern.BaseNode.TYPES.CPU && timing.endTime > fcpTimeInMs)
        .map(([_, timing]) => timing);
  }
}

export {MaxPotentialFID};
