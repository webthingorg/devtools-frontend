// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages} from '../../shared/helper.js';
import {reloadDevTools} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {applicationPanelContentIsLoaded, applicationTabDoesNotExist, applicationTabExists, closeApplicationTab, navigateToApplicationTab, openApplicationPanelFromCommandMenu, openApplicationPanelFromMoreTools} from '../helpers/application-helpers.js';

describe('The Application Panel', async function() {
  // These tests open and close the panel, requiring changes in the UI that may take more time.
  this.timeout(20000);

  it('is open by default when devtools initializes', async () => {
    const {target} = getBrowserAndPages();
    await navigateToApplicationTab(target, 'cookies');
  });

  it('closes without crashing and stays closed after reloading tools', async () => {
    await closeApplicationTab();
    await reloadDevTools();
    await applicationTabDoesNotExist();
  });

  it('appears under "More tools" after being closed', async () => {
    await closeApplicationTab();
    await openApplicationPanelFromMoreTools();
    await reloadDevTools({selectedPanel: {name: 'application'}});
    await applicationTabExists();
  });

  it('can be opened from command menu after being closed', async () => {
    await closeApplicationTab();
    await openApplicationPanelFromCommandMenu();
  });

  it('opens if the query param "panel" is set', async () => {
    await closeApplicationTab();
    await reloadDevTools({queryParams: {panel: 'resources'}});
    await applicationTabExists();
    await applicationPanelContentIsLoaded();
  });
});
