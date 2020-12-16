// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click, getBrowserAndPages, step, waitFor} from '../../shared/helper.js';
import {beforeEach, describe, it} from '../../shared/mocha-extensions.js';
import {doubleClickSourceTreeItem, navigateToApplicationTab} from '../helpers/application-helpers.js';

const TEST_HTML_FILE = 'service-worker-network';
const SERVICE_WORKER_UPDATE_TIMELINE_SELECTOR = 'resource-service-worker-update-view';
/** @type {puppeteer.Page | null} */
var targett = null;

describe('The Application Tab', async () => {
  beforeEach(async () => {
    var {target} = getBrowserAndPages();
    targett = target;
    await navigateToApplicationTab(target, TEST_HTML_FILE);
  });

  it('Navigate to a page with service worker we should find service worker update timeline info', async () => {
    await step('wait and locate service worker update time line', async () => {
      waitFor(SERVICE_WORKER_UPDATE_TIMELINE_SELECTOR);
    });
  });
});
