// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO(crbug.com/348449529): refactor to proper devtools module

import type * as Lantern from './types/lantern.js';

export {FirstContentfulPaint} from './metrics/FirstContentfulPaint.js';
export {Interactive} from './metrics/Interactive.js';
export {LargestContentfulPaint} from './metrics/LargestContentfulPaint.js';
export {MaxPotentialFID} from './metrics/MaxPotentialFID.js';
export {type Extras, Metric} from './metrics/Metric.js';
export {SpeedIndex} from './metrics/SpeedIndex.js';
export * as TBTUtils from './metrics/TBTUtils.js';
export {TotalBlockingTime} from './metrics/TotalBlockingTime.js';

export type Result<T = Lantern.AnyNetworkObject> = Lantern.Metrics.Result<T>;
