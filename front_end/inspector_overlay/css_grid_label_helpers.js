// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

const GridArrowTypes = {
  leftTop: 'var(--arrow-left-top)',
  leftMid: 'var(--arrow-left-mid)',
  leftBottom: 'var(--arrow-left-bottom)',
  topLeft: 'var(--arrow-top-left)',
  topMid: 'var(--arrow-top-mid)',
  topRight: 'var(--arrow-top-right)',
  rightTop: 'var(--arrow-right-top)',
  rightMid: 'var(--arrow-right-mid)',
  rightBottom: 'var(--arrow-right-bottom)',
  bottomLeft: 'var(--arrow-bottom-left)',
  bottomMid: 'var(--arrow-bottom-mid)',
  bottomRight: 'var(--arrow-bottom-right)',
};
const gridArrowBaseMeasure = 3;
const gridPageMargin = 20;
const gridLabelMinWidth = 10;
/** @typedef {!{contentTop: number, contentLeft: number, arrowWidth: number, arrowHeight: number, arrowTop: number, arrowLeft: number, arrowInnerTop: number, arrowInnerLeft: number, borderRadius: string, arrowInnerShadow: string}} */
let GridLabelCSSParams;  // eslint-disable-line no-unused-vars

/**
 * Places the grid row and column labels on the overlay.
 * Currently only positive labels are supported.
 *
 * @param {Object} config
 * @param {Object} bounds
 */
export function drawGridNumbers(config, bounds) {
  const labelContainer = document.getElementById('grid-label-container');
  labelContainer.removeChildren();
  if (config.columnNumberOffsets) {
    let i = 1;
    const firstOffset = config.columnNumberOffsets[0];
    for (const offset of config.columnNumberOffsets) {
      const isFirstColumn = offset === config.columnNumberOffsets[0];
      const isLastColumn = offset === config.columnNumberOffsets[config.columnNumberOffsets.length];
      _placeColumnLabel(
          labelContainer, i.toString(), bounds.minX + offset - firstOffset, bounds.minY, isFirstColumn, isLastColumn);
      i += 1;
    }
  }
  if (config.rowNumberOffsets) {
    let i = 1;
    const firstOffset = config.rowNumberOffsets[0];
    for (const offset of config.rowNumberOffsets) {
      const isTopRow = offset === config.rowNumberOffsets[0];
      const isBottomRow = offset === config.rowNumberOffsets[config.rowNumberOffsets.length];
      const avoidColumnLabel = bounds.minY < gridPageMargin;
      _placeRowLabel(
          labelContainer, i.toString(), bounds.minX, bounds.minY + offset - firstOffset, isTopRow, isBottomRow,
          avoidColumnLabel);
      i += 1;
    }
  }
}

/**
 * Places the grid row labels on the overlay.
 *
 * @param {HTMLElement} labelLayer
 * @param {string} label
 * @param {number} x
 * @param {number} y
 * @param {boolean} isTopRow
 * @param {boolean} isBottomRow
 * @param {boolean} avoidColumnLabel
 */
function _placeRowLabel(labelLayer, label, x, y, isTopRow, isBottomRow, avoidColumnLabel) {
  const labelContainer = labelLayer.createChild('div');
  const labelContent = labelContainer.createChild('div', 'grid-label-content');
  labelContent.textContent = label;

  let arrowType = GridArrowTypes.rightMid;

  // Flip inside if too close to page margin
  if (x < gridPageMargin) {
    if (isTopRow) {
      arrowType = GridArrowTypes.leftTop;
    } else if (isBottomRow) {
      arrowType = GridArrowTypes.leftBottom;
    } else {
      arrowType = GridArrowTypes.leftMid;
    }
  } else if (isTopRow) {
    // Shift down to avoid column label
    arrowType = GridArrowTypes.rightTop;
  } else if (isBottomRow && (canvasHeight - y) < gridPageMargin) {
    // Shift up to keep on page
    arrowType = GridArrowTypes.rightBottom;
  }

  const labelWidth = _getAdjustedLabelWidth(labelContent);
  const labelHeight = labelContent.getBoundingClientRect().height;
  const labelParams = _getLabelPositionsByArrowType(arrowType, x, y, labelWidth, labelHeight);

  if (avoidColumnLabel && isTopRow) {
    // Move top left corner row label to avoid column label.
    labelParams.contentLeft += gridLabelMinWidth;
  }
  _setLabelCSSProperties(labelContent, arrowType, labelParams);
}

