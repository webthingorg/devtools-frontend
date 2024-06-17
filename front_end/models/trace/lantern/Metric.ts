// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Lantern from './lantern.js';

export interface Extras {
  optimistic: boolean;
  fcpResult?: Lantern.Metrics.Result;
  lcpResult?: Lantern.Metrics.Result;
  interactiveResult?: Lantern.Metrics.Result;
  observedSpeedIndex?: number;
}

class Metric {
  static getScriptUrls(
      dependencyGraph: Lantern.Node, treatNodeAsRenderBlocking?: (node: Lantern.NetworkNode) => boolean): Set<string> {
    const scriptUrls: Set<string> = new Set();

    dependencyGraph.traverse(node => {
      if (node.type !== Lantern.BaseNode.TYPES.NETWORK) {
        return;
      }
      if (node.request.resourceType !== Lantern.NetworkRequestTypes.Script) {
        return;
      }
      if (treatNodeAsRenderBlocking?.(node)) {
        scriptUrls.add(node.request.url);
      }
    });

    return scriptUrls;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get COEFFICIENTS(): Lantern.Simulation.MetricCoefficients {
    throw new Error('COEFFICIENTS unimplemented!');
  }

  /**
   * Returns the coefficients, scaled by the throttling settings if needed by the metric.
   * Some lantern metrics (speed-index) use components in their estimate that are not
   * from the simulator. In this case, we need to adjust the coefficients as the target throttling
   * settings change.
   */
  static getScaledCoefficients(rttMs: number):
      Lantern.Simulation.MetricCoefficients {  // eslint-disable-line no-unused-vars
    return this.COEFFICIENTS;
  }

  static getOptimisticGraph(dependencyGraph: Lantern.Node, processedNavigation: Lantern.Simulation.ProcessedNavigation):
      Lantern.Node {  // eslint-disable-line no-unused-vars
    throw new Error('Optimistic graph unimplemented!');
  }

  static getPessimisticGraph(
      dependencyGraph: Lantern.Node, processedNavigation: Lantern.Simulation.ProcessedNavigation):
      Lantern.Node {  // eslint-disable-line no-unused-vars
    throw new Error('Pessmistic graph unimplemented!');
  }

  static getEstimateFromSimulation(simulationResult: Lantern.Simulation.Result, extras: Extras):
      Lantern.Simulation.Result {  // eslint-disable-line no-unused-vars
    return simulationResult;
  }

  static async compute(data: Lantern.Simulation.MetricComputationDataInput, extras?: Omit<Extras, 'optimistic'>):
      Promise<Lantern.Metrics.Result> {
    const {simulator, graph, processedNavigation} = data;

    const metricName = this.name.replace('Lantern', '');
    const optimisticGraph = this.getOptimisticGraph(graph, processedNavigation);
    const pessimisticGraph = this.getPessimisticGraph(graph, processedNavigation);

    let simulateOptions = {label: `optimistic${metricName}`};
    const optimisticSimulation = simulator.simulate(optimisticGraph, simulateOptions);

    simulateOptions = {label: `pessimistic${metricName}`};
    const pessimisticSimulation = simulator.simulate(pessimisticGraph, simulateOptions);

    const optimisticEstimate = this.getEstimateFromSimulation(
        optimisticSimulation,
        {...extras, optimistic: true},
    );

    const pessimisticEstimate = this.getEstimateFromSimulation(
        pessimisticSimulation,
        {...extras, optimistic: false},
    );

    const coefficients = this.getScaledCoefficients(simulator.rtt);
    // Estimates under 1s don't really follow the normal curve fit, minimize the impact of the intercept
    const interceptMultiplier = coefficients.intercept > 0 ? Math.min(1, optimisticEstimate.timeInMs / 1000) : 1;
    const timing = coefficients.intercept * interceptMultiplier +
        coefficients.optimistic * optimisticEstimate.timeInMs + coefficients.pessimistic * pessimisticEstimate.timeInMs;

    return {
      timing,
      optimisticEstimate,
      pessimisticEstimate,
      optimisticGraph,
      pessimisticGraph,
    };
  }
}

export {Metric};
