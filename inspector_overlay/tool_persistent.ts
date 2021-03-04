// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Overlay, ResetData} from './common.js';
import {drawLayoutFlexContainerHighlight, FlexContainerHighlight} from './highlight_flex_common.js';
import {drawLayoutGridHighlight, GridHighlight} from './highlight_grid_common.js';

export class PersistentOverlay extends Overlay {
  private gridLabelState = {gridLayerCounter: 0};

  private gridLabels!: HTMLElement;

  reset(data: ResetData) {
    super.reset(data);
    this.gridLabelState.gridLayerCounter = 0;
    this.gridLabels.innerHTML = '';
  }

  renderGridMarkup() {
    const gridLabels = this.document.createElement('div');
    gridLabels.id = 'grid-label-container';
    this.document.body.append(gridLabels);
    this.gridLabels = gridLabels;
  }

  install() {
    this.document.body.classList.add('fill');

    const canvas = this.document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.classList.add('fill');
    this.document.body.append(canvas);

    this.renderGridMarkup();

    this.setCanvas(canvas);

    super.install();
  }

  uninstall() {
    this.document.body.classList.remove('fill');
    this.document.body.innerHTML = '';
    super.uninstall();
  }

  drawGridHighlight(highlight: GridHighlight) {
    this.context.save();
    drawLayoutGridHighlight(
        highlight, this.context, this.deviceScaleFactor, this.canvasWidth, this.canvasHeight, this.emulationScaleFactor,
        this.gridLabelState);
    this.context.restore();
  }

  drawFlexContainerHighlight(highlight: FlexContainerHighlight) {
    this.context.save();
    drawLayoutFlexContainerHighlight(
        highlight, this.context, this.deviceScaleFactor, this.canvasWidth, this.canvasHeight,
        this.emulationScaleFactor);
    this.context.restore();
  }
}
