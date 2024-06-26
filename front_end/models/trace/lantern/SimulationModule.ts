// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO(crbug.com/348449529): refactor to proper devtools module

import {type AnyNetworkObject, type Simulation} from './types/lantern.js';

export {ConnectionPool} from './simulation/ConnectionPool.js';
export {Constants} from './simulation/Constants.js';
export {DNSCache} from './simulation/DNSCache.js';
export {NetworkAnalyzer} from './simulation/NetworkAnalyzer.js';
export {type CompleteNodeTiming, SimulatorTimingMap} from './simulation/SimulationTimingMap.js';
export {Simulator} from './simulation/Simulator.js';
export {TCPConnection} from './simulation/TCPConnection.js';

export type MetricCoefficients = Simulation.MetricCoefficients;
export type MetricComputationDataInput = Simulation.MetricComputationDataInput;
export type NodeTiming = Simulation.NodeTiming;
export type Options = Simulation.Options;
export type ProcessedNavigation = Simulation.ProcessedNavigation;
export type Result<T = AnyNetworkObject> = Simulation.Result<T>;
export type Settings = Simulation.Settings;
export type URL = Simulation.URL;
