// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  click,
  getBrowserAndPages,
  getVisibleTextContents,
  goToResource,
  waitFor,
  waitForVisible,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {assertMatchesJSONSnapshot} from '../../shared/snapshots.js';
import {navigateToConsoleTab} from '../helpers/console-helpers.js';
import {setIgnoreListPattern} from '../helpers/settings-helpers.js';

describe('Ignore list', async function() {
  it('can be toggled on and off in console stack trace', async function() {
    await setIgnoreListPattern('thirdparty');
    const {target} = getBrowserAndPages();

    await goToResource('../resources/sources/multi-files.html');
    await navigateToConsoleTab();
    await target.evaluate('wrapper(() => {console.trace("test");});');

    await waitFor('.stack-preview-container:not(.show-hidden-rows)');

    assertMatchesJSONSnapshot(await getVisibleTextContents('.stack-preview-container tr'));

    await click('.show-all-link .link');
    await waitFor('.stack-preview-container.show-hidden-rows');
    await waitForVisible('.show-less-link');

    assertMatchesJSONSnapshot(await getVisibleTextContents('.stack-preview-container tr'));

    await click('.show-less-link .link');
    await waitFor('.stack-preview-container:not(.show-hidden-rows)');

    assertMatchesJSONSnapshot(await getVisibleTextContents('.stack-preview-container tr'));
  });
});
