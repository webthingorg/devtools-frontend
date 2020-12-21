// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const writingModesAffectingFlexDirection = new Set<string>([
  'tb',
  'tb-rl',
  'vertical-lr',
  'vertical-rl',
]);

export const enum PhysicalFlexDirection {
  LEFT_TO_RIGHT = 'left-to-right',
  RIGHT_TO_LEFT = 'right-to-left',
  BOTTOM_TO_TOP = 'bottom-to-top',
  TOP_TO_BOTTOM = 'top-to-bottom'
}


export function reverseDirection(direction: PhysicalFlexDirection): PhysicalFlexDirection {
  if (direction === PhysicalFlexDirection.LEFT_TO_RIGHT) {
    return PhysicalFlexDirection.RIGHT_TO_LEFT;
  }
  if (direction === PhysicalFlexDirection.RIGHT_TO_LEFT) {
    return PhysicalFlexDirection.LEFT_TO_RIGHT;
  }
  if (direction === PhysicalFlexDirection.TOP_TO_BOTTOM) {
    return PhysicalFlexDirection.BOTTOM_TO_TOP;
  }
  if (direction === PhysicalFlexDirection.BOTTOM_TO_TOP) {
    return PhysicalFlexDirection.TOP_TO_BOTTOM;
  }
  throw new Error('Unknown PhysicalFlexDirection');
}

function extendWithReverseDirections(directions: {[x: string]: PhysicalFlexDirection;}):
    {[x: string]: PhysicalFlexDirection;} {
  return {
    ...directions,
    'row-reverse': reverseDirection(directions.row),
    'column-reverse': reverseDirection(directions.column),
  };
}

/**
 * Returns absolute directions for row and column values of flex-direction
 * taking into account the direction and writing-mode attributes.
 */
export function getPhysicalFlexDirections(computedStyles: Map<string, string>): {[x: string]: PhysicalFlexDirection;} {
  const isRtl = computedStyles.get('direction') === 'rtl';
  const writingMode = computedStyles.get('writing-mode');
  const isVertical = writingMode && writingModesAffectingFlexDirection.has(writingMode);

  if (isVertical) {
    return extendWithReverseDirections({
      row: isRtl ? PhysicalFlexDirection.BOTTOM_TO_TOP : PhysicalFlexDirection.TOP_TO_BOTTOM,
      column: writingMode === 'vertical-lr' ? PhysicalFlexDirection.LEFT_TO_RIGHT : PhysicalFlexDirection.RIGHT_TO_LEFT,
    });
  }

  return extendWithReverseDirections({
    row: isRtl ? PhysicalFlexDirection.RIGHT_TO_LEFT : PhysicalFlexDirection.LEFT_TO_RIGHT,
    column: PhysicalFlexDirection.TOP_TO_BOTTOM,
  });
}

/**
 * Rotates the flex direction icon in such way that it indicates
 * the desired `direction` and the arrow in the icon is always at the bottom
 * or at the right.
 *
 * By default, the icon is pointing top-down with the arrow on the right-hand side.
 */
