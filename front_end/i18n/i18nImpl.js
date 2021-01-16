// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../platform/platform.js';

// eslint-disable-next-line
import i18nBundle from '../third_party/i18n/i18n.js';

/**
 * The locale that DevTools displays
 * @param {string} locale
 * @param {*} lhlMessages
 */
export const registerLocaleData = i18nBundle.registerLocaleData;

/**
 * The locale that DevTools displays
 * @type {string|undefined}
 */
export let registeredLocale;

/**
 * The en-US strings from the module.json file, used for reverse lookup.
 * e.g when the strings "hello world" is provided but you need the id for the localized
 * version.
 * @type {*}
 */
let enUsModuleJSONStrings;

/**
 * The localized strings from the module.json file. Used for fallback lookup.
 * e.g when you have a partial id and want the localized string.
 * @type {*}
 */
let localizedModuleJSONStrings;

/**
 * Initializes an instance of an object of formatted strings based for en-US and the locale.
 * If the instance is not set at the time of calling, it is created.
 */
function initializeModuleJSONStrings() {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  // initialized the en-US strings for reverse lookup of ModuleUIStrings strings.
  enUsModuleJSONStrings = enUsModuleJSONStrings || i18nBundle.getRendererFormattedStrings('en-US');
  if (registeredLocale.toLowerCase() !== 'en-us') {
    // if available initiate reverse lookup
    localizedModuleJSONStrings = localizedModuleJSONStrings || i18nBundle.getRendererFormattedStrings(registeredLocale);
  }
}

/**
 * Take the locale passed in from the browser(host), run through the fallback logic (example: es-419 -> es)
 * to find the DevTools supported locale and register it.
 * @param {string} locale
 */
export function registerLocale(locale) {
  registeredLocale = i18nBundle.lookupLocale(locale);
}

/**
 * Retrieve the localized string.
 * @param {function(string, ?Object):string} str_
 * @param {string} id
 * @param {!Object} values
 * @return {!Platform.UIString.LocalizedString} the localized version of the
 */
export function getLocalizedString(str_, id, values = {}) {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  const icuMessage = str_(id, values);
  return /** @type {!Platform.UIString.LocalizedString} */ (i18nBundle.getFormatted(icuMessage, registeredLocale));
}

/**
 * Register a file's UIStrings with i18n, return function to generate the string ids.
 * @param {string} path
 * @param {!Object} stringStructure
 * @return {function(string, ?Object):string} return function to generate the string ids.
 */
export function registerUIStrings(path, stringStructure) {
  /**
   * Retrieves the translated value for the provided string.
   * If the string is not found it will try to get it from the ModuleUIStrings
   * fallback mechanism in which will return the
   *
   * @param {string} id
   * @param {?Object} value
   * */
  const str = (id, value) => {
    try {
      const i18nInstance = i18nBundle.createMessageInstanceIdFn(path, stringStructure);
      return i18nInstance(id, value);
    } catch (e) {
      // ID was not in the main file search for module.json strings
      if (e instanceof i18nBundle.idNotInMainDictionaryException) {
        initializeModuleJSONStrings();

        // reverse lookup: ID was not found so we try to match the received string
        // in (en-US) with the en-US moduleUIStrings resources.
        const idMappingArray = Object.getOwnPropertyNames(enUsModuleJSONStrings);
        const stringMappingArray = Object.values(enUsModuleJSONStrings);
        for (let i = 0; i < stringMappingArray.length; i++) {
          // If the strings is found we retrieve the id and then search in the
          // localized ModuleUIStrings structure.
          if (stringMappingArray[i] === id) {
            /** @type {string | undefined} */
            const stringId = idMappingArray[i];
            if (stringId) {
              return localizedModuleJSONStrings[stringId].toString();
            }
          }
        }
      }

      return id;
    }
  };

  return str;
}

/**
 * Returns a span element that may contains other DOM element as placeholders
 * @param {function(string, ?Object):string} str_
 * @param {string} stringId
 * @param {!Object<string, *>} placeholders
 * @return {!Element} the localized result
 */
export function getFormatLocalizedString(str_, stringId, placeholders) {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  const icuMessage = str_(stringId, placeholders);
  const formatter = i18nBundle.getFormatter(icuMessage, registeredLocale);

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
 * @return {!Element} the formatted result.
 */
export function formatLocalized(formattedString, args) {
  /** @type {function(string):string} */
  const substitution = substitution => {
    return substitution;
  };

  /**
   * @param {!Element} a
   * @param {?} b
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
