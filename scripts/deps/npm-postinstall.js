// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Performs various tasks whenever npm touches node_modules.

const path = require('path');
const fs = require('fs');

const {
  nodeModulesPath,
} = require('../devtools_paths.js');

function addClangFormat() {
  fs.writeFileSync(path.join(nodeModulesPath(), '.clang-format'), 'DisableFormat: true\n', {flag: 'w+'});
}

function addOwnersFile() {
  fs.writeFileSync(
      path.join(nodeModulesPath(), 'OWNERS'),
      'file://config/owner/INFRA_OWNERS\n',
  );
}

function addChromiumReadme() {
  fs.writeFileSync(
      path.join(nodeModulesPath(), 'README.chromium'),
      `This directory hosts all packages downloaded from NPM that are used in either the build system or infrastructure scripts.
If you want to make any changes to this directory, please see "scripts/deps/manage_node_deps.py".
`);
}

addChromiumReadme();
addClangFormat();
addOwnersFile();
