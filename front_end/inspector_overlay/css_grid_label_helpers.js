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

export function drawGridNumbers(config, bounds) {
  const labelContainer = document.getElementById('grid-label-container');
  labelContainer.removeChildren();
  if (config.columnNumberOffsets) {
    // Calculate minimum space between labels
    let i = 1;
    const firstOffset = config.columnNumberOffsets[0];
    for (const offset of config.columnNumberOffsets) {
      _placeColumnLabel(
        labelContainer, i, bounds.minX + offset - firstOffset, bounds.minY, offset === config.columnNumberOffsets[0],
        offset === config.columnNumberOffsets[config.columnNumberOffsets.length]);
      i += 1;
    }
  }
  if (config.rowNumberOffsets) {
    let i = 1;
    const firstOffset = config.rowNumberOffsets[0];
    for (const offset of config.rowNumberOffsets) {
      _placeRowLabel(
        labelContainer, i, bounds.minX, bounds.minY + offset - firstOffset, offset === config.rowNumberOffsets[0],
        offset === config.rowNumberOffsets[config.rowNumberOffsets.length], bounds.minY < 20);
      i += 1;
    }
  }
}

function _placeRowLabel(labelLayer, label, x, y, isTopRow, isBottomRow, avoidColumnFlip) {
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

  let titleWidth = labelContent.getBoundingClientRect().width;
  if (titleWidth % 2 === 1) {
    titleWidth += 1;
    labelContent.style.width = titleWidth + 'px';
  }
  const titleHeight = labelContent.getBoundingClientRect().height;
  const labelParams = _getLabelPositionsByArrowType(arrowType, x, y, titleWidth, titleHeight);

  if (avoidColumnFlip && isTopRow) {
    labelParams.contentLeft += gridLabelMinWidth;
  }
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

  let titleWidth = labelContent.getBoundingClientRect().width;
  if (titleWidth % 2 === 1) {
    titleWidth += 1;
    labelContent.style.width = titleWidth + 'px';
  }
  const titleHeight = labelContent.getBoundingClientRect().height;
  const labelParams = _getLabelPositionsByArrowType(arrowType, x, y, titleWidth, titleHeight);

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

function _getLabelPositionsByArrowType(arrowType, x, y, titleWidth, titleHeight) {
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
      contentTop = y - (titleHeight / 2);
      contentLeft = x + arrowWidth;
      arrowTop = (titleHeight / 2) - (arrowHeight / 2);
      arrowLeft = -arrowWidth;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft + 1;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.leftBottom:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - titleHeight;
      contentLeft = x + arrowWidth;
      arrowTop = titleHeight - arrowHeight - 1;
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
      contentLeft = x - arrowWidth - titleWidth;
      arrowTop = -1;
      arrowLeft = titleWidth - 1;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft - 1;
      borderRadius = '2px 0px 2px 2px';
      arrowInnerShadow = 'inset 0px 1px 0px 0px white';
      break;
    case GridArrowTypes.rightMid:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure * 2;
      contentTop = y - (titleHeight / 2);
      contentLeft = x - arrowWidth - titleWidth;
      arrowTop = (titleHeight / 2) - (arrowHeight / 2);
      arrowLeft = titleWidth - 1;
      arrowInnerTop = arrowTop;
      arrowInnerLeft = arrowLeft - 1;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.rightBottom:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - titleHeight;
      contentLeft = x - titleWidth - arrowWidth;
      arrowTop = titleHeight - arrowHeight - 1;
      arrowLeft = titleWidth - 1;
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
      contentLeft = x - (titleWidth / 2);
      arrowTop = -arrowHeight;
      arrowLeft = (titleWidth / 2) - (arrowWidth / 2) - 1;
      arrowInnerTop = arrowTop + 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.topRight:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y + arrowHeight;
      contentLeft = x - titleWidth;
      arrowTop = -arrowHeight;
      arrowLeft = titleWidth - arrowWidth - 1;
      arrowInnerTop = arrowTop + 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px 0px 2px 2px';
      arrowInnerShadow = 'inset -1px 0px 0px 0px white';
      break;
    case GridArrowTypes.bottomLeft:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - titleHeight;
      contentLeft = x;
      arrowTop = titleHeight - 1;
      arrowLeft = -1;
      arrowInnerTop = arrowTop - 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px 2px 2px 0px';
      arrowInnerShadow = 'inset 1px 0px 0px 0px white';
      break;
    case GridArrowTypes.bottomMid:
      arrowWidth = gridArrowBaseMeasure * 2;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - titleHeight;
      contentLeft = x - (titleWidth / 2);
      arrowTop = titleHeight - 1;
      arrowLeft = (titleWidth / 2) - (arrowWidth / 2) - 1;
      arrowInnerTop = arrowTop - 1;
      arrowInnerLeft = arrowLeft;
      borderRadius = '2px';
      arrowInnerShadow = '';
      break;
    case GridArrowTypes.bottomRight:
      arrowWidth = gridArrowBaseMeasure;
      arrowHeight = gridArrowBaseMeasure;
      contentTop = y - arrowHeight - titleHeight;
      contentLeft = x - titleWidth;
      arrowTop = titleHeight - 1;
      arrowLeft = titleWidth - arrowWidth - 1;
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