// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {type Chrome} from '../../../extension-api/ExtensionAPI.js';  // eslint-disable-line rulesdir/es_modules_import

export class PerformanceExtensionDataProvider {
  private readonly name: string;
  private readonly flameChartData: Chrome.DevTools.FlameChartData;
  private readonly timeOrigin: number;
  private readonly id: string;

  constructor(name: string, data: Chrome.DevTools.PerformanceExtensionData, id: string) {
    this.timeOrigin = data.timeOrigin;
    this.flameChartData = data.flameChartData;
    this.name = name;
    this.id = id;
  }

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  getTimeOrigin(): number {
    return this.timeOrigin;
  }
  getFlameChartData(): Chrome.DevTools.FlameChartData {
    return this.flameChartData;
  }
}