/**
 * Places the grid column labels on the overlay.
 *
 * @param {HTMLElement} labelLayer
 * @param {string} label
 * @param {number} x
 * @param {number} y
 * @param {boolean} isFirstColumn
 * @param {boolean} isLastColumn
 */
function _placeColumnLabel(labelLayer, label, x, y, isFirstColumn, isLastColumn) {
  const labelContainer = labelLayer.createChild('div');
  const labelContent = labelContainer.createChild('div', 'grid-label-content');
  labelContent.textContent = label;

  let arrowType = GridArrowTypes.bottomMid;

  // Move label to avoid margins of page
  if (y < gridPageMargin) {
    if (isFirstColumn) {
      arrowType = GridArrowTypes.topLeft;
    } else if (isLastColumn) {
      arrowType = GridArrowTypes.topRight;
    } else {
      arrowType = GridArrowTypes.topMid;
    }
  } else if (isLastColumn && (canvasWidth - x) < gridPageMargin) {
    arrowType = GridArrowTypes.bottomRight;
  } else if (isFirstColumn && x < gridPageMargin) {
    arrowType = GridArrowTypes.bottomLeft;
  }

  const labelWidth = _getAdjustedLabelWidth(labelContent);
  const labelHeight = labelContent.getBoundingClientRect().height;
  const labelParams = _getLabelPositionsByArrowType(arrowType, x, y, labelWidth, labelHeight);
  _setLabelCSSProperties(labelContent, arrowType, labelParams);
}

/**
 * Forces the width of the provided grid label element to be an even
 * number of pixels to allow centered placement of the arrow
 *
 * @param {HTMLElement} labelContent
 * @returns {number}
 */
function _getAdjustedLabelWidth(labelContent) {
  let labelWidth = labelContent.getBoundingClientRect().width;
  if (labelWidth % 2 === 1) {
    labelWidth += 1;
    labelContent.style.width = labelWidth + 'px';
  }
  return labelWidth;
}

/**
 * @param {HTMLElement} labelContent
 * @param {string} arrowType
 * @param {Object} labelParams
 */
function _setLabelCSSProperties(labelContent, arrowType, labelParams) {
  labelContent.style.setProperty('--arrow', arrowType);
  labelContent.style.left = labelParams.contentLeft + 'px';
  labelContent.style.top = labelParams.contentTop + 'px';
  labelContent.style.setProperty('--arrow-top', labelParams.arrowTop + 'px');
  labelContent.style.setProperty('--arrow-left', labelParams.arrowLeft + 'px');
  labelContent.style.setProperty('--arrow-width', labelParams.arrowWidth + 'px');
  labelContent.style.setProperty('--arrow-height', labelParams.arrowHeight + 'px');
  labelContent.style.setProperty('--arrow-inner-top', labelParams.arrowInnerTop + 'px');
  labelContent.style.setProperty('--arrow-inner-left', labelParams.arrowInnerLeft + 'px');
  labelContent.style.setProperty('--border-radius', labelParams.borderRadius);
  labelContent.style.setProperty('--arrow-inner-shadow', labelParams.arrowInnerShadow);
}

/**
 * Returns the required properties needed to place a label arrow based on the
 * arrow type and dimensions of the label
 *
 * @param {string} arrowType
 * @param {number} x
 * @param {number} y
 * @param {number} labelWidth
 * @param {number} labelHeight
 * @returns {GridLabelCSSParams}
 */
