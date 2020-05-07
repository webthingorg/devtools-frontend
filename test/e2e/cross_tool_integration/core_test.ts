// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {closeAllCloseableTabs, getBrowserAndPages, resourcesPath} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('Cross tool integration', async () => {
  it('Website can be reloaded after all closeable tools are closed', async () => {
    // navigate to website
    const {target} = getBrowserAndPages();
    const targetUrl = `${resourcesPath}/cross_tool/default.html`;
    await target.goto(targetUrl);

    await openPanelViaMoreTools('Animations');
    await openPanelViaMoreTools('Rendering');
    await openPanelViaMoreTools('Layers');

    await closeAllCloseableTabs();
    await target.reload();
  });
});
