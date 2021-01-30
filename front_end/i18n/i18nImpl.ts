// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// eslint-disable-next-line
import i18nBundle from '../third_party/i18n/i18n.js';

import * as StringUtilities from './stringUtilities.js';

/**
 * The locale that DevTools displays
 */
export const registerLocaleData = i18nBundle.registerLocaleData;

/**
 * The locale that DevTools displays
 */
export let registeredLocale: string|undefined;

/**
 * The strings from the module.json file
 */
let moduleJSONStrings: Object|undefined;

/**
 * Returns an instance of an object of formatted strings based on locale. If the instance is not
 * set at the time of calling, it is created.
 */
function getOrSetModuleJSONStrings(): Object {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  moduleJSONStrings = moduleJSONStrings || i18nBundle.getRendererFormattedStrings(registeredLocale);
  return moduleJSONStrings;
}

/**
 * Take the locale passed in from the browser(host), run through the fallback logic (example: es-419 -> es)
 * to find the DevTools supported locale and register it.
 */
export function registerLocale(locale: string): void {
  registeredLocale = i18nBundle.lookupLocale(locale);
}

/**
 * Returns an anonymous function that wraps a call to retrieve a localized string.
 * This is introduced so that localized strings can be declared in environments where
 * the i18n system has not been configured and so, cannot be directly invoked. Instead,
 * strings are lazily localized when they are used. This is used for instance in the
 * meta files used to register module extensions.
 * @param {function(string, ?Object):string} str_
 * @param {string} id
 * @param {!Object} values
 * @return {function(): LocalizedString} the localized version of the
 */
export function getLazilyComputedLocalizedString(
    str_: (id: string, values: Object) => StringUtilities.LocalizedString, id: string, values: Object = {}): () =>
    StringUtilities.LocalizedString {
  return (): StringUtilities.LocalizedString => getLocalizedString(str_, id, values);
}

/**
 * Retrieve the localized string.
 */
export function getLocalizedString(
    str_: (id: string, values: Object) => StringUtilities.LocalizedString, id: string,
    values: Object = {}): StringUtilities.LocalizedString {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  const icuMessage = str_(id, values);
  return i18nBundle.getFormatted(icuMessage, registeredLocale) as StringUtilities.LocalizedString;
}

/**
 * Register a file's UIStrings with i18n, return function to generate the string ids.
 */
export function registerUIStrings(path: string, stringStructure: Object): (id: string, values: Object) =>
    StringUtilities.LocalizedString {
  /**
   * Convert a message string & replacement values into an
   * indexed id value in the form '{messageid} | # {index}'.
   * */
  const str: (id: string, value: Object) => StringUtilities.LocalizedString = (id: string, value: Object) => {
    try {
      const i18nInstance = i18nBundle.createMessageInstanceIdFn(path, stringStructure) as (
                               id: string, values: Object) => StringUtilities.LocalizedString;
      return i18nInstance(id, value);
    } catch (e) {
      // ID was not in the main file search for module.json strings
      if (e instanceof i18nBundle.idNotInMainDictionaryException) {
        const stringMappingArray = Object.getOwnPropertyNames(getOrSetModuleJSONStrings());
        const index = stringMappingArray.indexOf(id);
        if (index >= 0) {
          return stringMappingArray[index] as StringUtilities.LocalizedString;
        }
      }

      return id as StringUtilities.LocalizedString;
    }
  };

  return str;
}

/**
 * Returns a span element that may contains other DOM element as placeholders
 */
export function getFormatLocalizedString(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    str_: (id: string, values: Object) => StringUtilities.LocalizedString, stringId: string,
    placeholders: any): Element {
  if (!registeredLocale) {
    throw new Error(`Unsupported locale '${registeredLocale}'`);
  }

  const icuMessage = str_(stringId, placeholders);
  const formatter = i18nBundle.getFormatter(icuMessage, registeredLocale);

  const icuElements = formatter.getAst().elements;
  const args: Object[] = [];
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

export function formatLocalized(formattedString: string, ...args: Object[]): Element {
  const substitution: (substitution: string) => string = substitution => {
    return substitution;
  };


  function append(a: Element, b: string|Node): Element {
    a.appendChild(typeof b === 'string' ? document.createTextNode(b) : b);
    return a;
  }

  const formatters = {s: substitution};
  // @ts-ignore
  return StringUtilities.format(formattedString, args, formatters, document.createElement('span'), append)
      .formattedResult;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeUIString(string: string, values: any = []): string {
  const serializedMessage = {string, values};
  return JSON.stringify(serializedMessage);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deserializeUIString(serializedMessage: string): any {
  if (!serializedMessage) {
    return {};
  }

  return JSON.parse(serializedMessage);
}
