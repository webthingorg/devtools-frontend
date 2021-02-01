// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const path = require('path');
const fs = require('fs');


const excludedDirectories = new Set([path.resolve(path.join(process.cwd(), 'front_end', 'third_party'))]);

const searchForDarkModeSheets = (directory, foundFiles = []) => {
  if (excludedDirectories.has(directory)) {
    return foundFiles;
  }

  const directoryContents = fs.readdirSync(directory);
  directoryContents.forEach(fileOrDir => {
    const fullPath = path.resolve(path.join(directory, fileOrDir));
    if (fs.statSync(fullPath).isDirectory()) {
      searchForDarkModeSheets(fullPath, foundFiles);
    } else if (fullPath.endsWith('.darkmode.css')) {
      foundFiles.push(fullPath);
    }
  });
  return foundFiles;
};

/**
 * @param {string} darkModeSheetPath
 * @returns true if the dark mode sheet is up to date.
 */
const checkDarkModeSheetUpToDate = darkModeSheetPath => {
  const sourceFile =
      path.join(path.dirname(darkModeSheetPath), path.basename(darkModeSheetPath, '.darkmode.css') + '.css');

  const sourceFileMTime = fs.statSync(sourceFile).mtime;
  const darkFileMTime = fs.statSync(darkModeSheetPath).mtime;
  // If the source file was modified more recently than the dark file, the dark file needs to be regenerated.
  return sourceFileMTime <= darkFileMTime;
};

const rootDir = path.resolve(path.join(process.cwd(), 'front_end'));
const allDarkModeSheets = searchForDarkModeSheets(rootDir);
const outdatedSheets = allDarkModeSheets.filter(sheet => checkDarkModeSheetUpToDate(sheet) === false);

if (outdatedSheets.length) {
  console.error('Found dark mode stylesheets that are out of date and need to be regenerated:');
  console.error(outdatedSheets.map(sheet => path.relative(process.cwd(), sheet)).join(', '));
  process.exit(1);
}
