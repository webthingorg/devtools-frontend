// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs');

// To make sure that any leftover JavaScript files (e.g. that were outputs from now-removed tests)
// aren't incorrectly included, we glob for the TypeScript files instead and use that
// to instruct Mocha to run the output JavaScript file.
const ROOT_DIRECTORY = path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'e2e');

const hasCustomPattern = 'TEST_FILE' in process.env;
const testPattern = (() => {
  if (!hasCustomPattern) {
    return '**/*_test.ts';
  }
  const spec = process.env['TEST_FILE'];
  if (spec.endsWith('_test.ts')) {
    return spec
  } else if (spec.endsWith('_test')) {
    return `${spec}.ts`;
  } else if (spec.endsWith('_test.js')) {
    return `${spec.slice(-2)}js`;
  }
  return `${spec}_test.ts`;
})();



const testFiles = glob.sync(path.join(ROOT_DIRECTORY, testPattern)).map(fileName => {
  const renamedFile = fileName.replace(/\.ts$/, '.js');
  const generatedFile = path.join(__dirname, path.relative(ROOT_DIRECTORY, renamedFile));

  if (!fs.existsSync(generatedFile)) {
    if (hasCustomPattern) {
      throw new Error(
          `\nNo test found matching --test-file=${process.env['TEST_FILE']}.` +
          ' Use a relative path from test/e2e/.');
    } else {
      throw new Error(`Test file missing in "ts_library": ${generatedFile}`);
    }
  }

  return generatedFile;
});

// When we are debugging, we don't want to timeout any test. This allows to inspect the state
// of the application at the moment of the timeout. Here, 0 denotes "indefinite timeout".
const timeout = process.env['DEBUG'] ? 0 : 5 * 1000;

// Our e2e tests are almost always slower than the default 75ms.
const slow = 1000;

const jobs = Number(process.env['JOBS']) || 1;
const parallel = !process.env['DEBUG'] && jobs > 1;

process.env.TEST_SERVER_TYPE = 'hosted-mode';
module.exports = {
  require: [path.join(__dirname, '..', 'conductor', 'mocha_hooks.js'), 'source-map-support/register'],
  spec: testFiles,
  slow,
  timeout,
  parallel,
  jobs,
}
