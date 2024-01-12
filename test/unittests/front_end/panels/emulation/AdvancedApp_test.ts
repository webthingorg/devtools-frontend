// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Host from '../../../../../front_end/core/host/host.js';
import {assertNotNullOrUndefined} from '../../../../../front_end/core/platform/platform.js';
import * as Emulation from '../../../../../front_end/panels/emulation/emulation.js';
import * as UI from '../../../../../front_end/ui/legacy/legacy.js';
import * as ThemeSupport from '../../../../../front_end/ui/legacy/theme_support/theme_support.js';
import {deinitializeGlobalVars, initializeGlobalVars} from '../../helpers/EnvironmentHelpers.js';
import {describeWithMockConnection} from '../../helpers/MockConnection.js';

describeWithMockConnection('AdvancedApp', () => {
  const originalColorHref = 'devtools://theme/colors.css?sets=ui,chrome';

  beforeEach(async () => {
    await deinitializeGlobalVars();
    sinon.stub(UI.ActionRegistry.ActionRegistry.instance(), 'getAction')
        .withArgs(sinon.match(/emulation.toggle-device-mode/))
        .returns(sinon.createStubInstance(UI.ActionRegistration.Action));
    await initializeGlobalVars();
  });

  after(async () => {
    await deinitializeGlobalVars();
  });

  it('updates colors node link on ColorThemeChanged', async () => {
    const COLORS_CSS_SELECTOR = 'link[href*=\'//theme/colors.css\']';
    const advancedApp = Emulation.AdvancedApp.AdvancedApp.instance();
    assertNotNullOrUndefined(advancedApp);

    const doc = document.implementation.createHTMLDocument();
    const colorsLink = document.createElement('link');
    colorsLink.href = originalColorHref;
    colorsLink.rel = 'stylesheet';
    doc.head.appendChild(colorsLink);
    sinon.stub(ThemeSupport.ThemeSupport.instance(), 'applyTheme');
    advancedApp.presentUI(doc);
    const originalShow = UI.Widget.Widget.prototype.show;
    UI.Widget.Widget.prototype.show = () => {};
    advancedApp.deviceModeEmulationFrameLoaded(doc);

    UI.Widget.Widget.prototype.show = originalShow;

    const dockController = UI.DockController.DockController.instance({forceNew: null, canDock: true});
    const event = {from: dockController.dockSide(), to: UI.DockController.DockState.UNDOCKED};
    dockController.dispatchEventToListeners(UI.DockController.Events.BeforeDockSideChanged, event);

    let colorCssNode = advancedApp.toolboxDocumentForTest()?.querySelector(COLORS_CSS_SELECTOR);
    assertNotNullOrUndefined(colorCssNode);
    const href = colorCssNode.getAttribute('href');
    assert.strictEqual(href, originalColorHref);

    Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.dispatchEventToListeners(
        Host.InspectorFrontendHostAPI.Events.ColorThemeChanged);

    colorCssNode = advancedApp.toolboxDocumentForTest()?.body.querySelector(COLORS_CSS_SELECTOR);
    assertNotNullOrUndefined(colorCssNode);
    const updatedHref = colorCssNode.getAttribute('href');
    assert.notEqual(updatedHref, originalColorHref);
  });
});
