// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {assert} from 'chai';
import {describe, it} from 'mocha';

import {clickSpanForDualScreen, getWidthOfDevice, selectNonDualScreenDevice, startEmulationWithDualScreenFlag} from '../helpers/emulation-helpers.js';
import {assertButtonDisabled, selectSpanButton} from '..\helpers\emulation-helpers.js';

const DUO_VERTICAL_SPANNED_WIDTH = '928';

describe('Dual screen mode', async () => {
  beforeEach(async function() {
    await startEmulationWithDualScreenFlag();
  });

  it('User can span a dual screen device', async () => {
    await clickSpanForDualScreen();
    const width = await getWidthOfDevice();
    assert(width === DUO_VERTICAL_SPANNED_WIDTH);  // unspanned width will be '450'
  });

  it('User may not click span button for a non-dual screen device', async () => {
    await selectNonDualScreenDevice();
    const spanButton = await selectSpanButton();
    await assertButtonDisabled(spanButton);
  });
});