export function rotateFlexDirectionIcon(direction: PhysicalFlexDirection): IconInfo {
  // Default to LTR.
  let flipX: false|true = true;
  let flipY: false|true = false;
  let rotate: 90|0|- 90 = -90;

  if (direction === PhysicalFlexDirection.RIGHT_TO_LEFT) {
    rotate = 90;
    flipY = false;
    flipX = false;
  } else if (direction === PhysicalFlexDirection.TOP_TO_BOTTOM) {
    rotate = 0;
    flipX = false;
    flipY = false;
  } else if (direction === PhysicalFlexDirection.BOTTOM_TO_TOP) {
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

export function rotateAlignContentIcon(iconName: string, direction: PhysicalFlexDirection): IconInfo {
  return {
    iconName,
    rotate: direction === PhysicalFlexDirection.RIGHT_TO_LEFT ?
        90 :
        (direction === PhysicalFlexDirection.LEFT_TO_RIGHT ? -90 : 0),
    scaleX: 1,
    scaleY: 1,
  };
}

export function rotateJustifyContentIcon(iconName: string, direction: PhysicalFlexDirection): IconInfo {
  return {
    iconName,
    rotate: direction === PhysicalFlexDirection.TOP_TO_BOTTOM ?
        90 :
        (direction === PhysicalFlexDirection.BOTTOM_TO_TOP ? -90 : 0),
    scaleX: direction === PhysicalFlexDirection.RIGHT_TO_LEFT ? -1 : 1,
    scaleY: 1,
  };
}

export function rotateAlignItemsIcon(iconName: string, direction: PhysicalFlexDirection): IconInfo {
  return {
    iconName,
    rotate: direction === PhysicalFlexDirection.RIGHT_TO_LEFT ?
        90 :
        (direction === PhysicalFlexDirection.LEFT_TO_RIGHT ? -90 : 0),
    scaleX: 1,
    scaleY: 1,
  };
}

function flexDirectionIcon(value: string): (arg0: Map<string, string>) => IconInfo {
  function getIcon(computedStyles: Map<string, string>): IconInfo {
    const directions = getPhysicalFlexDirections(computedStyles);
    return rotateFlexDirectionIcon(directions[value]);
  }
  return getIcon;
}

function flexAlignContentIcon(iconName: string): (arg0: Map<string, string>) => IconInfo {
  function getIcon(computedStyles: Map<string, string>): IconInfo {
    const directions = getPhysicalFlexDirections(computedStyles);
    /**
     * @type {!Map<string, !PhysicalFlexDirection>}
     */
    const flexDirectionToPhysicalDirection = new Map([
      ['column', directions.row],
      ['row', directions.column],
      ['column-reverse', directions.row],
      ['row-reverse', directions.column],
    ]);
    const computedFlexDirection = computedStyles.get('flex-direction') || 'row';
    const iconDirection = flexDirectionToPhysicalDirection.get(computedFlexDirection);
    if (!iconDirection) {
      throw new Error('Unknown direction for flex-align icon');
    }
    return rotateAlignContentIcon(iconName, iconDirection);
  }
  return getIcon;
}

function flexJustifyContentIcon(iconName: string): (arg0: Map<string, string>) => IconInfo {
  function getIcon(computedStyles: Map<string, string>): IconInfo {
    const directions = getPhysicalFlexDirections(computedStyles);
    return rotateJustifyContentIcon(iconName, directions[computedStyles.get('flex-direction') || 'row']);
  }
  return getIcon;
}

function flexAlignItemsIcon(iconName: string): (arg0: Map<string, string>) => IconInfo {
  function getIcon(computedStyles: Map<string, string>): IconInfo {
    const directions = getPhysicalFlexDirections(computedStyles);
    /**
     * @type {!Map<string, !PhysicalFlexDirection>}
     */
    const flexDirectionToPhysicalDirection = new Map([
      ['column', directions.row],
      ['row', directions.column],
      ['column-reverse', directions.row],
      ['row-reverse', directions.column],
    ]);
    const computedFlexDirection = computedStyles.get('flex-direction') || 'row';
    const iconDirection = flexDirectionToPhysicalDirection.get(computedFlexDirection);
    if (!iconDirection) {
      throw new Error('Unknown direction for flex-align icon');
    }
    return rotateAlignItemsIcon(iconName, iconDirection);
  }
  return getIcon;
}

/**
 * The baseline icon contains the letter A to indicate that we're aligning based on where the text baseline is.
 * Therefore we're not rotating this icon like the others, as this would become confusing. Plus baseline alignment
 * is likely only really useful in horizontal flow cases.
 */
function baselineIcon(): IconInfo {
  return {
    iconName: 'baseline-icon',
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
  };
}

/**
 *):!IconInfo}
 */
function flexAlignSelfIcon(iconName: string): (arg0: Map<string, string>, arg1: Map<string, string>) => any {
  function getIcon(computedStyles: Map<string, string>, parentComputedStyles: Map<string, string>): IconInfo {
    return flexAlignItemsIcon(iconName)(parentComputedStyles);
  }
  return getIcon;
}

/**
 * @type {!Map<string, function(!Map<string, string>, !Map<string, string>):!IconInfo>}
 */
const textToIconResolver = new Map([
  ['flex-direction: row', flexDirectionIcon('row')],
  ['flex-direction: column', flexDirectionIcon('column')],
  ['flex-direction: column-reverse', flexDirectionIcon('column-reverse')],
  ['flex-direction: row-reverse', flexDirectionIcon('row-reverse')],
  ['flex-direction: initial', flexDirectionIcon('row')],
  ['flex-direction: unset', flexDirectionIcon('row')],
  ['flex-direction: revert', flexDirectionIcon('row')],
  ['align-content: center', flexAlignContentIcon('flex-align-content-center-icon')],
  ['align-content: space-around', flexAlignContentIcon('flex-align-content-space-around-icon')],
  ['align-content: space-between', flexAlignContentIcon('flex-align-content-space-between-icon')],
  ['align-content: stretch', flexAlignContentIcon('flex-align-content-stretch-icon')],
  ['align-content: space-evenly', flexAlignContentIcon('flex-align-content-space-evenly-icon')],
  ['align-content: flex-end', flexAlignContentIcon('flex-align-content-end-icon')],
  ['align-content: flex-start', flexAlignContentIcon('flex-align-content-start-icon')],
  // TODO(crbug.com/1139945): Start & end should be enabled once Chromium supports them for flexbox.
  // ['align-content: start', flexAlignContentIcon('flex-align-content-start-icon')],
  // ['align-content: end', flexAlignContentIcon('flex-align-content-end-icon')],
  ['align-content: normal', flexAlignContentIcon('flex-align-content-stretch-icon')],
  ['align-content: revert', flexAlignContentIcon('flex-align-content-stretch-icon')],
  ['align-content: unset', flexAlignContentIcon('flex-align-content-stretch-icon')],
  ['align-content: initial', flexAlignContentIcon('flex-align-content-stretch-icon')],
  ['justify-content: center', flexJustifyContentIcon('flex-justify-content-center-icon')],
  ['justify-content: space-around', flexJustifyContentIcon('flex-justify-content-space-around-icon')],
  ['justify-content: space-between', flexJustifyContentIcon('flex-justify-content-space-between-icon')],
  ['justify-content: space-evenly', flexJustifyContentIcon('flex-justify-content-space-evenly-icon')],
  ['justify-content: flex-end', flexJustifyContentIcon('flex-justify-content-flex-end-icon')],
  ['justify-content: flex-start', flexJustifyContentIcon('flex-justify-content-flex-start-icon')],
  ['align-items: stretch', flexAlignItemsIcon('flex-align-items-stretch-icon')],
  ['align-items: flex-end', flexAlignItemsIcon('flex-align-items-flex-end-icon')],
  ['align-items: flex-start', flexAlignItemsIcon('flex-align-items-flex-start-icon')],
  ['align-items: center', flexAlignItemsIcon('flex-align-items-center-icon')],
  ['align-items: baseline', baselineIcon],
  ['align-content: baseline', baselineIcon],
  ['align-self: baseline', baselineIcon],
  ['align-self: center', flexAlignSelfIcon('flex-align-self-center-icon')],
  ['align-self: flex-start', flexAlignSelfIcon('flex-align-self-flex-start-icon')],
  ['align-self: flex-end', flexAlignSelfIcon('flex-align-self-flex-end-icon')],
  ['align-self: stretch', flexAlignSelfIcon('flex-align-self-stretch-icon')],
]);

export function findIcon(
    text: string, computedStyles: Map<string, string>|null,
    parentComputedStyles?: Map<string, string>|null|undefined): IconInfo|null {
  const resolver = textToIconResolver.get(text);
  if (resolver) {
    return resolver(computedStyles || new Map(), parentComputedStyles || new Map());
  }
  return null;
}
export interface IconInfo {
  iconName: string;
  rotate: number;
  scaleX: number;
  scaleY: number;
}
