// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as TraceEngine from '../../models/trace/trace.js';

type TrackData = TraceEngine.Helpers.Extensions.ExtensionTrackData;
export {TrackData};

export class ExtensionDataGatherer {
  #traceParseData: TraceEngine.Handlers.Types.TraceParseData;
  constructor(traceParsedData: TraceEngine.Handlers.Types.TraceParseData) {
    this.#traceParseData = traceParsedData;
  }

  getExtensionFlameChartData(): readonly TrackData[] {
    if (!this.#traceParseData.ExtensionTraceData) {
      return [];
    }
    return this.#traceParseData.ExtensionTraceData.extensionFlameCharts;
  }
}
