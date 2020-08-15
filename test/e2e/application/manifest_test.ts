// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages, waitFor} from '../../shared/helper.js';
import {doubleClickSourceTreeItem, navigateToApplicationTab} from '../helpers/application-helpers.js';

const MANIFEST_SELECTOR = '[aria-label="Manifest"]';

function shouldRunTest() {
  const features = process.env['CHROME_FEATURES'];
  return features !== undefined && features.includes('WebAppManifestDisplayOverride');
}

async function getInstallabilityErrorText() {
  const error = await waitFor('div > div > div:nth-child(2) > div:nth-child(2) > div.vbox > div > span > span');
  return await error.evaluate(element => element.textContent as string);
}

describe('The Application Tab', async () => {
  before(async () => {});

  it('display_override installability check', async () => {
    if (!shouldRunTest()) {
      return;
    }

    const {target} = getBrowserAndPages();

    await navigateToApplicationTab(target, 'manifest_display_override_contains_browser');
    await doubleClickSourceTreeItem(MANIFEST_SELECTOR);
    const installError = await getInstallabilityErrorText();

    assert.strictEqual(
        installError,
        'Manifest contains \'display_override\' field, and the first supported display mode must be one of \'standalone\', \'fullscreen\', or \'minimal-ui\'');
  });
});