function _getLabelPositionsByArrowType(arrowType, x, y, labelWidth, labelHeight) {
  let contentTop;
  let contentLeft;
  let arrowWidth;
  let arrowHeight;
  let arrowTop;
  let arrowLeft;
  let arrowInnerTop;
  let arrowInnerLeft;
  let borderRadius;
  let arrowInnerShadow;
  switch (arrowType) {
    case GridArrowTypes.leftTop:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y;
      contentLeft = x + arrowWidth;
      arrowTop = -1;
      arrowLeft = -arrowWidth;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft + 1;
      borderRadius = '0px 2px 2px 2px';
      arrowInnerShadow = 'inset 0px 1px 0px 0px white';
      break;
    case GridArrowTypes.leftMid:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure * 2;
      contentTop = y - (labelHeight / 2);
      contentLeft = x + arrowWidth;
      arrowTop = (labelHeight / 2) - (arrowHeight / 2);
      arrowLeft = -arrowWidth;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft + 1;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.leftBottom:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - labelHeight;
      contentLeft = x + arrowWidth;
      arrowTop = labelHeight - arrowHeight - 1;
      arrowLeft = -arrowWidth;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft + 1;
      borderRadius = '2px 2px 2px 0px';
      arrowInnerShadow = 'inset 0px -1px 0px 0px white';
      break;
    case GridArrowTypes.rightTop:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y;
      contentLeft = x - arrowWidth - labelWidth;
      arrowTop = -1;
      arrowLeft = labelWidth - 1;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft - 1;
      borderRadius = '2px 0px 2px 2px';
      arrowInnerShadow = 'inset 0px 1px 0px 0px white';
      break;
    case GridArrowTypes.rightMid:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure * 2;
      contentTop = y - (labelHeight / 2);
      contentLeft = x - arrowWidth - labelWidth;
      arrowTop = (labelHeight / 2) - (arrowHeight / 2);
      arrowLeft = labelWidth - 1;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft - 1;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.rightBottom:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - labelHeight;
      contentLeft = x - labelWidth - arrowWidth;
      arrowTop = labelHeight - arrowHeight - 1;
      arrowLeft = labelWidth - 1;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft - 1;
      borderRadius = '2px 2px 0px 2px';
      arrowInnerShadow = 'inset 0px -1px 0px 0px white';
      break;
    case GridArrowTypes.topLeft:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y + arrowHeight;
      contentLeft = x;
      arrowTop = -arrowHeight;
      arrowLeft = -1;
      arrowInnerTop = arrowTop + 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '0px 2px 2px 2px';
      arrowInnerShadow = 'inset 1px 0px 0px 0px white';
      break;
    case GridArrowTypes.topMid:
      arrowWidth = gridArrowBaseMeasure * 2;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y + arrowHeight;
      contentLeft = x - (labelWidth / 2);
      arrowTop = -arrowHeight;
      arrowLeft = (labelWidth / 2) - (arrowWidth / 2) - 1;
      arrowInnerTop = arrowTop + 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.topRight:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y + arrowHeight;
      contentLeft = x - labelWidth;
      arrowTop = -arrowHeight;
      arrowLeft = labelWidth - arrowWidth - 1;
      arrowInnerTop = arrowTop + 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px 0px 2px 2px';
      arrowInnerShadow = 'inset -1px 0px 0px 0px white';
      break;
    case GridArrowTypes.bottomLeft:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - labelHeight;
      contentLeft = x;
      arrowTop = labelHeight - 1;
      arrowLeft = -1;
      arrowInnerTop = arrowTop - 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px 2px 2px 0px';
      arrowInnerShadow = 'inset 1px 0px 0px 0px white';
      break;
    case GridArrowTypes.bottomMid:
      arrowWidth = gridArrowBaseMeasure * 2;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - labelHeight;
      contentLeft = x - (labelWidth / 2);
      arrowTop = labelHeight - 1;
      arrowLeft = (labelWidth / 2) - (arrowWidth / 2) - 1;
      arrowInnerTop = arrowTop - 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.bottomRight:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - labelHeight;
      contentLeft = x - labelWidth;
      arrowTop = labelHeight - 1;
      arrowLeft = labelWidth - arrowWidth - 1;
      arrowInnerTop = arrowTop - 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px 2px 0px 2px';
      arrowInnerShadow = 'inset -1px 0px 0px 0px white';
      break;
  }

  return {
    contentTop,
    contentLeft,
    arrowWidth,
    arrowHeight,
    arrowTop,
    arrowLeft,
    arrowInnerTop,
    arrowInnerLeft,
    borderRadius,
    arrowInnerShadow,
  };
}
