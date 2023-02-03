// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {dirname, join} from 'path';

import {getTestRunnerConfigSetting} from '../conductor/test_runner_config.js';

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
 * Parses the given stack trace for a given test. The stack must have the third
 * line be the test file.
 */
const getTestDirectory = (stack: string) => {
  return dirname(stack.split('\n')[2].split(TEST_SUITE_SOURCE_DIR, 2)[1].split(':', 1)[0]);
};

const getOrUpdateSnapshot = (filename: string, getSerializedValue: () => string, stack: string): string => {
  const snapshotPath = join(SNAPSHOTS_DIR, getTestDirectory(stack), filename);
  const snapshotDir = dirname(snapshotPath);

  if (process.env['UPDATE_SNAPSHOTS']) {
    const value = getSerializedValue();
    mkdirSync(snapshotDir, {recursive: true});
    writeFileSync(snapshotPath, value);
    return value;
  }
  if (!existsSync(snapshotPath)) {
    throw new Error(`Could not find screenshot for ${
        snapshotPath}. You can update the screenshots by running the tests with UPDATE_SNAPSHOTS=1.`);
  }
  return readFileSync(snapshotPath, 'utf-8');
};

/**
 * Asserts that the value matches the snapshot at a given filename.
 *
 * DO NOT use this within a helper function. This function is only meant to be
 * called in tests directly. If a custom helper is desired, use
 * {@link rawAssertMatchesSnapshot}.
 */
export const assertMatchesSnapshot = (filename: string, value: string) => {
  rawAssertMatchesSnapshot(filename, value, (new Error()).stack as string);
};

/**
 * Asserts that the JSON value matches the snapshot at a given filename.
 *
 * DO NOT use this within a helper function. This function is only meant to be
 * called in tests directly. If a custom helper is desired, use
 * {@link rawAssertMatchesJSONSnapshot}.
 */
export const assertMatchesJSONSnapshot = (filename: string, value: unknown) => {
  rawAssertMatchesJSONSnapshot(filename, value, (new Error()).stack as string);
};

/**
 * Used to construct helpers such as {@link assertMatchesSnapshot}. You must
 * pass in the stack trace (e.g. using `(new Error()).stack`) of the actual
 * function that will be called in tests directly.
 */
export const rawAssertMatchesJSONSnapshot = (filename: string, value: unknown, stack: string) => {
  if (!filename.endsWith('.json')) {
    filename = `${filename}.json`;
  }
  assert.deepEqual(value, JSON.parse(getOrUpdateSnapshot(filename, () => JSON.stringify(value, undefined, 2), stack)));
};

/**
 * Used to construct helpers such as {@link assertMatchesJSONSnapshot}. You must
 * pass in the stack trace (e.g. using `(new Error()).stack`) of the actual
 * function that will be called in tests directly.
 */
export const rawAssertMatchesSnapshot = (filename: string, value: string, stack: string) => {
  assert.strictEqual(value, getOrUpdateSnapshot(filename, () => value, stack));
};
