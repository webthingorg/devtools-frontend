// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {PathCommands} from './common.js';
import {buildPath, emptyBounds, fillPathWithBoxStyle} from './highlight_common.js';

export interface IsolatedElementHighlight {
  draggableWidthBorder: PathCommands;
  draggableHeightBorder: PathCommands;
  currentX: number;
  currentY: number;
  currentWidth: number;
  currentHeight: number;
  highlightIndex: number;
}

export function drawIsolatedElementHighlight(
    highlight: IsolatedElementHighlight, context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number,
    emulationScaleFactor: number) {
  context.save();
  context.fillStyle = '#f8f8f8';
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.clearRect(highlight.currentX, highlight.currentY, highlight.currentWidth, highlight.currentHeight);
  context.restore();

  const bounds = emptyBounds();
  const widthPath = buildPath(highlight.draggableWidthBorder, bounds, emulationScaleFactor);
  const heightPath = buildPath(highlight.draggableHeightBorder, bounds, emulationScaleFactor);
  fillPathWithBoxStyle(context, widthPath, bounds, 45 /* angle */, {
    fillColor: '#334455',
    hatchColor: '#770077',
  });
  fillPathWithBoxStyle(context, heightPath, bounds, 45 /* angle */, {
    fillColor: '#334455',
    hatchColor: '#770077',
  });

  return {
    widthPath,
    heightPath,
    currentWidth: highlight.currentWidth,
    currentHeight: highlight.currentHeight,
    highlightIndex: highlight.highlightIndex,
  };
}
