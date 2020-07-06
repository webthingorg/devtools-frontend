// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//  Copyright (C) 2012 Google Inc. All rights reserved.

//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions
//  are met:

//  1.  Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//  2.  Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//  3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
//      its contributors may be used to endorse or promote products derived
//      from this software without specific prior written permission.

//  THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
//  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//  DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
//  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks
import {drawGridLabels} from './css_grid_label_helpers.js';

export function doReset() {
  document.getElementById('grid-label-container').removeChildren();
  window._gridPainted = false;
}

function _drawRulers(context, bounds, rulerAtRight, rulerAtBottom, color, dash) {
  context.save();
  const width = canvasWidth;
  const height = canvasHeight;
  context.strokeStyle = color || 'rgba(128, 128, 128, 0.3)';
  context.lineWidth = 1;
  context.translate(0.5, 0.5);
  if (dash) {
    context.setLineDash([3, 3]);
  }

  if (rulerAtRight) {
    for (const y in bounds.rightmostXForY) {
      context.beginPath();
      context.moveTo(width, y);
      context.lineTo(bounds.rightmostXForY[y], y);
      context.stroke();
    }
  } else {
    for (const y in bounds.leftmostXForY) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(bounds.leftmostXForY[y], y);
      context.stroke();
    }
  }

  if (rulerAtBottom) {
    for (const x in bounds.bottommostYForX) {
      context.beginPath();
      context.moveTo(x, height);
      context.lineTo(x, bounds.topmostYForX[x]);
      context.stroke();
    }
  } else {
    for (const x in bounds.topmostYForX) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, bounds.topmostYForX[x]);
      context.stroke();
    }
  }

  context.restore();
}

function buildPath(commands, bounds) {
  let commandsIndex = 0;

  function extractPoints(count) {
    const points = [];

    for (let i = 0; i < count; ++i) {
      const x = Math.round(commands[commandsIndex++] * emulationScaleFactor);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minX = Math.min(bounds.minX, x);

      const y = Math.round(commands[commandsIndex++] * emulationScaleFactor);
      bounds.maxY = Math.max(bounds.maxY, y);
      bounds.minY = Math.min(bounds.minY, y);

      bounds.leftmostXForY[y] = Math.min(bounds.leftmostXForY[y] || Number.MAX_VALUE, x);
      bounds.rightmostXForY[y] = Math.max(bounds.rightmostXForY[y] || Number.MIN_VALUE, x);
      bounds.topmostYForX[x] = Math.min(bounds.topmostYForX[x] || Number.MAX_VALUE, y);
      bounds.bottommostYForX[x] = Math.max(bounds.bottommostYForX[x] || Number.MIN_VALUE, y);
      points.push(x, y);
    }
    return points;
  }

  const commandsLength = commands.length;
  const path = new Path2D();
  while (commandsIndex < commandsLength) {
    switch (commands[commandsIndex++]) {
      case 'M':
        path.moveTo.apply(path, extractPoints(1));
        break;
      case 'L':
        path.lineTo.apply(path, extractPoints(1));
        break;
      case 'C':
        path.bezierCurveTo.apply(path, extractPoints(3));
        break;
      case 'Q':
        path.quadraticCurveTo.apply(path, extractPoints(2));
        break;
      case 'Z':
        path.closePath();
        break;
    }
  }

  return path;
}

function emptyBounds() {
  const bounds = {
    minX: Number.MAX_VALUE,
    minY: Number.MAX_VALUE,
    maxX: Number.MIN_VALUE,
    maxY: Number.MIN_VALUE,
    leftmostXForY: {},
    rightmostXForY: {},
    topmostYForX: {},
    bottommostYForX: {}
  };
  return bounds;
}

