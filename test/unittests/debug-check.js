// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const fs = require('fs').promises;
const path = require('path');
const isDebug = /is_debug(\s*?)=(\s*?)(.*)/;

/**
 * Tests the args.gn file to ensure that the is_debug flag is set to true.
 * @param {string} dirName
 */
async function debugCheck(dirName) {
  const argsFile = path.join(dirName, '..', '..', '..', 'args.gn');
  try {
    const fileDetails = await fs.readFile(argsFile, {encoding: 'utf8'});
    for (const line of fileDetails.split('\n')) {
      if (!isDebug.test(line)) {
        continue;
      }

      const matches = isDebug.exec(line);
      // For any match we expect:
      // 0: the whole line
      // 1: the group for the spaces between is_debug and =
      // 2: the group for the spaces between = and the value
      // 3: the value itself.
      if (!matches || matches.length < 4) {
        return false;
      }

      const value = matches[3].toLowerCase();
      if (value === 'true' || value === '1') {
        return true;
      }

      return false;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = debugCheck;
