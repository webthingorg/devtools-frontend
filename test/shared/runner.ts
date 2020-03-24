// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable no-console */
// no-console disabled here as this is a test runner and expects to output to the console

const cluster = require('cluster');
const role = cluster.isMaster ? './master' : './worker';
const roleImpl = require(role);
roleImpl.init();

const envNoShuffle = !!process.env['NO_SHUFFLE'];
const testListPath = process.env['TEST_LIST'];
if (!testListPath) {
  throw new Error('Must specify a list of tests in the "TEST_LIST" environment variable.');
}

function shuffleTestFiles(files: string[]) {
  if (envNoShuffle) {
    console.log('Running tests unshuffled');
    return files;
  }

  const swap = (arr: string[], a: number, b: number) => {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  };

  for (let i = files.length; i >= 0; i--) {
    const a = Math.floor(Math.random() * files.length);
    const b = Math.floor(Math.random() * files.length);

    swap(files, a, b);
  }

  console.log(`Enqueuing tests in the following order:\n${files.join('\n')}`);
  return files;
}

async function runTests() {
  if (!cluster.isMaster) {
    return;
  }

  const {testList} = await import(testListPath!);
  const shuffledTests = shuffleTestFiles(testList);

  roleImpl.enqueue(shuffledTests);
}

runTests();
