// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';
import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Emulation from './emulation.js';

let loadedEmulationModule: (typeof Emulation|undefined);

async function loadEmulationModule(): Promise<typeof Emulation> {
  if (!loadedEmulationModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('emulation');
    loadedEmulationModule = await import('./emulation.js');
  }
  return loadedEmulationModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.SETTINGS_VIEW,
  commandPrompt: 'Show Devices',
  title: (): Platform.UIString.LocalizedString => ls`Devices`,
  order: 30,
  async loadView() {
    const Emulation = await loadEmulationModule();
    return Emulation.DevicesSettingsTab.DevicesSettingsTab.instance();
  },
  id: 'devices',
  settings: [
    'standardEmulatedDeviceList',
    'customEmulatedDeviceList',
  ],
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  commandPrompt: 'Show Sensors',
  title: (): Platform.UIString.LocalizedString => ls`Sensors`,
  id: 'sensors',
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 100,
  async loadView() {
    const Emulation = await loadEmulationModule();
    return Emulation.SensorsView.SensorsView.instance();
  },
  tags: [
    (): Platform.UIString.LocalizedString => ls`geolocation`,
    (): Platform.UIString.LocalizedString => ls`timezones`,
    (): Platform.UIString.LocalizedString => ls`locale`,
    (): Platform.UIString.LocalizedString => ls`locales`,
    (): Platform.UIString.LocalizedString => ls`accelerometer`,
    (): Platform.UIString.LocalizedString => ls`device orientation`,
  ],
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.SETTINGS_VIEW,
  id: 'emulation-locations',
  commandPrompt: 'Show Locations',
  title: (): Platform.UIString.LocalizedString => ls`Locations`,
  order: 40,
  async loadView() {
    const Emulation = await loadEmulationModule();
    return Emulation.LocationsSettingsTab.LocationsSettingsTab.instance();
  },
  settings: [
    'emulation.locations',
  ],
});
