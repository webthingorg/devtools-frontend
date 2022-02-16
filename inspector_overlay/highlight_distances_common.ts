// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {PathBounds} from './highlight_common.js';
import {drawPathWithLineStyle, LinePattern} from './highlight_common.js';

function drawBadge(
    context: CanvasRenderingContext2D, text: string, x: number, y: number, radius: number,
    options: {verticalCenter?: boolean, horizontalCenter?: boolean, padding?: number, color?: string}) {
  const {
    verticalCenter,
    horizontalCenter,
    padding = 3,
    color = 'rgba(245, 40, 145, 1.0)',
  } = options;
  context.save();
  context.fillStyle = color;
  const {
    actualBoundingBoxLeft,
    actualBoundingBoxRight,
    actualBoundingBoxAscent,
  } = context.measureText(text);

  x = Math.round(x);
  y = Math.round(y);
  const w = Math.abs(actualBoundingBoxLeft) + Math.abs(actualBoundingBoxRight) + 2 * padding;
  const h = Math.abs(actualBoundingBoxAscent) + 2 * padding;

  if (verticalCenter) {
    y = Math.round(y - h / 2);
  }

  if (horizontalCenter) {
    x = Math.round(x - w / 2);
  }

  const r = x + w;
  const b = y + h;

  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(r - radius, y);
  context.quadraticCurveTo(r, y, r, y + radius);
  context.lineTo(r, y + h - radius);
  context.quadraticCurveTo(r, b, r - radius, b);
  context.lineTo(x + radius, b);
  context.quadraticCurveTo(x, b, x, b - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.fill();
  context.fillStyle = 'white';
  context.fillText(text, x + padding, y + actualBoundingBoxAscent + padding);
  context.restore();
}

const drawVerticalDistance = (context: CanvasRenderingContext2D, centerX: number, fromY: number, toY: number) => {
  const distance = Math.abs(fromY - toY);
  if (distance > 0) {
    context.save();
    context.strokeStyle = 'rgba(245, 40, 145, 1.0)';
    context.translate(0.5, 0.5);
    context.beginPath();
    context.moveTo(Math.round(centerX), Math.round(fromY));
    context.lineTo(Math.round(centerX), Math.round(toY));
    context.stroke();
    context.restore();
    drawBadge(context, `${distance}`, centerX + 5, Math.min(fromY, toY) + 0.5 * distance, 3, {verticalCenter: true});
  }
};

const drawHorizontalDistance = (context: CanvasRenderingContext2D, centerY: number, fromX: number, toX: number) => {
  const distance = Math.abs(fromX - toX);
  if (distance > 0) {
    context.save();
    context.strokeStyle = 'rgba(245, 40, 145, 1.0)';
    context.translate(0.5, 0.5);
    context.beginPath();
    context.moveTo(Math.round(fromX), Math.round(centerY));
    context.lineTo(Math.round(toX), Math.round(centerY));
    context.stroke();
    context.restore();
    drawBadge(context, `${distance}`, Math.min(fromX, toX) + 0.5 * distance, centerY + 5, 3, {horizontalCenter: true});
  }
};

function drawBoundingBoxDimensions(context: CanvasRenderingContext2D, bounds: PathBounds) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  drawBadge(
      context, `${width} \u00d7 ${height}`, bounds.minX + 0.5 * (bounds.maxX - bounds.minX), bounds.maxY + 5, 3,
      {horizontalCenter: true, color: 'rgba(52, 143, 235, 1.0)'});
}

export function drawBoundingBox(
    context: CanvasRenderingContext2D, bounds: PathBounds,
    options?: {extendLinesToViewport?: {width: number, height: number}, hideDimensionsBadge?: boolean}) {
  const boundingBoxPath = new Path2D();
  if (options?.extendLinesToViewport) {
    const {extendLinesToViewport: viewportSize} = options;
    boundingBoxPath.moveTo(0, bounds.minY);
    boundingBoxPath.lineTo(viewportSize.width, bounds.minY);
    boundingBoxPath.moveTo(0, bounds.maxY);
    boundingBoxPath.lineTo(viewportSize.width, bounds.maxY);
    boundingBoxPath.moveTo(bounds.minX, 0);
    boundingBoxPath.lineTo(bounds.minX, viewportSize.height);
    boundingBoxPath.moveTo(bounds.maxX, 0);
    boundingBoxPath.lineTo(bounds.maxX, viewportSize.height);
  } else {
    boundingBoxPath.moveTo(bounds.minX, bounds.minY);
    boundingBoxPath.lineTo(bounds.maxX, bounds.minY);
    boundingBoxPath.lineTo(bounds.maxX, bounds.maxY);
    boundingBoxPath.lineTo(bounds.minX, bounds.maxY);
    boundingBoxPath.lineTo(bounds.minX, bounds.minY);
  }
  drawPathWithLineStyle(context, boundingBoxPath, {color: 'rgba(245, 40, 145, 1.0)', pattern: LinePattern.Dashed});
  if (!options?.hideDimensionsBadge) {
    drawBoundingBoxDimensions(context, bounds);
  }
}

export function drawDistanceToViewport(context: CanvasRenderingContext2D, bounds: PathBounds) {
  drawVerticalDistance(context, Math.round(bounds.minX + 0.5 * Math.abs(bounds.maxX - bounds.minX)), 0, bounds.minY);
  drawHorizontalDistance(context, Math.round(bounds.minY + 0.5 * Math.abs(bounds.maxY - bounds.minY)), 0, bounds.minX);
  drawBoundingBoxDimensions(context, bounds);
}

