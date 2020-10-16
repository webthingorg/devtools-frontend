// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as PerfUI from '../perf_ui/perf_ui.js';
import * as UI from '../ui/ui.js';

import {PerformanceModel} from './PerformanceModel.js';
import {createWebVitalsTimeline, WebVitalsTimelineClosureInterface} from './WebVitalsTimeline_bridge.js';


export class WebVitalsIntegrator extends UI.Widget.VBox implements PerfUI.ChartViewport.ChartViewportDelegate {
  private model: PerformanceModel;
  private chartViewport: PerfUI.ChartViewport.ChartViewport;
  private delegate: PerfUI.FlameChart.FlameChartDelegate;
  private webVitalsTimeline: WebVitalsTimelineClosureInterface;

  constructor(delegate: PerfUI.FlameChart.FlameChartDelegate, model: PerformanceModel) {
    super();
    this.model = model;
    this.delegate = delegate;
    this.chartViewport = new PerfUI.ChartViewport.ChartViewport(this);
    this.chartViewport.show(this.contentElement);

    this.webVitalsTimeline = createWebVitalsTimeline();
    this.chartViewport.viewportElement.appendChild(this.webVitalsTimeline);
    // this.contentElement.style.flex = '0 auto';
  }

  windowChanged(startTime: number, endTime: number, animate: boolean) {
    this.delegate.windowChanged(startTime, endTime, animate);
  }

  updateRangeSelection(startTime: number, endTime: number) {
    this.delegate.updateRangeSelection(startTime, endTime);
  }

  setSize(width: number, height: number) {
    // this.webVitalsTimeline.render();
  }

  update() {
    // debugger;
    this.webVitalsTimeline.render();
  }
}
