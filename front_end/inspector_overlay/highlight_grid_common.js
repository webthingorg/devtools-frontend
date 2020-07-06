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
import {buildPath, drawRulers, emptyBounds} from './highlight_common.js';

export function drawLayoutGridHighlight(highlight, context) {
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
      drawRulers(
          context, rowBounds, /* rulerAtRight */ false, /* rulerAtBottom */ false,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend row gap right/down.
      drawRulers(
          context, rowBounds, /* rulerAtRight */ true, /* rulerAtBottom */ true,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend column lines left/up.
      drawRulers(
          context, columnBounds, /* rulerAtRight */ false, /* rulerAtBottom */ false,
          highlight.gridHighlightConfig.cellBorderColor, highlight.gridHighlightConfig.cellBorderDash);
      // Extend column right/down.
      drawRulers(
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
    _hatchFillPath(context, path, bounds, /* delta */ 10, hatchColor, flipDirection);
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
function _hatchFillPath(context, path, bounds, delta, color, flipDirection) {
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
