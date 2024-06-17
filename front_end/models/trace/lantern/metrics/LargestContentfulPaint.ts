// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Lantern from '../lantern.js';

type Node = Lantern.Node;

class LargestContentfulPaint extends Lantern.Metric {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get COEFFICIENTS(): Lantern.Simulation.MetricCoefficients {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  /**
   * Low priority image nodes are usually offscreen and very unlikely to be the
   * resource that is required for LCP. Our LCP graphs include everything except for these images.
   */
  static isNotLowPriorityImageNode(node: Node): boolean {
    if (node.type !== 'network') {
      return true;
    }
    const isImage = node.request.resourceType === 'Image';
    const isLowPriority = node.request.priority === 'Low' || node.request.priority === 'VeryLow';
    return !isImage || !isLowPriority;
  }

  static getOptimisticGraph(dependencyGraph: Node, processedNavigation: Lantern.Simulation.ProcessedNavigation): Node {
    const lcp = processedNavigation.timestamps.largestContentfulPaint;
    if (!lcp) {
      throw new Lantern.Error('NO_LCP');
    }

    return Lantern.Metrics.FirstContentfulPaint.getFirstPaintBasedGraph(dependencyGraph, {
      cutoffTimestamp: lcp,
      treatNodeAsRenderBlocking: LargestContentfulPaint.isNotLowPriorityImageNode,
    });
  }

  static getPessimisticGraph(dependencyGraph: Node, processedNavigation: Lantern.Simulation.ProcessedNavigation): Node {
    const lcp = processedNavigation.timestamps.largestContentfulPaint;
    if (!lcp) {
      throw new Lantern.Error('NO_LCP');
    }

    return Lantern.Metrics.FirstContentfulPaint.getFirstPaintBasedGraph(dependencyGraph, {
      cutoffTimestamp: lcp,
      treatNodeAsRenderBlocking: _ => true,
      // For pessimistic LCP we'll include *all* layout nodes
      additionalCpuNodesToTreatAsRenderBlocking: node => node.didPerformLayout(),
    });
  }

  static getEstimateFromSimulation(simulationResult: Lantern.Simulation.Result): Lantern.Simulation.Result {
    const nodeTimesNotOffscreenImages = Array.from(simulationResult.nodeTimings.entries())
                                            .filter(entry => LargestContentfulPaint.isNotLowPriorityImageNode(entry[0]))
                                            .map(entry => entry[1].endTime);

    return {
      timeInMs: Math.max(...nodeTimesNotOffscreenImages),
      nodeTimings: simulationResult.nodeTimings,
    };
  }

  static async compute(
      data: Lantern.Simulation.MetricComputationDataInput,
      extras?: Omit<import('../Metric.js').Extras, 'optimistic'>): Promise<Lantern.Metrics.Result> {
    const fcpResult = extras?.fcpResult;
    if (!fcpResult) {
      throw new Error('FCP is required to calculate the LCP metric');
    }

    const metricResult = await super.compute(data, extras);
    metricResult.timing = Math.max(metricResult.timing, fcpResult.timing);
    return metricResult;
  }
}

export {LargestContentfulPaint};
