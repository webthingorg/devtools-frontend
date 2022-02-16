// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {describe, it} from '../../shared/mocha-extensions.js';
import {getMessageContents, waitForTheCoveragePanelToLoad} from '../helpers/coverage-helpers.js';

describe('With en-US locale (default)', async () => {
  it('check that the reload button has the correct text', async () => {
    await waitForTheCoveragePanelToLoad();
    const message = await getMessageContents();

    assert.include(message, 'Click the reload button');
  });
});

// TODO(crbug.com/1163928): Add test that:
//     1) Changes the 'language' setting to en-XL
//     2) Reloads DevTools
//     3) Makes sure that localized DevTools is loaded
