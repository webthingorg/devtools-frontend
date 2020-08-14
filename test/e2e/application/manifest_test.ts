// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, getHostedModeServerPort, goToResource, waitFor} from '../../shared/helper.js';
import {doubleClickSourceTreeItem, getDataGridData, navigateToApplicationTab} from '../helpers/application-helpers.js';

const MANIFEST_SELECTOR = '[aria-label="Manifest"]';

function shouldRunTest() {
  const features = process.env['CHROME_FEATURES'];
  return features !== undefined && features.includes('WebAppManifestDisplayOverride');
}

async function getInstallabilityError() {
    return await waitFor('is="dt-icon-label"');
}


describe('The Application Tab - Manifest', async () => {
  before(async () => {});

  it('display_override installability check', async () => {
    if (!shouldRunTest()) {
      return;
    }

    const {target} = getBrowserAndPages();

    await navigateToApplicationTab(target, 'manifest');
    await doubleClickSourceTreeItem(MANIFEST_SELECTOR);

    await step('waiting for error', async () => {
      await getInstallabilityError();
    });

  });
});
