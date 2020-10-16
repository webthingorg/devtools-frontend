// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as CssOverviewModule from '../css_overview/css_overview.js';
import * as SDK from '../sdk/sdk.js';

/** @type {!RegExp} */
export const FontPropertiesRegex = /[a-zA-Z-]+|-?(\.)?(?(1)[0-9]+|[0-9]*)(\.)?(?(2)[0-9]+|[0-9]*)[a-zA-Z%]{0,4}/;
/** @type {!RegExp} */
export const FontFamilyRegex = /"[\w \,]+"|'[\w \,]+'|[\w \,]+/;

const fontSizeRegex = /(^[\d\.]+)([a-zA-Z%]+)/;
const lineHeightRegex = /(^[\d\.]+)([a-zA-Z%]*)/;
const fontWeightRegex = /(^[\d\.]+)/;
const letterSpacingRegex = /([-0-9\.]+)([a-zA-Z%]+)/;

const fontSizeUnits = ['px', 'em', 'rem', '%', 'vh', 'vw'];
const lineHeightUnits = ['', 'px', 'em', '%'];
const letterSpacingUnits = ['em', 'rem', 'px'];

const fontSizeValues = [
  '',
  'medium',
  'xx-small',
  'x-small',
  'small',
  'large',
  'x-large',
  'xx-large',
  'smaller',
  'larger',
];
const lineHeightValues = ['', 'normal'];
const fontWeightValues = ['', 'normal', 'bold', 'bolder', 'lighter'];
const letterSpacingValues = ['', 'normal'];

export const GlobalValues = ['inherit', 'initial', 'unset'];

fontSizeValues.push(...GlobalValues);
lineHeightValues.push(...GlobalValues);
fontWeightValues.push(...GlobalValues);
letterSpacingValues.push(...GlobalValues);

const fontSizeRangeMap = new Map([
  // Common Units
  ['px', {min: 0, max: 72, step: 1}], ['em', {min: 0, max: 4.5, step: .1}], ['rem', {min: 0, max: 4.5, step: .1}],
  ['%', {min: 0, max: 450, step: 1}], ['vh', {min: 0, max: 10, step: .1}], ['vw', {min: 0, max: 10, step: .1}],

  // Extra Units
  ['vmin', {min: 0, max: 10, step: .1}], ['vmax', {min: 0, max: 10, step: .1}], ['cm', {min: 0, max: 2, step: .1}],
  ['mm', {min: 0, max: 20, step: .1}], ['in', {min: 0, max: 1, step: .01}], ['pt', {min: 0, max: 54, step: 1}],
  ['pc', {min: 0, max: 4.5, step: .1}]
]);

const lineHeightRangeMap = new Map([
  // Common Units
  ['', {min: 0, max: 2, step: .1}], ['em', {min: 0, max: 2, step: .1}], ['%', {min: 0, max: 200, step: 1}],
  ['px', {min: 0, max: 32, step: 1}],

  // Extra Units
  ['rem', {min: 0, max: 2, step: .1}], ['vh', {min: 0, max: 4.5, step: .1}], ['vw', {min: 0, max: 4.5, step: .1}],
  ['vmin', {min: 0, max: 4.5, step: .1}], ['vmax', {min: 0, max: 4.5, step: .1}], ['cm', {min: 0, max: 1, step: .1}],
  ['mm', {min: 0, max: 8.5, step: .1}], ['in', {min: 0, max: .5, step: .1}], ['pt', {min: 0, max: 24, step: 1}],
  ['pc', {min: 0, max: 2, step: .1}]
]);

const fontWeightRangeMap = new Map([
  ['', {min: 100, max: 700, step: 100}],
]);

const letterSpacingRangeMap = new Map([
  // Common Units
  ['px', {min: -10, max: 10, step: .01}], ['em', {min: -0.625, max: 0.625, step: .001}],
  ['rem', {min: -0.625, max: 0.625, step: .001}],

  // Extra Units
  ['%', {min: -62.5, max: 62.5, step: .1}], ['vh', {min: -1.5, max: 1.5, step: .01}],
  ['vw', {min: -1.5, max: 1.5, step: .01}], ['vmin', {min: -1.5, max: 1.5, step: .01}],
  ['vmax', {min: -1.5, max: 1.5, step: .01}], ['cm', {min: -0.25, max: .025, step: .001}],
  ['mm', {min: -2.5, max: 2.5, step: .01}], ['in', {min: -0.1, max: 0.1, step: .001}],
  ['pt', {min: -7.5, max: 7.5, step: .01}], ['pc', {min: -0.625, max: 0.625, step: .001}]
]);

export const FontSizeStaticParams = {
  regex: fontSizeRegex,
  unitsArray: fontSizeUnits,
  valueArray: fontSizeValues,
  rangeMap: fontSizeRangeMap
};

export const LineHeightStaticParams = {
  regex: lineHeightRegex,
  unitsArray: lineHeightUnits,
  valueArray: lineHeightValues,
  rangeMap: lineHeightRangeMap
};

export const FontWeightStaticParams = {
  regex: fontWeightRegex,
  valueArray: fontWeightValues,
  rangeMap: fontWeightRangeMap
};

export const LetterSpacingStaticParams = {
  regex: letterSpacingRegex,
  unitsArray: letterSpacingUnits,
  valueArray: letterSpacingValues,
  rangeMap: letterSpacingRangeMap
};

export const SystemFonts = [
  'Arial',
  'Bookman',
  'Candara',
  'Comic Sans MS',
  'Courier New',
  'Garamond',
  'Georgia',
  'Helvetica',
  'Impact',
  'Palatino',
  'Roboto',
  'Times New Roman',
  'Verdana',
];

export const GenericFonts = [
  'serif',
  'sans-serif',
  'monspace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
];

/**
 * @return {!Promise<!Array<{name: string, value: string}>>}
 */
export async function generateComputedFontArray() {
  const [model] = SDK.SDKModel.TargetManager.instance().models(CssOverviewModule.CSSOverviewModel.CSSOverviewModel);
  const {fontInfo} = await Promise.resolve(model.getNodeStyleStats());
  const computedFontArray = Array.from(fontInfo.keys());
  return computedFontArray;
}
