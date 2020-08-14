// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {click, getBrowserAndPages, getHostedModeServerPort, goToResource, waitFor} from '../../shared/helper.js';
import {doubleClickSourceTreeItem, getDataGridData, navigateToApplicationTab} from '../helpers/application-helpers.js';

const MANIFEST_SELECTOR = '[aria-label="Manifest"]';
let DOMAIN_SELECTOR: string;

function shouldRunTest() {
  const features = process.env['CHROME_FEATURES'];
  return features !== undefined && features.includes('WebAppManifestDisplayOverride');
}

describe('The Application Tab - Manifest', async () => {
  before(async () => {});

  it('display_override installability check', async () => {
    if (!shouldRunTest()) {
      return;
    }
  });
});
