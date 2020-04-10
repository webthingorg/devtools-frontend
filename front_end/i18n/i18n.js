// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck

import * as Platform from '../platform/platform.js';

import * as i18nBundle from './i18n-bundle.js';

/**
 * This functions come from the i18n library (lh-i18n)
 */
export const registerUIStrings = i18nBundle.i18n.registerUIStrings;
export const registerLocaleData = i18nBundle.i18n.registerLocaleData;
export const getLocalizedString = i18nBundle.i18n.getLocalizedString;
export const registerLocale = i18nBundle.i18n.registerLocale;
export const getLocale = i18nBundle.i18n.getLocale;

/**
 * Returns a span element that may contains other DOM element as placeholders
 * @param {*} str_
 * @param {string} stringId
 * @param {!Object} placeholders
 */
export function getFormatLocalizedString(str_, stringId, placeholders = []) {
  i18nBundle.i18n.getLocalizedString(str_, stringId, placeholders);
  const formatter = i18nBundle.i18n.getCurrentFormatter();
  const icuElements = formatter.getAst().elements;
  const args = [];
  let formattedString = '';
  for (const element of icuElements) {
    if (element.type === 'argumentElement') {
      const placeholderValue = placeholders[element.id];
      if (placeholderValue) {
        args.push(placeholderValue);
        element.value = '%s';  // convert the {PH} back to %s to use StringUtilities
      }
    }
    formattedString += element.value;
  }
  return formatLocalized(formattedString, args);
}

/**
 * @param {string} format
 * @param {?ArrayLike} substitutions
 * @return {!Element}
 */
export function formatLocalized(formattedString, args) {
  const formatters = {s: substitution => substitution};

  /**
   * @param {!Element} a
   * @param {string|!Element} b
   * @return {!Element}
   */
  function append(a, b) {
    a.appendChild(typeof b === 'string' ? createTextNode(b) : b);
    return a;
  }

  return Platform.StringUtilities.format(formattedString, args, formatters, createElement('span'), append)
      .formattedResult;
}
