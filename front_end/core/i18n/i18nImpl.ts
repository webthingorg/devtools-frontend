// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// eslint-disable-next-line
import i18nBundle from '../../third_party/i18n/i18n-bundle.js';
import * as Platform from '../platform/platform.js';
import * as Root from '../root/root.js';

import {DevToolsLocale} from './DevToolsLocale.js';
import * as i18nTypes from './i18nTypes.js';

// All the locales that are part of the DevTools bundle and should not be fetched
// remotely. Keep this list in sync with "copied_devtools_locale_files" in
// "all_devtools_files.gni".
export const BUNDLED_LOCALES = new Set<string>(['en-US', 'zh']);

/**
 * The strings from the module.json file
 */
let moduleJSONStrings: Object|undefined;

/**
 * Returns an instance of an object of formatted strings based on locale. If the instance is not
 * set at the time of calling, it is created.
 */
function getOrSetModuleJSONStrings(): Object {
  moduleJSONStrings = moduleJSONStrings || i18nBundle.getRendererFormattedStrings(DevToolsLocale.instance().locale);
  return moduleJSONStrings;
}

/**
 * Look up the best available locale for the requested language through these fall backs:
 * - exact match
 * - progressively shorter prefixes (`de-CH-1996` -> `de-CH` -> `de`)
 * - the default locale ('en-US') if no match is found
 *
 * If `locale` isn't provided, the default is used.
 */
export function lookupClosestSupportedDevToolsLocale(locale: string): string {
  return i18nBundle.lookupLocale(locale);
}

/**
 * Fetches the locale data of the specified locale.
 * Callers have to ensure that `locale` is an officilly supported locale.
 * Depending whether a locale is present in `bundledLocales`, the data will be
 * fetched locally or remotely.
 */
export async function fetchAndRegisterLocaleData(
    locale: Intl.UnicodeBCP47LocaleIdentifier, bundledLocales: Set<string>): Promise<void> {
  let localeDataTextPromise;
  const remoteBase = Root.Runtime.getRemoteBase();
  if (remoteBase && remoteBase.base && !bundledLocales.has(locale)) {
    const localeUrl = `${remoteBase.base}core/i18n/locales/${locale}.json`;
    localeDataTextPromise = Root.Runtime.loadResourcePromise(localeUrl);
  } else {
    const localeUrl = new URL(`../../core/i18n/locales/${locale}.json`, import.meta.url);
    localeDataTextPromise = Root.Runtime.loadResourcePromise(localeUrl.toString());
  }

  const timeoutPromise =
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('timed out fetching locale')), 5000));
  const localeDataText = await Promise.race([timeoutPromise, localeDataTextPromise]);
  const localeData = JSON.parse(localeDataText as string);
  i18nBundle.registerLocaleData(locale, localeData);
}

/**
 * Returns an anonymous function that wraps a call to retrieve a localized string.
 * This is introduced so that localized strings can be declared in environments where
 * the i18n system has not been configured and so, cannot be directly invoked. Instead,
 * strings are lazily localized when they are used. This is used for instance in the
 * meta files used to register module extensions.
 */
export function getLazilyComputedLocalizedString(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    str_: (id: string, values: Object) => Platform.UIString.LocalizedString, id: string, values: Object = {}): () =>
    Platform.UIString.LocalizedString {
  return (): Platform.UIString.LocalizedString => getLocalizedString(str_, id, values);
}

/**
 * Retrieve the localized string.
 */
export function getLocalizedString(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    str_: (id: string, values: Object) => Platform.UIString.LocalizedString, id: string,
    values: Object = {}): Platform.UIString.LocalizedString {
  const icuMessage = str_(id, values);
  return i18nBundle.getFormatted(icuMessage, DevToolsLocale.instance().locale) as Platform.UIString.LocalizedString;
}

/**
 * Register a file's UIStrings with i18n, return function to generate the string ids.
 */
export function registerUIStrings(path: string, stringStructure: Object): (id: string, values: Object) =>
    Platform.UIString.LocalizedString {
  /**
   * Convert a message string & replacement values into an
   * indexed id value in the form '{messageid} | # {index}'.
   * */
  const str: (id: string, value: Object) => Platform.UIString.LocalizedString = (id: string, value: Object) => {
    try {
      const i18nInstance = i18nBundle.createMessageInstanceIdFn(path, stringStructure) as (
                               id: string, values: Object) => Platform.UIString.LocalizedString;
      return i18nInstance(id, value);
    } catch (e) {
      // ID was not in the main file search for module.json strings
      if (e instanceof i18nBundle.idNotInMainDictionaryException) {
        const stringMappingArray = Object.getOwnPropertyNames(getOrSetModuleJSONStrings());
        const index = stringMappingArray.indexOf(id);
        if (index >= 0) {
          return stringMappingArray[index] as Platform.UIString.LocalizedString;
        }
      }

      return id as Platform.UIString.LocalizedString;
    }
  };

  return str;
}

/**
 * Returns a span element that may contains other DOM element as placeholders
 */
export function getFormatLocalizedString(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    str_: (id: string, values: Object) => Platform.UIString.LocalizedString, stringId: string,
    placeholders: Record<string, Object>): Element {
  const icuMessage = str_(stringId, placeholders);
  const formatter = i18nBundle.getFormatter(icuMessage, DevToolsLocale.instance().locale);

  const icuElements = formatter.getAst().elements;
  const args: Array<Object> = [];
  let formattedString = '';
  for (const element of icuElements) {
    if (element.type === 'argumentElement') {
      const placeholderValue = placeholders[element.id];
      if (placeholderValue) {
        args.push(placeholderValue);
        element.value = '%s';  // convert the {PH} back to %s to use Platform.UIString
      }
    }
    formattedString += element.value;
  }
  return formatLocalized(formattedString, args);
}

export function formatLocalized(formattedString: string, args: Array<Object>): Element {
  const substitution: Platform.StringUtilities.FormatterFunction<Object> = substitution => {
    return substitution;
  };


  function append(a: Element, b: undefined|string|Node): Element {
    if (b) {
      a.appendChild(typeof b === 'string' ? document.createTextNode(b) : b);
    }

    return a;
  }

  const formatters = {s: substitution};
  return Platform.StringUtilities.format(formattedString, args, formatters, document.createElement('span'), append)
      .formattedResult;
}

export function serializeUIString(string: string, values: Record<string, Object> = {}): string {
  const serializedMessage = {string, values};
  return JSON.stringify(serializedMessage);
}

export function deserializeUIString(serializedMessage: string): i18nTypes.SerializedMessage {
  if (!serializedMessage) {
    return {string: '', values: {}} as i18nTypes.SerializedMessage;
  }

  return JSON.parse(serializedMessage) as i18nTypes.SerializedMessage;
}

/**
 * Use this function in places where a `LocalizedString` is expected but the
 * term/phrase you want to use does not require translation.
 */
export function lockedString(str: string): Platform.UIString.LocalizedString {
  return str as Platform.UIString.LocalizedString;
}

/**
 * Same as `lockedString` but for places where `i18nLazyString` would be used otherwise.
 */
export function lockedLazyString(str: string): () => Platform.UIString.LocalizedString {
  return (): Platform.UIString.LocalizedString => str as Platform.UIString.LocalizedString;
}
