// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Host from '../../../../../front_end/core/host/host.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Emulation from '../../../../../front_end/panels/emulation/emulation.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import {deinitializeGlobalVars, initializeGlobalVars} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('AdvancedApp', () => {
  beforeEach(async () => {
    await deinitializeGlobalVars();
    await initializeGlobalVars();
  });

  after(async () => {
    await deinitializeGlobalVars();
  });

  it('updates colors node link on ColorThemeChanged', async () => {
    const advancedApp = Emulation.AdvancedApp.AdvancedApp.instance();
    assertNotNullOrUndefined(advancedApp);

    const dockController = UI.DockController.DockController.instance({forceNew: null, canDock: true});
    const event = {from: dockController.dockSide(), to: UI.DockController.DockState.UNDOCKED};
    dockController.dispatchEventToListeners(UI.DockController.Events.BeforeDockSideChanged, event);

    const refetchColorsSpy = sinon.spy(UI.Utils.DynamicTheming, 'refetchColors');

    Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.dispatchEventToListeners(
        Host.InspectorFrontendHostAPI.Events.ColorThemeChanged);

    // one call for main document, one for toolbox
    assert.isTrue(refetchColorsSpy.calledTwice);
  });
});
