// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../sources_test_runner/sources_test_runner.js';
import './IndexedDBTestRunner.js';
import './ResourceTreeTestRunner.js';
import './ResourcesTestRunner.js';
import './ServiceWorkersTestRunner.js';
import './StorageTestRunner.js';

import * as CacheStorageTestRunner from './CacheStorageTestRunner.js';

const ApplicationTestRunnerGlobal = self.ApplicationTestRunner;

export const ApplicationTestRunner = {
  ...ApplicationTestRunnerGlobal,
  ...CacheStorageTestRunner,
};
