// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../platform/platform.js';
import * as i18nBundle from './i18n-lh-bundle.js';

/**
 * Functions come from the i18n library (lh-i18n)
 */
export const registerLocaleData = i18nBundle.i18n.registerLocaleData;

/**
 * The locale that DevTools displays
 * @type {string}
 */
export let registeredLocale;

/**
 * Take the locale passed in from the browser(host), run through the fallback logic (example: es-419 -> es)
 * to find the DevTools supported locale and register it.
 * @param {string} locale
 */
export function registerLocale(locale) {
  registeredLocale = i18nBundle.i18n.lookupLocale(locale);
}

/**
 * Retrieve the localized string.
 * @param {any} str_
 * @param {string} id
 * @param {object} values
 */
export function getLocalizedString(str_, id, values) {
  const icuMessage = str_(id, values);
  return i18nBundle.i18n.getFormatted(icuMessage, registeredLocale);
}

/**
 * Register a file's UIStrings with i18n, return function to generate the string ids.
 * @param {string} path
 * @param {Record<string, string>} UIStrings
 * @return {(arg1: string, arg2: Record<string, string>)=>{}} return function to generate the string ids.
 */
export function registerUIStrings(path, UIStrings) {
  return (id, value) => {
    try {
      const i18nInstance = i18nBundle.i18n.createMessageInstanceIdFn(path, UIStrings);
      return i18nInstance(id, value);
    } catch (e) {
      return id;
    }
  };
}

/**
 * Returns a span element that may contains other DOM element as placeholders
 * @param {(arg1:string, arg2:ArrayLike<object>) => string} str_
 * @param {string} stringId
 * @param {!ArrayLike<!Object>} placeholders
 * @return {Element} the localized result
 */
export function getFormatLocalizedString(str_, stringId, placeholders = []) {
  const icuMessage = str_(stringId, placeholders);
  const formatter = i18nBundle.i18n.getFormatter(icuMessage, registeredLocale);

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
 * @param {string} formattedString
 * @param {?ArrayLike<?>} args
 * @return {Element} the formatted result.
 */
export function formatLocalized(formattedString, args) {
  /** @type {function(string):string} */
  const substitution = substitution => {
    return substitution;
  };

  /**
   * @param {!Element} a
   * @param {string|!Element} b
   * @return {!Element}
   */
  function append(a, b) {
    a.appendChild(typeof b === 'string' ? document.createTextNode(b) : b);
    return a;
  }

  const formatters = {s: substitution};
  return Platform.StringUtilities.format(formattedString, args, formatters, document.createElement('span'), append)
      .formattedResult;
}
