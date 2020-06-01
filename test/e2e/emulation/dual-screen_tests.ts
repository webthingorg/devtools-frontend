// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';


import {$, $$, getBrowserAndPages, resourcesPath, waitFor, enableExperiment, click} from '../../shared/helper.js';
import {openDeviceToolbar} from '../helpers/emulation-helpers.js';

const deviceListSelector = '[aria-label="Mobile Devices"]';
const deviceListSelector2 = '.toolbar-button';
const duoSelector = '.checkbox';
const spanButtonSelector ='[aria-label="Toggle dual-screen mode"]';
const DEVICE_TOOLBAR_SELECTOR = '.device-mode-toolbar';

describe('Dual screen mode', async () => {
    beforeEach(async function() {
      await enableExperiment('dualScreenSupport', {canDock: true});
      const {target} = getBrowserAndPages();
      await target.goto(`${resourcesPath}/emulation/media-query-inspector.html`);
      await waitFor('.tabbed-pane-left-toolbar');
      await openDeviceToolbar();
    });
  
    it('lists all devices', async () => {
        const {frontend} = getBrowserAndPages();
        const toolbar = await $(DEVICE_TOOLBAR_SELECTOR);
        const button = await $(deviceListSelector2, toolbar);
        
        // console.log(button);
        await click(button); 
        
        // Navigate through options to get to "Surface Duo". Ideally we should select that option
        // by name or class, etc.
        await frontend.keyboard.press('ArrowUp');
        await frontend.keyboard.press('ArrowUp');
        await frontend.keyboard.press('ArrowUp');
        await frontend.keyboard.press('Enter');
        
        const spanButton = await $(spanButtonSelector);
        console.log(spanButton);
        await click(spanButton);

        // WIP: Take a screen shot for fun.
        await frontend.screenshot({path :'screenshot.png'});
    });
  });
  