// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {globalSetup, globalTeardown, resetPages} from './hooks.js';

before(async function() {
  this.timeout(5000);
  await globalSetup();
});

after(async () => {
  await globalTeardown();
});

beforeEach(async function() {
  this.timeout(2000);
  await resetPages();
});
