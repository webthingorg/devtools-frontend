
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const globalValues = new Set(['inherit', 'initial', 'unset']);

const fontVariationSettingsRegexp = /"(\w\w\w\w)"\s((?:\d*[.])?\d+)/g;

/**
 * @param {string} value A valid CSS font-variation-settings property value
 * @return {!Array<!{tag:string, value:number}>}
 * @suppress {missingProperties} Closure doesn't know String.p.matchAll exists.
 */
export function parseFontVariationSettings(value) {
  if (globalValues.has(value.trim()) || value.trim() === 'normal') {
    return [];
  }
  return [...value.matchAll(fontVariationSettingsRegexp)].map(m => ({
                                                                tag: m[1],
                                                                value: parseFloat(m[2]),
                                                              }));
}

const fontFamilyRegexp = /(?:(\w+)|(?:"(\w+\s*\w*)"))/g;

/**
 * @param {string} value A valid CSS font-family property value
 * @return {!Array<string>}
 * @suppress {missingProperties} Closure doesn't know String.p.matchAll exists.
 */
export function parseFontFamily(value) {
  if (globalValues.has(value.trim())) {
    return [];
  }
  return [...value.matchAll(fontFamilyRegexp)].map(m => m[1] || m[2]).filter(m => !!m);
}
