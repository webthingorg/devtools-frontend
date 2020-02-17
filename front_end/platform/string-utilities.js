// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @param {string} inputString
 * @param {string} charsToEscape
 * @return {string} the string with any matching chars escaped
 */
export const escapeCharacters = (inputString, charsToEscape) => {
  let foundChar = false;
  for (let i = 0; i < charsToEscape.length; ++i) {
    if (inputString.indexOf(charsToEscape.charAt(i)) !== -1) {
      foundChar = true;
      break;
    }
  }

  if (!foundChar) {
    return String(inputString);
  }

  let result = '';
  for (let i = 0; i < inputString.length; ++i) {
    if (charsToEscape.indexOf(inputString.charAt(i)) !== -1) {
      result += '\\';
    }
    result += inputString.charAt(i);
  }

  return result;
};

/**
 *
 * @param {string} inputString
 * @param {string} searchString
 * @return {!Array.<number>}
 */
export const findIndexesOfSubString = (inputString, searchString) => {
  const matches = [];
  let i = inputString.indexOf(searchString);
  while (i !== -1) {
    matches.push(i);
    i = inputString.indexOf(searchString, i + searchString.length);
  }
  return matches;
};

/**
 *
 * @param {string} inputString
 * @return {!Array.<number>}
 */
export const findLineEndingIndexes = inputString => {
  const endings = findIndexesOfSubString(inputString, '\n');
  endings.push(inputString.length);
  return endings;
};
