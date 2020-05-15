// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {reloadDevTools} from '../../shared/helper.js';
import {closeSecurityTab, navigateToSecurityTab, openSecurityPanelFromCommandMenu, openSecurityPanelFromMoreTools, securityContentPanelIsLoaded, securityTabDoesNotExists, securityTabExists} from '../helpers/security-helpers.js';

describe('The Security Panel', async () => {
  it('is open by default when devtools initializes', async () => {
    await navigateToSecurityTab();
  });

  it('closes without crashing and stay closed', async () => {
    await closeSecurityTab();
    await reloadDevTools();
    await securityTabDoesNotExists();
  });

  it('appears under More tools', async () => {
    await closeSecurityTab();
    await openSecurityPanelFromMoreTools();
    await reloadDevTools({selectedPanel: {name: 'security'}});
    await securityTabExists();
  });

  it('opens from command menu', async () => {
    await closeSecurityTab();
    await openSecurityPanelFromCommandMenu();
  });

  it('opens with queryparam', async () => {
    await closeSecurityTab();
    await reloadDevTools({selectedPanel: {name: 'security'}, queryParam: 'panel=security'});
    await securityTabExists();
    await securityContentPanelIsLoaded();
  });
});
