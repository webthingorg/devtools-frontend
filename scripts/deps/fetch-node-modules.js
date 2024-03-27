// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-check

const spawn = require('node:child_process').spawn;

const devtools_paths = require('../devtools_paths.js');

const node =
    spawn(devtools_paths.nodePath(), [devtools_paths.npmPath(), 'ci', '--omit', 'optional', '--ignore-scripts'], {
      env: process.env,
      stdio: 'inherit',
      cwd: devtools_paths.devtoolsRootPath(),
    });

node.on('exit', code => {
  process.exit(code ?? 0);
});
