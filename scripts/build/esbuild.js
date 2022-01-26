// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-check

const path = require('path');

const devtools_paths = require('../devtools_paths.js');
const devtools_plugin = require('./devtools_plugin.js');

const PATH_TO_EXECUTED_FILE = process.argv[1];

function isInChromiumDirectory() {
  const normalizedPath = PATH_TO_EXECUTED_FILE.split(path.sep).join('/');
  console.error({normalizedPath});
  const isInChromium = normalizedPath.includes('chromium/src/third_party/devtools-frontend');
  const potentialChromiumDir = PATH_TO_EXECUTED_FILE.substring(0, PATH_TO_EXECUTED_FILE.indexOf('chromium') + 8);
  const result = {isInChromium, chromiumDirectory: potentialChromiumDir};
  return result;
}

// esbuild module uses binary in this path.
console.error('devtoolsRootPath', devtools_paths.devtoolsRootPath());
console.error('rootPath', devtools_paths.rootPath());
console.error('isInChromiumDirectory', devtools_paths.isInChromiumDirectory());
console.error('argv', process.argv);

process.env.ESBUILD_BINARY_PATH = path.join(devtools_paths.devtoolsRootPath(), 'third_party', 'esbuild', 'esbuild');

const entryPoints = [process.argv[2]];
const outfile = process.argv[3];

const outdir = path.dirname(outfile);

const plugin = {
  name: 'devtools-plugin',
  setup(build) {
    // https://esbuild.github.io/plugins/#on-resolve
    build.onResolve({filter: /.*/}, args => {
      const res = devtools_plugin.devtoolsPlugin(args.path, args.importer);
      if (!res) {
        return null;
      }

      if (res.external && res.id) {
        return {
          external: res.external,
          path: './' + path.relative(outdir, res.id),
        };
      }

      if (res.external) {
        return {
          external: true,
        };
      }

      return {
        path: res.id,
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
      platform: 'browser',
      plugins: [plugin],
    })
    .catch(() => process.exit(1));
