// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This file contains helpers to load the correct path to various scripts and
 * directories. It is the Node equivalent of devtools_paths.py.
 *
 * Note that not all paths implemented in devtools_paths.py are implemented
 * here. Please add any paths you need that are missing.
 */

const path = require('path');
const os = require('os');

/**
 * You would think we can use __filename here but we cannot because __filename
 * has any symlinks resolved. This means we can't use it to tell if the user is
 * using the external repo with a standalone build setup because the symlink
 * from chromium/src/third_party/devtools-frontend => devtools-frontend repo
 * gets resolved by Node before it gives us __filename.
 *
 * We can use process.argv[1], which is the path to the file currently being
 * executed without any symlinks resolution. If we assume that file is always in
 * the scripts directory, we can take that path and walk up the file structure
 * until we find the scripts directory, at which point we've found this file and
 * can use it for all subsequent logic.
 *
 * e.g. the user executes a script: scripts/test/run_lint_check_css.js
 *
 * process.argv[1] =
 * /full/path/devtools-frontend/src/scripts/test/run_lint_check_css.js
 *
 * We then walk up to find /scripts/, and append `devtools_paths.js` to it to
 * get the full path to this file. If we're inside Chromium this will get us the
 * full chromium/src/third_party/devtools/... path, and if we're standalone
 * it'll just give us the standalone path.
 *

 */
let pathToScriptsDirectory = process.argv[1];
while (path.basename(path.dirname(pathToScriptsDirectory)) !== 'scripts') {
  pathToScriptsDirectory = path.dirname(pathToScriptsDirectory);
}
const ABS_PATH_TO_CURRENT_FILE = path.join(path.dirname(pathToScriptsDirectory), path.basename(__filename));

/** Find the root path of the checkout.
* In the external repository, standalone build, this is the devtools-frontend directory.
* In the external repository, integrated build, this is the src/chromium directory.
*/
function rootPath() {
  const scriptsPath = path.dirname(ABS_PATH_TO_CURRENT_FILE);
  const devtoolsFrontendPath = path.dirname(scriptsPath);
  const devtoolsFrontendParentPath = path.dirname(devtoolsFrontendPath);

  if (path.basename(devtoolsFrontendParentPath) === 'devtools-frontend') {
    // External repository, integrated build
    // So go up two levels to the src/chromium directory
    return path.dirname(path.dirname(devtoolsFrontendParentPath));
  }

  // External repository, standalone build
  return devtoolsFrontendPath;
}

function thirdPartyPath() {
  return path.join(rootPath(), 'third_party');
}

function nodePath() {
  const paths = {
    'darwin': path.join('mac', 'node-darwin-x64', 'bin', 'node'),
    'linux': path.join('linux', 'node-linux-x64', 'bin', 'node'),
    'win32': path.join('win', 'node.exe'),
  };
  return path.join(thirdPartyPath(), 'node', paths[os.platform()]);
}

function devtoolsRootPath() {
  return path.dirname(path.dirname(ABS_PATH_TO_CURRENT_FILE));
}

function nodeModulesPath() {
  return path.join(devtoolsRootPath(), 'node_modules');
}

function stylelintExecutablePath() {
  return path.join(nodeModulesPath(), 'stylelint', 'bin', 'stylelint.js');
}

module.exports = {
  thirdPartyPath,
  nodePath,
  devtoolsRootPath,
  nodeModulesPath,
  stylelintExecutablePath
};
