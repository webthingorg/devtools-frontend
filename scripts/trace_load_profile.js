#!/usr/bin/env node

// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const {
  nodePath,
} = require('./devtools_paths.js');

const outputFilePath = `${path.dirname(__dirname)}/trace_load_stats.txt`;

const testSuiteArgs = [
  'scripts/test/run_test_suite.js',
  '--config=test/interactions/test-runner-config.json',
  '--autoninja',
  '--target=FastBuildProfile',
  '--mocha-fgrep=shows the details of an entry when selected on the timeline',
  '--test-file-pattern=panels/performance/timeline/timeline_selection_test.ts',
  '--mocha-reporter=json',
  `--mocha-reporter-option="output=${outputFilePath}"`,
];

process.env['ITERATIONS'] = 2;

String(childProcess.execSync('gn gen out/FastBuildProfile --args="devtools_skip_typecheck=true"'));

const testFilePath =
    `${path.dirname(__dirname)}/test/interactions/panels/performance/timeline/timeline_selection_test.ts`;

const testFileOriginalContent = fs.readFileSync(testFilePath);
const fd = fs.openSync(testFilePath, 'w+');
const importStatement = Buffer.from('import {it} from \'../../../../shared/mocha-extensions.js\';\n');
fs.writeSync(fd, importStatement, 0, importStatement.length, 0);
fs.writeSync(fd, testFileOriginalContent, 0, testFileOriginalContent.length, importStatement.length);
fs.close(fd, err => {
  if (err) {
    throw err;
  }
});

const beginCommit = String(childProcess.execSync('git rev-parse --short=8 HEAD~1')).trim();
const endCommit = String(childProcess.execSync('git rev-parse --short=8 HEAD')).trim();
const commitRange =
    String(childProcess.execSync(`git rev-list --reverse ^${beginCommit}~ ${endCommit}`)).trim().split('\n');
const branchName = String(childProcess.execSync('git rev-parse --abbrev-ref HEAD')).trim();

const results = [];
for (const commit of commitRange) {
  const commitDescription = String(childProcess.execSync(`git show --no-patch --format=oneline ${commit}`)).trim();
  childProcess.execSync(`git checkout ${commit}`);
  childProcess.spawnSync(
      nodePath(), testSuiteArgs, {encoding: 'utf-8', cwd: path.dirname(__dirname), stdio: 'inherit'});
  if (!fs.existsSync(outputFilePath)) {
    throw new Error('File with trace load stats was not found.');
  }

  const fileContent = fs.readFileSync(outputFilePath, 'utf8');
  const stats = JSON.parse(fileContent);
  const mean = stats.tests.reduce((prev, curr) => prev + curr.duration / stats.tests.length, 0);
  results.push(`${commitDescription}: ${mean}`);
  fs.unlinkSync(outputFilePath);
  fs.writeFileSync(testFilePath, testFileOriginalContent);
}

childProcess.execSync(`git checkout ${branchName}`);

console.log(results);
