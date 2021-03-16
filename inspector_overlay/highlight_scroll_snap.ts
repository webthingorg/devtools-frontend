
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Bounds, PathCommands, Position} from './common.js';
import {drawPath, emptyBounds, LinePattern, LineStyle} from './highlight_common.js';

type SnapAlignment = 'none'|'start'|'end'|'center';
export interface ScrollSnapHighlight {
  snapport: PathCommands;
  paddingBox: PathCommands;
  snapAreas: Array<{
    path: PathCommands,
    borderBox: PathCommands,
    alignBlock?: SnapAlignment,
    alignInline?: SnapAlignment,
  }>;
  snapportBorder: LineStyle;
  snapAreaBorder: LineStyle;
  scrollMarginColor: string;
  scrollPaddingColor: string;
}

function getSnapAlignBlockPoint(bounds: Bounds, align: SnapAlignment) {
  if (align === 'start') {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: bounds.minY,
    };
  }
  if (align === 'center') {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
  if (align === 'end') {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: bounds.maxY,
    };
  }
  return;
}

function getSnapAlignInlinePoint(bounds: Bounds, align: SnapAlignment) {
  if (align === 'start') {
    return {
      x: bounds.minX,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
  if (align === 'center') {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
  if (align === 'end') {
    return {
      x: bounds.maxX,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }
  return;
}

function drawAlignment(context: CanvasRenderingContext2D, point: Position) {
  context.save();
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = 'white';
  context.arc(point.x, point.y, 6, 0, 2 * Math.PI);
  context.stroke();
  context.fillStyle = '#4585f6';
  context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
  context.fill();
  context.restore();
}

export function drawScrollSnapHighlight(
    highlight: ScrollSnapHighlight, context: CanvasRenderingContext2D, emulationScaleFactor: number) {
  drawPath(context, highlight.paddingBox, highlight.scrollPaddingColor, undefined, emptyBounds(), emulationScaleFactor);

  // Clear the area so that previously rendered paddings remain.
  context.save();
  context.globalCompositeOperation = 'destination-out';
  drawPath(context, highlight.snapport, 'white', undefined, emptyBounds(), emulationScaleFactor);
  context.restore();

  drawPath(context, highlight.snapport, undefined, highlight.snapportBorder.color, emptyBounds(), emulationScaleFactor);

  for (const area of highlight.snapAreas) {
    const areaBounds = emptyBounds();
    context.save();
    context.translate(0.5, 0.5);
    context.lineWidth = 2;
    if (highlight.snapAreaBorder.pattern === LinePattern.Dashed) {
      context.setLineDash([3, 3]);
    }
    if (highlight.snapAreaBorder.pattern === LinePattern.Dotted) {
      context.setLineDash([2, 2]);
    }
    drawPath(
        context, area.path, highlight.scrollMarginColor, highlight.snapAreaBorder.color, areaBounds,
        emulationScaleFactor);
    context.restore();

    // Clear the area so that previously rendered margins remain.
    context.save();
    context.globalCompositeOperation = 'destination-out';
    drawPath(context, area.borderBox, 'white', undefined, emptyBounds(), emulationScaleFactor);
    context.restore();

    const inlinePoint = area.alignInline ? getSnapAlignInlinePoint(areaBounds, area.alignInline) : null;
    const blockPoint = area.alignBlock ? getSnapAlignBlockPoint(areaBounds, area.alignBlock) : null;
    if (inlinePoint) {
      drawAlignment(context, inlinePoint);
    }
    if (blockPoint) {
      drawAlignment(context, blockPoint);
    }
  }
}
