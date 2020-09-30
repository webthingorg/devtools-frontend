// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Overlay} from './common.js';

const darkGridColor = 'rgba(0,0,0,0.7)';
const gridBackgroundColor = 'rgba(255, 255, 255, 0.8)';

export class ViewportSizeOverlay extends Overlay {
  setPlatform(platform: string) {
    super.setPlatform(platform);
    const document = this.getDocument();
    document.body.classList.add('fill');
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.classList.add('fill');
    document.body.append(canvas);
    this.setCanvas(canvas);
  }

  drawViewSize() {
    const context = this.getContext();
    const document = this.getDocument();
    const viewportSize = this.viewportSize;
    const text = `${viewportSize.width}px \u00D7 ${viewportSize.height}px`;
    const canvasWidth = this.canvasWidth || 0;
    context.save();
    context.font = `14px ${this.getWindow().getComputedStyle(document.body).fontFamily}`;
    const textWidth = context.measureText(text).width;
    context.fillStyle = gridBackgroundColor;
    context.fillRect(canvasWidth - textWidth - 12, 0, canvasWidth, 25);
    context.fillStyle = darkGridColor;
    context.fillText(text, canvasWidth - textWidth - 6, 18);
    context.restore();
  }
}
