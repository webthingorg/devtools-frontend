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
// TODO: Refactor helper functions once the change to make them universally available
// is landed

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
  while (commandsIndex <= commandsLength) {
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
  path.closePath();
  return path;
}

function drawPath(context, commands, outlineColor, isChild, bounds) {
  context.save();
  const path = buildPath(commands, bounds);
  if (outlineColor) {
    context.strokeStyle = outlineColor;
    context.lineWidth = 2;
    if (!isChild) {
      context.setLineDash([3, 3]);
    }
    context.stroke(path);
  }
  context.restore();
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

export const LabelPositionTypes = {
  topCorner: 'top-corner',
  aboveElement: 'above-element',
  belowElement: 'below-element',
  aboveElementWider: 'above-element-wider',
  belowElementWider: 'below-element-wider',
  bottomCornerWider: 'bottom-corner-wider',
  bottomCornerTaller: 'bottom-corner-taller',
  bottomCornerWiderTaller: 'bottom-corner-wider-taller',
};

export function doReset() {
  document.getElementById('source-order-container').removeChildren();
}

/**
 * Calculates the coordinates to place the label based on position type
 * @param {string} positionType
 * @param {object} bounds
 * @param {number} labelHeight
 * @returns {{contentTop: number; contentLeft: number}}
 */
export function _getLabelPosition(positionType, bounds, labelHeight) {
  let contentTop;
  switch (positionType) {
    case LabelPositionTypes.topCorner:
      contentTop = bounds.minY;
      break;
    case LabelPositionTypes.aboveElement:
    case LabelPositionTypes.aboveElementWider:
      contentTop = bounds.minY - labelHeight;
      break;
    case LabelPositionTypes.belowElement:
    case LabelPositionTypes.belowElementWider:
      contentTop = bounds.maxY;
      break;
    case LabelPositionTypes.bottomCornerWider:
    case LabelPositionTypes.bottomCornerTaller:
    case LabelPositionTypes.bottomCornerWiderTaller:
      contentTop = bounds.maxY - labelHeight;
      break;
  }
  return {
    contentTop,
    contentLeft: bounds.minX,
  };
}

/**
 * Determines the position type of the label based on the element it's associated
 * with, avoiding overlaps between other labels
 * @param {object} bounds
 * @param {number} labelHeight
 * @param {number} labelWidth
 * @param {HTMLCollection} otherLabels
 * @returns {string}
 */
export function _getLabelPositionType(bounds, labelHeight, labelWidth, otherLabels) {
  let labelType;
  // Label goes in the top left corner if the element is bigger than the label
  // or if there are too many child nodes
  const widerThanElement = bounds.minX + labelWidth > bounds.maxX;
  const tallerThanElement = bounds.minY + labelHeight > bounds.maxY;
  if ((!widerThanElement && !tallerThanElement) || otherLabels.length >= 1000) {
    return LabelPositionTypes.topCorner;
  }

  // Check if the new label would overlap with an existing label if placed above
  // its element
  let overlaps = false;
  for (let i = 0; i < otherLabels.length; i++) {
    const rect = otherLabels[i].getBoundingClientRect();
    if (rect.top === 0 && rect.left === 0) {
      continue;
    }
    const topOverlaps = bounds.minY - labelHeight <= rect.top + rect.height && bounds.minY - labelHeight >= rect.top;
    const bottomOverlaps = bounds.minY <= rect.top + rect.height && bounds.minY >= rect.top;
    const leftOverlaps = bounds.minX >= rect.left && bounds.minX <= rect.left + rect.width;
    const rightOverlaps = bounds.minX + labelWidth >= rect.left && bounds.minX + labelWidth <= rect.left + rect.width;
    if ((topOverlaps && (leftOverlaps || rightOverlaps)) || (bottomOverlaps && (leftOverlaps || rightOverlaps))) {
      overlaps = true;
      break;
    }
  }
  // Label goes on top of the element if the element is too small
  if (bounds.minY - labelHeight > 0 && !overlaps) {
    labelType = LabelPositionTypes.aboveElement;
    if (widerThanElement) {
      labelType = LabelPositionTypes.aboveElementWider;
    }
    // Label goes below the element if would go off the screen/overlap with another label
  } else if (bounds.maxY + labelHeight < window.canvasHeight) {
    labelType = LabelPositionTypes.belowElement;
    if (widerThanElement) {
      labelType = LabelPositionTypes.belowElementWider;
    }
    // Label goes in the bottom left corner of the element if putting it below the element would make it go off the screen
  } else {
    if (widerThanElement && tallerThanElement) {
      labelType = LabelPositionTypes.bottomCornerWiderTaller;
    } else if (widerThanElement) {
      labelType = LabelPositionTypes.bottomCornerWider;
    } else {
      labelType = LabelPositionTypes.bottomCornerTaller;
    }
  }
  return labelType;
}

function _drawSourceOrderLabels(sourceOrder, color, bounds) {
  const sourceOrderContainer = document.getElementById('source-order-container');
  const otherLabels = sourceOrderContainer.children;
  const labelContainer = sourceOrderContainer.createChild('div', 'label-container');
  labelContainer.style.color = color;
  labelContainer.textContent = sourceOrder;

  const labelHeight = labelContainer.offsetHeight;
  const labelWidth = labelContainer.offsetWidth;
  const labelType = _getLabelPositionType(bounds, labelHeight, labelWidth, otherLabels);
  const labelPosition = _getLabelPosition(labelType, bounds, labelHeight);

  labelContainer.classList.add(labelType);
  labelContainer.style.top = labelPosition.contentTop + 'px';
  labelContainer.style.left = labelPosition.contentLeft + 'px';
}

export function drawSourceOrder(highlight, context) {
  context = context || window.context;

  context.save();
  const bounds = emptyBounds();
  const sourceOrder = highlight.sourceOrder ? highlight.sourceOrder : 0;
  const outlineColor = highlight.paths[0].outlineColor;
  for (let paths = highlight.paths.slice(); paths.length;) {
    const path = paths.pop();
    context.save();
    drawPath(context, path.path, outlineColor, !!sourceOrder, bounds);
    context.restore();
  }
  context.restore();

  context.save();
  if (!!sourceOrder) {
    _drawSourceOrderLabels(sourceOrder, outlineColor, bounds);
  }
  context.restore();

  return {bounds: bounds};
}
