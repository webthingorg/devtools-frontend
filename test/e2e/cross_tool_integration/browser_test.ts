// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {closeAllCloseableTabs, getBrowserAndPages, resourcesPath} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('Browser can', async () => {
  it('Reloaded website after all closeable tools are closed', async () => {
    // Navigate to website
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    await target.goto(targetUrl);

    // Open a few closeable panels
    await openPanelViaMoreTools('Animations');
    await openPanelViaMoreTools('Rendering');

    await closeAllCloseableTabs();
    await target.reload();
  });

  it('Navigate to a new website after all closeable tools are closed', async () => {
    // Navigate to website
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    const secondTargetUrl = `${resourcesPath}/cross_tool/site_with_errors.html`;
    await target.goto(targetUrl);

    // Open a few closeable panels
    await openPanelViaMoreTools('Animations');
    await openPanelViaMoreTools('Rendering');

    await closeAllCloseableTabs();
    // Navigate to a different website
    await target.goto(secondTargetUrl);
  });
});
