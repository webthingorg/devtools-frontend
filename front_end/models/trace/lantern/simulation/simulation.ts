// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {type Node} from '../BaseNode.js';

import {type Simulator} from './Simulator.js';

export {ConnectionPool} from './ConnectionPool.js';
export {Constants} from './Constants.js';
export {DNSCache} from './DNSCache.js';
export {NetworkAnalyzer} from './NetworkAnalyzer.js';
export {SimulatorTimingMap} from './SimulationTimingMap.js';
export {Simulator} from './Simulator.js';
export {TcpConnection} from './TcpConnection.js';

export interface URL {
  /** URL of the initially requested URL */
  requestedUrl?: string;
  /** URL of the last document request */
  mainDocumentUrl?: string;
}

export interface MetricCoefficients {
  intercept: number;
  optimistic: number;
  pessimistic: number;
}

/** Simulation settings that control the amount of network & cpu throttling in the run. */
export interface ThrottlingSettings {
  /** The round trip time in milliseconds. */
  rttMs?: number;
  /** The network throughput in kilobits per second. */
  throughputKbps?: number;
  // devtools settings
  /** The network request latency in milliseconds. */
  requestLatencyMs?: number;
  /** The network download throughput in kilobits per second. */
  downloadThroughputKbps?: number;
  /** The network upload throughput in kilobits per second. */
  uploadThroughputKbps?: number;
  // used by both
  /** The amount of slowdown applied to the cpu (1/<cpuSlowdownMultiplier>). */
  cpuSlowdownMultiplier?: number;
}

export interface PrecomputedLanternData {
  additionalRttByOrigin: {[origin: string]: number};
  serverResponseTimeByOrigin: {[origin: string]: number};
}

export interface Settings {
  networkAnalysis: {
    rtt: number,
    additionalRttByOrigin: Map<string, number>,
    serverResponseTimeByOrigin: Map<string, number>,
    throughput: number,
  };
  /** The method used to throttle the network. */
  throttlingMethod: 'devtools'|'simulate'|'provided';
  /** The throttling config settings. */
  throttling: Required<ThrottlingSettings>;
  /** Precomputed lantern estimates to use instead of observed analysis. */
  precomputedLanternData?: PrecomputedLanternData|null;
}

export interface Options {
  rtt?: number;
  throughput?: number;
  observedThroughput: number;
  maximumConcurrentRequests?: number;
  cpuSlowdownMultiplier?: number;
  layoutTaskMultiplier?: number;
  additionalRttByOrigin?: Map<string, number>;
  serverResponseTimeByOrigin?: Map<string, number>;
}

export interface NodeTiming {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface Result<T = any> {
  timeInMs: number;
  nodeTimings: Map<Node<T>, NodeTiming>;
}

export interface ProcessedNavigation {
  timestamps: {
    firstContentfulPaint: number,
    largestContentfulPaint?: number,
  };
}

export interface MetricComputationDataInput {
  simulator: Simulator;
  graph: Node<any>;
  processedNavigation: ProcessedNavigation;
}
