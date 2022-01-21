// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-check

const path = require('path');

const devtools_paths = require('../devtools_paths.js');
const devtools_plugin = require('./devtools_plugin.js');

// esbuild module uses binary in this path.
process.env.ESBUILD_BINARY_PATH = path.join(devtools_paths.thirdPartyPath(), 'esbuild', 'esbuild');

const entryPoints = [process.argv[2]];
const outfile = process.argv[3];

const plugin = {
  name: 'devtools-plugin',
  setup(build) {
    // https://esbuild.github.io/plugins/#on-resolve
    build.onResolve({filter: /.*/}, args => {
      const res = devtools_plugin.devtoolsPlugin(args.path, args.importer);
      if (!res) {
        return null;
      }

      return {
        path: res.id,
        external: res.external,
      };
    });
  },
};

require('esbuild')
    .build({
      entryPoints,
      outfile,
      bundle: true,
      format: 'esm',
      plugins: [plugin],
    })
    .catch(() => process.exit(1));
