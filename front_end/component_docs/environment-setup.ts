// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as MockEnvironment from '../mock_environment/mock_environment.js';

export function init(): void {
  MockEnvironment.SetupEnvironment.initializeGlobalVars();
}
