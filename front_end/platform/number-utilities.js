// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';
export const UIStrings = {
  /**
  *@description Text to show how many bytes the data size is.
  *@example {2} PH1
  */
  fb: '{PH1} B',
  /**
  *@description Text to show how many kilobytes the data size is.
  *@example {5.1} PH1
  */
  fkb: '{PH1} kB',
  /**
  *@description Text to show how many megabytes the data size is.
  *@example {2.1} PH1
  */
  fmb: '{PH1} MB',
};
const str_ = i18n.i18n.registerUIStrings('platform/number-utilities.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export const clamp = (num, min, max) => {
  let clampedNumber = num;
  if (num < min) {
    clampedNumber = min;
  } else if (num > max) {
    clampedNumber = max;
  }
  return clampedNumber;
};

/**
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
export const mod = (m, n) => {
  return ((m % n) + n) % n;
};

/**
 * @param {number} bytes
 * @return {string}
 */
export const bytesToString = bytes => {
  if (bytes < 1000) {
    return i18nString(UIStrings.fb, {PH1: bytes.toFixed(0)});
  }

  const kilobytes = bytes / 1000;
  if (kilobytes < 100) {
    return i18nString(UIStrings.fkb, {PH1: kilobytes.toFixed(1)});
  }
  if (kilobytes < 1000) {
    return i18nString(UIStrings.fkb, {PH1: kilobytes.toFixed(0)});
  }

  const megabytes = kilobytes / 1000;
  if (megabytes < 100) {
    return i18nString(UIStrings.fmb, {PH1: megabytes.toFixed(1)});
  }
  return i18nString(UIStrings.fmb, {PH1: megabytes.toFixed(0)});
};

/**
 * @param {string} value
 * @return {string}
 */
export const toFixedIfFloating = value => {
  if (!value || Number.isNaN(Number(value))) {
    return value;
  }
  const number = Number(value);
  return number % 1 ? number.toFixed(3) : String(number);
};

/**
 * Rounds a number (including float) down.
 *
 * @param {number} value
 * @param {number} precision
 * @return {number}
 */
export const floor = (value, precision = 0) => {
  const mult = Math.pow(10, precision);
  return Math.floor(value * mult) / mult;
};
