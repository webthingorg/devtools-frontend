// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {ToggleEmulationMode} from '../helpers/emulation-helpers.js';

describe('The Emulation Pane', async () => {
  it('Make sure device mode can be toggled.', async () => {
    await ToggleEmulationMode();
  });
});
