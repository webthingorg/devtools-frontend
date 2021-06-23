/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @fileoverview
 * Define the available locale list
 *
 * The list is a straight updatation of
 * https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/lib/i18n/locales.js
 *
 * Note that initially the value is the filename for each locale that will then
 * be later overwritten with the actual fetched translations.
 * TODO(crbug.com/1163928): Disentangle the locale -> file assocation from the
 *                          actual translation data.
 */

const locales = {
  'en-US': 'en-US.json', // The 'source' strings, with descriptions
  'en': 'en-US.json', // According to CLDR/ICU, 'en' == 'en-US' dates/numbers (Why?!)

  'en-AU': 'en-GB.json', // Alias of 'en-GB'
  'en-GB': 'en-GB.json', // Alias of 'en-GB'
  'en-IE': 'en-GB.json', // Alias of 'en-GB'
  'en-SG': 'en-GB.json', // Alias of 'en-GB'
  'en-ZA': 'en-GB.json', // Alias of 'en-GB'
  'en-IN': 'en-GB.json', // Alias of 'en-GB'

  // All locales from here have a messages file, though we allow fallback to the base locale when the files are identical
  'ar': 'ar.json',
  'bg': 'bg.json',
  'ca': 'ca.json',
  'cs': 'cs.json',
  'da': 'da.json',
  'de': 'de.json', // de-AT, de-CH identical, so they fall back into de
  'el': 'el.json',
  'en-XL': 'en-XL.json', // local psuedolocalization
  'es': 'es.json',
  'es-419': 'es-419.json',
  // Aliases of es-419: https://raw.githubusercontent.com/unicode-cldr/cldr-core/master/supplemental/parentLocales.json
  'es-AR': 'es-419.json',
  'es-BO': 'es-419.json',
  'es-BR': 'es-419.json',
  'es-BZ': 'es-419.json',
  'es-CL': 'es-419.json',
  'es-CO': 'es-419.json',
  'es-CR': 'es-419.json',
  'es-CU': 'es-419.json',
  'es-DO': 'es-419.json',
  'es-EC': 'es-419.json',
  'es-GT': 'es-419.json',
  'es-HN': 'es-419.json',
  'es-MX': 'es-419.json',
  'es-NI': 'es-419.json',
  'es-PA': 'es-419.json',
  'es-PE': 'es-419.json',
  'es-PR': 'es-419.json',
  'es-PY': 'es-419.json',
  'es-SV': 'es-419.json',
  'es-US': 'es-419.json',
  'es-UY': 'es-419.json',
  'es-VE': 'es-419.json',

  'fi': 'fi.json',
  'fil': 'fil.json',
  'fr': 'fr.json', // fr-CH identical, so it falls back into fr
  'he': 'he.json',
  'hi': 'hi.json',
  'hr': 'hr.json',
  'hu': 'hu.json',
  'gsw': 'de.json', // swiss german. identical (for our purposes) to 'de'
  'id': 'id.json',
  'in': 'id.json', // Alias of 'id'
  'it': 'it.json',
  'iw': 'he.json', // Alias of 'he'
  'ja': 'ja.json',
  'ko': 'ko.json',
  'lt': 'lt.json',
  'lv': 'lv.json',
  'mo': 'ro.json', // Alias of 'ro'
  'nl': 'nl.json',
  'nb': 'no.json', // Alias of 'no'
  'no': 'no.json',
  'pl': 'pl.json',
  'pt': 'pt.json', // pt-BR identical, so it falls back into pt
  'pt-PT': 'pt-PT.json',
  'ro': 'ro.json',
  'ru': 'ru.json',
  'sk': 'sk.json',
  'sl': 'sl.json',
  'sr': 'sr.json',
  'sr-Latn': 'sr-Latn.json',
  'sv': 'sv.json',
  'ta': 'ta.json',
  'te': 'te.json',
  'th': 'th.json',
  'tl': 'fil.json', // Alias of 'fil'
  'tr': 'tr.json',
  'uk': 'uk.json',
  'vi': 'vi.json',
  'zh': 'zh.json', // aka ZH-Hans, sometimes seen as zh-CN, zh-Hans-CN, Simplified Chinese
  'zh-HK': 'zh-HK.json', // aka zh-Hant-HK. Note: yue-Hant-HK is not supported.
  'zh-TW': 'zh-TW.json', // aka zh-Hant, zh-Hant-TW, Traditional Chinese
};

module.exports = locales;