/**
 * TODO:
 * - Cover all usecases, currently some distance visualizations are not perfect (e.g. overlapping bounding boxes, badges overlapping on very small distances)
 * - Refactor function to make it easier to understand
 */
export function drawDistanceToElement(
    context: CanvasRenderingContext2D, bounds: PathBounds, distanceBounds: PathBounds) {
  const box = {
    x: bounds.minX,
    y: bounds.minY,
    w: bounds.maxX - bounds.minX,
    h: bounds.maxY - bounds.minY,
  };
  const rect = {
    x: distanceBounds.minX,
    y: distanceBounds.minY,
    w: distanceBounds.maxX - distanceBounds.minX,
    h: distanceBounds.maxY - distanceBounds.minY,
  };

  /* draw vertical distances */
  const rectCenterX = rect.x + 0.5 * rect.w;

  let lowerDistanceRect = rect.y;
  let higherDistanceRect = rect.y + rect.h;

  let lowerDistanceBox = box.y;
  let higherDistanceBox = box.y + box.h;

  const isVerticallyOutside = higherDistanceBox < lowerDistanceRect || lowerDistanceBox > higherDistanceRect;
  const isHorizontallyOutside = box.x + box.w < rect.x || box.x > rect.x + rect.w;
  const hideVerticalDistances = isHorizontallyOutside && !isVerticallyOutside;
  const hideHorizontalDistances = isVerticallyOutside && !isHorizontallyOutside;

  let boxIntersectionX = rectCenterX;
  if (box.x < rect.x && (box.x + box.w) < (rect.x + rect.w)) {
    boxIntersectionX = box.x + box.w - 0.5 * (box.x + box.w - rect.x);
  } else if (box.x >= rect.x && (box.x + box.w) <= (rect.x + rect.w)) {
    boxIntersectionX = box.x + 0.5 * box.w;
  } else if (box.x >= rect.x && (box.x + box.w) > (rect.x + rect.w)) {
    boxIntersectionX = box.x + 0.5 * (rect.x + rect.w - box.x);
  }

  context.save();
  context.strokeStyle = 'rgba(245, 40, 145, 1.0)';

  if (!hideVerticalDistances) {
    if (higherDistanceBox < lowerDistanceRect) {
      drawVerticalDistance(context, rectCenterX, lowerDistanceRect, higherDistanceBox);
    } else if (higherDistanceBox > lowerDistanceRect && lowerDistanceBox < lowerDistanceRect) {
      if (higherDistanceBox < higherDistanceRect) {
        drawVerticalDistance(context, boxIntersectionX, lowerDistanceRect, higherDistanceBox);
      } else if (higherDistanceBox > higherDistanceRect) {
        drawVerticalDistance(context, boxIntersectionX, lowerDistanceRect, lowerDistanceBox);
        drawVerticalDistance(context, boxIntersectionX, higherDistanceRect, higherDistanceBox);
      }
    } else if (lowerDistanceBox > lowerDistanceRect && higherDistanceBox < higherDistanceRect) {
      drawVerticalDistance(context, boxIntersectionX, lowerDistanceRect, lowerDistanceBox);
      drawVerticalDistance(context, boxIntersectionX, higherDistanceRect, higherDistanceBox);
    } else if (lowerDistanceBox > lowerDistanceRect && higherDistanceBox > higherDistanceRect) {
      drawVerticalDistance(context, rectCenterX, higherDistanceRect, lowerDistanceBox);
    }
  }

  /* draw horizontal distance */
  const rectCenterY = rect.y + 0.5 * rect.h;

  lowerDistanceRect = rect.x;
  higherDistanceRect = rect.x + rect.w;

  lowerDistanceBox = box.x;
  higherDistanceBox = box.x + box.w;

  let boxIntersectionY = rectCenterY;
  if (box.y < rect.y && (box.y + box.h) < (rect.y + rect.h)) {
    boxIntersectionY = box.y + box.h - 0.5 * (box.y + box.h - rect.y);
  } else if (box.y >= rect.y && (box.y + box.h) <= (rect.y + rect.h)) {
    boxIntersectionY = box.y + 0.5 * box.h;
  } else if (box.y >= rect.y && (box.y + box.h) > (rect.y + rect.h)) {
    boxIntersectionY = box.y + 0.5 * (rect.y + rect.h - box.y);
  }

  if (!hideHorizontalDistances) {
    if (higherDistanceBox < lowerDistanceRect) {
      drawHorizontalDistance(context, rectCenterY, lowerDistanceRect, higherDistanceBox);
    } else if (higherDistanceBox > lowerDistanceRect && lowerDistanceBox < lowerDistanceRect) {
      if (higherDistanceBox < higherDistanceRect) {
        drawHorizontalDistance(context, boxIntersectionY, lowerDistanceRect, higherDistanceBox);
      } else if (higherDistanceBox > higherDistanceRect) {
        drawHorizontalDistance(context, boxIntersectionY, lowerDistanceRect, lowerDistanceBox);
        drawHorizontalDistance(context, boxIntersectionY, higherDistanceRect, higherDistanceBox);
      }
    } else if (lowerDistanceBox > lowerDistanceRect && higherDistanceBox < higherDistanceRect) {
      drawHorizontalDistance(context, boxIntersectionY, lowerDistanceRect, lowerDistanceBox);
      drawHorizontalDistance(context, boxIntersectionY, higherDistanceRect, higherDistanceBox);
    } else if (lowerDistanceBox > lowerDistanceRect && higherDistanceBox > higherDistanceRect) {
      drawHorizontalDistance(context, rectCenterY, higherDistanceRect, lowerDistanceBox);
    }
  }

  drawBoundingBox(context, distanceBounds, {hideDimensionsBadge: true});

  context.restore();
}
