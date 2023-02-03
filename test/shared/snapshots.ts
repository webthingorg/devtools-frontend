// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {basename, dirname, extname, join} from 'path';

import {getTestRunnerConfigSetting} from '../conductor/test_runner_config.js';

const UPDATE_SNAPSHOTS = Boolean(process.env['UPDATE_SNAPSHOTS']);

let currentTest: Mocha.Test|undefined;
let snapshotIndex = 0;
beforeEach(function() {
  if (this.currentTest) {
    currentTest = this.currentTest;
    snapshotIndex = 0;
  }
});

after(() => {
  if (UPDATE_SNAPSHOTS) {
    saveSnapshotsIfTaken();
  }
});

let currentSnapshotPath: string|undefined;
let currentSnapshot: Record<string, unknown> = {};
const saveSnapshotsIfTaken = () => {
  if (currentSnapshotPath !== undefined && currentSnapshot !== undefined) {
    mkdirSync(dirname(currentSnapshotPath), {recursive: true});
    writeFileSync(currentSnapshotPath, JSON.stringify(currentSnapshot, undefined, 2));
  }
  currentSnapshotPath = undefined;
  currentSnapshot = {};
};

const restoreSnapshots = () => {
  if (!currentSnapshotPath || !existsSync(currentSnapshotPath)) {
    throw new Error(`Could not find screenshot for ${
        currentSnapshotPath}. You can update the snapshots by running the tests with UPDATE_SNAPSHOTS=1.`);
  }
  currentSnapshot = JSON.parse(readFileSync(currentSnapshotPath, 'utf-8'));
};

/**
 * The snaphots folder is always taken from the source directory (NOT
 * out/Target/...) because we commit these files to git. Therefore we use the
 * flags from the test runner config to locate the source directory and read our
 * goldens from there.
 */
const CWD = getTestRunnerConfigSetting<string>('cwd', '');
const TEST_SUITE_SOURCE_DIR = getTestRunnerConfigSetting<string>('test-suite-source-dir', '');
const TEST_SUITE_PATH = getTestRunnerConfigSetting<string>('test-suite-path', '');
if (!CWD || !TEST_SUITE_SOURCE_DIR) {
  throw new Error('--cwd and --test-suite-source-dir must be provided when running the snapshot tests.');
}
if (!TEST_SUITE_PATH) {
  throw new Error('--test-suite-path must be specified');
}

const SNAPSHOTS_DIR = join(CWD, TEST_SUITE_SOURCE_DIR, 'snapshots');

/**
 * The test file path is always the coloned beginning part of a test name.
 */
const getSnapshotPath = (test: Mocha.Test) => {
  const file = test.titlePath()[0].split(':', 1)[0];
  return join(SNAPSHOTS_DIR, dirname(file), `${basename(file, extname(file))}.json`);
};

const getOrUpdateSnapshot = (value: unknown): unknown => {
  if (!currentTest) {
    throw new Error('Not using snapshot helper in test');
  }
  ++snapshotIndex;

  const name = `${currentTest.fullTitle()} - ${snapshotIndex}`;
  const path = getSnapshotPath(currentTest);
  if (UPDATE_SNAPSHOTS) {
    if (currentSnapshotPath !== path) {
      saveSnapshotsIfTaken();
      currentSnapshotPath = path;
    }
    currentSnapshot[name] = value;
  } else {
    if (currentSnapshotPath !== path) {
      currentSnapshotPath = path;
      restoreSnapshots();
    }
  }

  return currentSnapshot[name];
};

/**
 * Asserts that the JSON value matches the snapshot at a given filename.
 */
export const assertMatchesJSONSnapshot = (value: unknown) => {
  assert.deepEqual(value, getOrUpdateSnapshot(value));
};
