// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './ExtensionsNetworkTestRunner.js';
import './ExtensionsTestRunner.js';

import {TestRunner} from '../test_runner/test_runner.js';

// Extension tests currently require 'TestRunner' to be available
// on globalThis.
self.TestRunner ??= TestRunner;

const {ExtensionsTestRunner} = self;
export {ExtensionsTestRunner};
