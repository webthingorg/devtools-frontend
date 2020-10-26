// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const writingModesAffectingFlexDirection = new Set([
  'tb',
  'tb-rl',
  'vertical-lr',
  'vertical-rl',
]);

/**
 * Returns absolute directions for row and column values of flex-direction
 * taking into account the direction and writing-mode attributes.
 *
 * @param {!Map<string, string>} computedStyles
 * @return {!{row: string, column: string}}
 */
export function getActualFlexDirections(computedStyles) {
  const isRtl = computedStyles.get('direction') === 'rtl';
  const writingMode = computedStyles.get('writing-mode');
  const isVertical = writingMode && writingModesAffectingFlexDirection.has(writingMode);

  if (isRtl && !isVertical) {
    return {
      row: 'right-to-left',
      column: 'top-to-bottom',
    };
  }

  if (isRtl && isVertical) {
    return {
      row: 'bottom-to-top',
      column: writingMode === 'vertical-lr' ? 'left-to-right' : 'right-to-left',
    };
  }

  if (!isRtl && isVertical) {
    return {
      row: 'top-to-bottom',
      column: writingMode === 'vertical-lr' ? 'left-to-right' : 'right-to-left',
    };
  }

  return {
    row: 'left-to-right',
    column: 'top-to-bottom',
  };
}

/**
 * Rotates the flex direction icon in such way that it indicates
 * the desired `direction` and the arrow in the icon is always at the bottom
 * or at the right.
 *
 * By default, the icon is pointing top-down with the arrow on the right-hand side.
 *
 * @param {string} direction
 * @return {!IconInfo}
 */
export function rotateFlexDirectionIcon(direction) {
  // Default to LTR.
  let flipX = true;
  let flipY = false;
  let rotate = -90;

  if (direction === 'right-to-left') {
    rotate = 90;
    flipY = false;
    flipX = false;
  } else if (direction === 'top-to-bottom') {
    rotate = 0;
    flipX = false;
    flipY = false;
  } else if (direction === 'bottom-to-top') {
    rotate = 0;
    flipX = false;
    flipY = true;
  }

  return {
    iconName: 'flex-direction-icon',
    rotate: rotate,
    scaleX: flipX ? -1 : 1,
    scaleY: flipY ? -1 : 1,
  };
}

/**
 * @param {!Map<string, string>} computedStyles
 * @return {!IconInfo}
 */
function flexDirectionRowIcon(computedStyles) {
  const directions = getActualFlexDirections(computedStyles);
  return rotateFlexDirectionIcon(directions.row);
}

/**
 * @param {!Map<string, string>} computedStyles
 * @return {!IconInfo}
 */
function flexDirectionColumnIcon(computedStyles) {
  const directions = getActualFlexDirections(computedStyles);
  return rotateFlexDirectionIcon(directions.column);
}

/**
 * @param {!Map<string, string>} computedStyles
 * @return {!IconInfo}
 */
function flexDirectionColumnReverseIcon(computedStyles) {
  const info = flexDirectionColumnIcon(computedStyles);
  info.scaleY *= -1;
  return info;
}

/**
 * @param {!Map<string, string>} computedStyles
 * @return {!IconInfo}
 */
function flexDirectionRowReverseIcon(computedStyles) {
  const info = flexDirectionRowIcon(computedStyles);
  info.scaleY *= -1;
  return info;
}


/**
 * @type {!Map<string, function(!Map<string, string>):!IconInfo>}
 */
const textToIconResolver = new Map();

textToIconResolver.set('flex-direction: row', flexDirectionRowIcon);
textToIconResolver.set('flex-direction: column', flexDirectionColumnIcon);
textToIconResolver.set('flex-direction: column-reverse', flexDirectionColumnReverseIcon);
textToIconResolver.set('flex-direction: row-reverse', flexDirectionRowReverseIcon);

/**
 * @param {string} text
 * @param {!Map<string, string>} computedStyles
 * @return {?IconInfo}
 */
export function findIcon(text, computedStyles) {
  const resolver = textToIconResolver.get(text);
  if (resolver) {
    return resolver(computedStyles);
  }
  return null;
}

/**
 * @typedef {{
 *  iconName: string,
 *  rotate: number,
 *  scaleX: number,
 *  scaleY: number,
 * }}
 */
// @ts-ignore typedef
export let IconInfo;
