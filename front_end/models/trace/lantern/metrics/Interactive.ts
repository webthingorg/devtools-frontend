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

// Any CPU task of 20 ms or more will end up being a critical long task on mobile
const CRITICAL_LONG_TASK_THRESHOLD = 20;

class Interactive extends Lantern.Metric {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get COEFFICIENTS(): Lantern.Simulation.MetricCoefficients {
    return {
      intercept: 0,
      optimistic: 0.45,
      pessimistic: 0.55,
    };
  }

  static getOptimisticGraph<T>(dependencyGraph: Lantern.Node<T>): Lantern.Node<T> {
    // Adjust the critical long task threshold for microseconds
    const minimumCpuTaskDuration = CRITICAL_LONG_TASK_THRESHOLD * 1000;

    return dependencyGraph.cloneWithRelationships(node => {
      // Include everything that might be a long task
      if (node.type === Lantern.BaseNode.TYPES.CPU) {
        return node.duration > minimumCpuTaskDuration;
      }

      // Include all scripts and high priority requests, exclude all images
      const isImage = node.request.resourceType === Lantern.NetworkRequestTypes.Image;
      const isScript = node.request.resourceType === Lantern.NetworkRequestTypes.Script;
      return (!isImage && (isScript || node.request.priority === 'High' || node.request.priority === 'VeryHigh'));
    });
  }

  static getPessimisticGraph<T>(dependencyGraph: Lantern.Node<T>): Lantern.Node<T> {
    return dependencyGraph;
  }

  static getEstimateFromSimulation(simulationResult: Lantern.Simulation.Result, extras: Extras):
      Lantern.Simulation.Result {
    if (!extras.lcpResult) {
      throw new Error('missing lcpResult');
    }

    const lastTaskAt = Interactive.getLastLongTaskEndTime(simulationResult.nodeTimings);
    const minimumTime = extras.optimistic ? extras.lcpResult.optimisticEstimate.timeInMs :
                                            extras.lcpResult.pessimisticEstimate.timeInMs;
    return {
      timeInMs: Math.max(minimumTime, lastTaskAt),
      nodeTimings: simulationResult.nodeTimings,
    };
  }

  static async compute(
      data: Lantern.Simulation.MetricComputationDataInput,
      extras?: Omit<import('../Metric.js').Extras, 'optimistic'>): Promise<Lantern.Metrics.Result> {
    const lcpResult = extras?.lcpResult;
    if (!lcpResult) {
      throw new Error('LCP is required to calculate the Interactive metric');
    }

    const metricResult = await super.compute(data, extras);
    metricResult.timing = Math.max(metricResult.timing, lcpResult.timing);
    return metricResult;
  }

  static getLastLongTaskEndTime(nodeTimings: Lantern.Simulation.Result['nodeTimings'], duration = 50): number {
    return Array.from(nodeTimings.entries())
        .filter(([node, timing]) => {
          if (node.type !== Lantern.BaseNode.TYPES.CPU) {
            return false;
          }
          return timing.duration > duration;
        })
        .map(([_, timing]) => timing.endTime)
        .reduce((max, x) => Math.max(max || 0, x || 0), 0);
  }
}

export {Interactive};
