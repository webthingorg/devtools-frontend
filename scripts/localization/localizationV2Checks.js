// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This script is part of the presubmit check that parses DevTools frontend files,
 * collects localizable strings, and run some checks for localization.
 *
 * If argument '--autofix' is present, try fixing the error automatically
 */
const fs = require('fs');
const {promisify} = require('util');
const writeFileAsync = promisify(fs.writeFile);
const parseLocalizableResources = require('./utils/check_localized_strings');
let autoFixMessage = '';
let errorMessage = '';

async function runLocalizationV2Checks(shouldAutoFix) {
  await checkUIStrings(shouldAutoFix);

  if (shouldAutoFix) {
    return autoFixMessage;
  }
  return errorMessage;
}

/**
 * Verifies that all strings in UIStrings structure are called with localization API.
 */
async function checkUIStrings(shouldAutoFix) {
  const localizationCallsMap = parseLocalizableResources.localizationCallsMap;
  const UIStringsMap = parseLocalizableResources.UIStringsMap;
  const errorMap = new Map();
  for (const [filePath, UIStringsEntries] of UIStringsMap.entries()) {
    let errorList;
    if (filePath.endsWith('moduleUIStrings.js')) {
      const newFilePath = filePath.replace('moduleUIStrings.js', 'module.json');
      const entriesSet = getMapEntries(localizationCallsMap.get(newFilePath));
      errorList = checkStringEntries(UIStringsEntries, entriesSet, true);
    } else {
      const entriesSet = getMapEntries(localizationCallsMap.get(filePath));
      errorList = checkStringEntries(UIStringsEntries, entriesSet, false);
    }

    if (errorList.length > 0) {
      errorMap.set(filePath, errorList);
    }
  }

  if (errorMap.size > 0) {
    if (shouldAutoFix) {
      await autoFixUIStringsCheck(errorMap);
    } else {
      addUIStringsCheckError(errorMap);
    }
  }
}

/**
 * Get all the string entries called with localization API from the entry map of that file.
 * Returns a set of the string IDs.
 */
function getMapEntries(entryFromCallsMap) {
  const entriesSet = new Set();
  if (entryFromCallsMap) {
    for (const entry of entryFromCallsMap) {
      entriesSet.add(entry.stringId);
    }
  }
  return entriesSet;
}

/**
 * Check if any unused string is in UIStrings structure.
 */
function checkStringEntries(UIStringsEntries, entriesSet, isModuleJSON) {
  const errorEntry = [];
  for (const stringEntry of UIStringsEntries) {
    if (isModuleJSON) {
      if (!entriesSet.has(stringEntry.stringValue)) {
        errorEntry.push(stringEntry);
      }
    } else {
      if (!entriesSet.has(stringEntry.stringId)) {
        errorEntry.push(stringEntry);
      }
    }
  }
  return errorEntry;
}

/**
 * Add UIStrings check error message to the Loc V2 check error.
 */
function addUIStringsCheckError(errorMap) {
  let UIStringsCheckErrorMessage = 'Unused string found in UIStrings.\n' +
      'Please remove them from UIStrings, or add the localization calls in your code.\n\n';

  for (const [filePath, UIStringsEntries] of errorMap.entries()) {
    UIStringsCheckErrorMessage += `${filePath}\n`;
    for (const entry of UIStringsEntries) {
      UIStringsCheckErrorMessage += `    "${entry.stringValue}"\n`;
    }
  }
  errorMessage += UIStringsCheckErrorMessage;
}

/**
 * Auto-fixing UIString check error by removing unused strings in UIStrings structure.
 */
async function autoFixUIStringsCheck(errorMap) {
  autoFixMessage += '\nUnused string found in UIStrings.';
  // Search the UIStrings object (export const UIStrings = {};\n)
  const UISTRINGS_REGEX = /export\sconst\sUIStrings = .*?\};\n/s;
  for (const [filePath, unusedUIStringsEntries] of errorMap.entries()) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regexMatch = content.match(UISTRINGS_REGEX);
    if (regexMatch) {
      let UIStringsObject = regexMatch[0];
      for (const entry of unusedUIStringsEntries) {
        UIStringsObject = removedUnusedEntryFromUIStrings(entry, UIStringsObject);
      }
      content = content.replace(regexMatch[0], UIStringsObject);
      await writeFileAsync(filePath, content);
      autoFixMessage += `\nReplaced UIStrings in ${filePath}`;
    }
  }
}

/**
 * Slice out the unused string entry from UIStrings.
 */
function removedUnusedEntryFromUIStrings(entry, UIStringsObject) {
  const regexToSplit = new RegExp(entry.stringId + '\\s*:');
  // Use the regex to split the UIStrings object into two parts: the content before and after the stringId
  // For example if entry.stringId = 'url', then
  // export const UIStrings = {
  //   /**
  //   *@description Text for web URLs
  //   */
  //   url: 'URL',
  //   /**
  //   *@description Text that refers to some types
  //   */
  //   type: 'Type',
  // }
  // would split in to
  // splitString[0] = "export const UIStrings = {   /**   *@description Text for web URLs   */"
  // splitString[1] = "'URL', /**  *@description Text that refers to some types   */   type: 'Type', }"
  // then we do more processing to remove the description in splitString[0], and the string itself in splitString[1]
  const splitString = UIStringsObject.split(regexToSplit);
  // slice until the comment (starting with /**) for this entry
  // For example: contentBeforeEntry = "export const UIStrings = {   "
  let contentBeforeEntry = splitString[0].slice(0, splitString[0].lastIndexOf('\/\*\*'));
  let contentAfterEntry = '';
  if (splitString[1].indexOf('\/\*\*') > -1) {
    // If it's not the last entry, slice starting from the next comment (starting with /**)
    // For example: contentAfterEntry = "/**   *@description Text that refers to some types   */   type: 'Type', }"
    contentAfterEntry = splitString[1].slice(splitString[1].indexOf('\/\*\*'));
  } else {
    // If it is, just add the closing bracket and remove the extra spaces if any
    contentAfterEntry = '};\n';
    contentBeforeEntry = contentBeforeEntry.slice(0, contentBeforeEntry.lastIndexOf('  '));
  }
  const contentWithoutEntry = contentBeforeEntry + contentAfterEntry;
  return contentWithoutEntry;
}

module.exports = {
  runLocalizationV2Checks,
};
