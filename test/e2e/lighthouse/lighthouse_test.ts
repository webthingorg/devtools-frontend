// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {reloadDevTools} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {closeLighthouseTab, lighthousePanelContentIsLoaded, lighthouseTabDoesNotExist, lighthouseTabExists, navigateToLighthouseTab, openLighthousePanelFromCommandMenu, openLighthousePanelFromMoreTools} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Panel', async function() {
  // These tests open and close the panel, requiring changes in the UI that may take more time.
  this.timeout(20000);

  it('is open by default when devtools initializes', async () => {
    await navigateToLighthouseTab('empty');
  });

  it('closes without crashing and stays closed after reloading tools', async () => {
    await closeLighthouseTab();
    await reloadDevTools();
    await lighthouseTabDoesNotExist();
  });

  it('appears under "More tools" after being closed', async () => {
    await closeLighthouseTab();
    await openLighthousePanelFromMoreTools();
    await reloadDevTools({selectedPanel: {name: 'lighthouse'}});
    await lighthouseTabExists();
  });

  it('can be opened from command menu after being closed', async () => {
    await closeLighthouseTab();
    await openLighthousePanelFromCommandMenu();
  });

  it('opens if the query param "panel" is set', async () => {
    await closeLighthouseTab();
    await reloadDevTools({queryParams: {panel: 'lighthouse'}});
    await lighthouseTabExists();
    await lighthousePanelContentIsLoaded();
  });
});