function _drawLayoutGridHighlight(highlight, context) {
  // Draw Grid border
  const gridBounds = emptyBounds();
  const gridPath = buildPath(highlight.gridBorder, gridBounds);
  if (highlight.gridHighlightConfig.gridBorderColor) {
    context.save();
    context.translate(0.5, 0.5);
    context.lineWidth = 0;
    if (highlight.gridHighlightConfig.gridBorderDash) {
      context.setLineDash([3, 3]);
    }
    context.strokeStyle = highlight.gridHighlightConfig.gridBorderColor;
    context.stroke(gridPath);
    context.restore();
  }

  // Draw Cell Border
  if (highlight.gridHighlightConfig.cellBorderColor) {
    const rowBounds = emptyBounds();
    const columnBounds = emptyBounds();
    const rowPath = buildPath(highlight.rows, rowBounds);
    const columnPath = buildPath(highlight.columns, columnBounds);
    context.save();
    context.translate(0.5, 0.5);
    if (highlight.gridHighlightConfig.cellBorderDash) {
      context.setLineDash([3, 3]);
    }
    context.lineWidth = 0;
    context.strokeStyle = highlight.gridHighlightConfig.cellBorderColor;

    context.save();
    context.stroke(rowPath);
    context.restore();

    context.save();
    context.stroke(columnPath);
    context.restore();

    context.restore();

    if (highlight.gridHighlightConfig.showGridExtensionLines) {
      // Extend row gap lines left/up.
      _drawRulers(
          context, rowBounds, /* rulerAtRight */ false, /* rulerAtBottom */ false,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend row gap right/down.
      _drawRulers(
          context, rowBounds, /* rulerAtRight */ true, /* rulerAtBottom */ true,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend column lines left/up.
      _drawRulers(
          context, columnBounds, /* rulerAtRight */ false, /* rulerAtBottom */ false,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend column right/down.
      _drawRulers(
          context, columnBounds, /* rulerAtRight */ true, /* rulerAtBottom */ true,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
    }
  }

  // Draw gaps
  _drawGridGap(
      context, highlight.rowGaps, highlight.gridHighlightConfig.rowGapColor,
      highlight.gridHighlightConfig.rowHatchColor, /* flipDirection */ true);
  _drawGridGap(
      context, highlight.columnGaps, highlight.gridHighlightConfig.columnGapColor,
      highlight.gridHighlightConfig.columnHatchColor);

  // Draw named grid areas
  const areaBounds = _drawGridAreas(context, highlight.areaNames, highlight.gridHighlightConfig.areaBorderColor);

  // Draw all the labels
  drawGridLabels(highlight, gridBounds, areaBounds);
}

/**
 * Draw all of the named grid area paths. This does not draw the labels, as
 * placing labels in and around the grid for various things is handled later.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {AreaPaths} areas
 * @param {string} borderColor
 * @return {AreaBounds[]} The list of area names and their associated bounds.
 */
function _drawGridAreas(context, areas, borderColor) {
  if (!areas || !Object.keys(areas).length) {
    return [];
  }

  context.save();
  if (borderColor) {
    context.strokeStyle = borderColor;
  }
  context.lineWidth = 2;

  const areaBounds = [];

  for (const name in areas) {
    const areaCommands = areas[name];

    const bounds = emptyBounds();
    const path = buildPath(areaCommands, bounds);

    context.stroke(path);

    areaBounds.push({name, bounds});
  }

  context.restore();

  return areaBounds;
}

function _drawGridGap(context, gapCommands, gapColor, hatchColor, flipDirection) {
  if (!gapColor && !hatchColor) {
    return;
  }

  context.save();
  context.translate(0.5, 0.5);
  context.lineWidth = 0;

  const bounds = emptyBounds();
  const path = buildPath(gapCommands, bounds);

  // Fill the gap background if needed.
  if (gapColor) {
    context.fillStyle = gapColor;
    context.fill(path);
  }

  // And draw the hatch pattern if needed.
  if (hatchColor) {
    hatchFillPath(context, path, bounds, /* delta */ 10, hatchColor, flipDirection);
  }
  context.restore();
}

/**
 * Draw line hatching at a 45 degree angle for a given
 * path.
 *   __________
 *   |\  \  \ |
 *   | \  \  \|
 *   |  \  \  |
 *   |\  \  \ |
 *   **********
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Path2D} path
 * @param {Object} bounds
 * @param {number} delta - vertical gap between hatching lines in pixels
 * @param {string} color
 * @param {boolean=} flipDirection - lines are drawn from top right to bottom left
 *
 */
function hatchFillPath(context, path, bounds, delta, color, flipDirection) {
  const dx = bounds.maxX - bounds.minX;
  const dy = bounds.maxY - bounds.minY;
  context.rect(bounds.minX, bounds.minY, dx, dy);
  context.save();
  context.clip(path);
  context.setLineDash([5, 3]);
  const majorAxis = Math.max(dx, dy);
  context.strokeStyle = color;
  if (flipDirection) {
    for (let i = -majorAxis; i < majorAxis; i += delta) {
      context.beginPath();
      context.moveTo(bounds.maxX - i, bounds.minY);
      context.lineTo(bounds.maxX - dy - i, bounds.maxY);
      context.stroke();
    }
  } else {
    for (let i = -majorAxis; i < majorAxis; i += delta) {
      context.beginPath();
      context.moveTo(i + bounds.minX, bounds.minY);
      context.lineTo(dy + i + bounds.minX, bounds.maxY);
      context.stroke();
    }
  }
  context.restore();
}

export function drawGridHighlight(highlight, context) {
  context = context || window.context;
  context.save();

  _drawLayoutGridHighlight(highlight.gridInfo, context);

  context.restore();

  return;
}
