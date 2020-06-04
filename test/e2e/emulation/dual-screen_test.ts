// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {describe, it} from 'mocha';

import {clickSpanForDualScreen, spanIsDisabledForNonDualScreen, startEmulationWithDualScreenFlag} from '../helpers/emulation-helpers.js';

describe('Dual screen mode', async () => {
  beforeEach(async function() {
    await startEmulationWithDualScreenFlag();
  });

  it('User can click span button for a dual screen device', async () => {
    await clickSpanForDualScreen();
  });

  it('User may not click span button for a non-dual screen device', async () => {
    await spanIsDisabledForNonDualScreen();
  });
});
