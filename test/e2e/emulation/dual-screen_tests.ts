// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {describe, it} from 'mocha';
import {startEmulationWithDualScreenFlag, testSpanForDualScreen, testSpanForNonDualScreen} from '../helpers/emulation-helpers.js';

describe('Dual screen mode', async () => {
  beforeEach(async function() {
    await startEmulationWithDualScreenFlag();
  });

  it('Test span button for a dual screen device', async () => {
    await testSpanForDualScreen();
  });

  it('Test span button for a non-dual screen device', async () => {
    await testSpanForNonDualScreen();
  });
});
