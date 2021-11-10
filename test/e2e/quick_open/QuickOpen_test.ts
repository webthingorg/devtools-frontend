// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getMenuItemAtPosition, getMenuItemTitleAtPosition, openFileQuickOpen} from '../helpers/quick_open-helpers.js';

describe('Quick Open menu', () => {
  it('lists available files', async () => {
    await goToResource('pages/hello-world.html');
    await openFileQuickOpen();
    const firstItemTitle = await getMenuItemTitleAtPosition(0);
    assert.strictEqual(firstItemTitle, 'hello-world.html');
  });

  it('opens the sources panel when a file is selected', async () => {
    await goToResource('pages/hello-world.html');
    await openFileQuickOpen();
    const firstItem = await getMenuItemAtPosition(0);
    await click(firstItem);
    await waitFor('.navigator-file-tree-item');
    await waitFor(`[aria-label="${'hello-world.html'}, file"]`);
  });
});
