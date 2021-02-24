// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import type * as Platform from '../platform/platform.js';
import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Emulation from './emulation.js';

import * as i18n from '../i18n/i18n.js';
export const UIStrings = {
  /**
  *@description Text for the mobile platform, as opposed to desktop
  */
  mobile: 'Mobile',
  /**
  *@description Title of an action in the emulation tool to toggle device mode
  */
  toggleDeviceToolbar: 'Toggle device toolbar',
  /**
  *@description Text for one or a group of screenshots
  */
  screenshot: 'Screenshot',
  /**
  *@description Title of an action in the emulation tool to capture screenshot
  */
  captureScreenshot: 'Capture screenshot',
  /**
  *@description Title of an action in the emulation tool to capture full height screenshot
  */
  captureFullSizeScreenshot: 'Capture full size screenshot',
  /**
  *@description Title of an action in the emulation tool to capture node screenshot
  */
  captureNodeScreenshot: 'Capture node screenshot',
  /**
  *@description Text in Device Mode Toolbar of the Device Toolbar
  */
  showMediaQueries: 'Show media queries',
  /**
  *@description Text in Device Mode Toolbar of the Device Toolbar
  */
  hideMediaQueries: 'Hide media queries',
  /**
  *@description A tag of Mobile related settings that can be searched in the command menu
  */
  device: 'device',
  /**
  *@description Text to show the measuring rulers on the target
  */
  showRulers: 'Show rulers',
  /**
  *@description Text in Device Mode Toolbar of the Device Toolbar
  */
  hideRulers: 'Hide rulers',
  /**
  *@description Text in Device Mode Toolbar of the Device Toolbar
  */
  showDeviceFrame: 'Show device frame',
  /**
  *@description Text in Device Mode Toolbar of the Device Toolbar
  */
  hideDeviceFrame: 'Hide device frame',
  /**
  *@description Title of the Devices tab
  */
  devices: 'Devices',
  /**
  *@description Title of an action in the emulation tool to show sensors
  */
  sensors: 'Sensors',
  /**
  *@description A tag of Sensors tool that can be searched in the command menu
  */
  geolocation: 'geolocation',
  /**
  *@description A tag of Sensors tool that can be searched in the command menu
  */
  timezones: 'timezones',
  /**
  *@description Text in Sensors View of the Device Toolbar
  */
  locale: 'locale',
  /**
  *@description A tag of Sensors tool that can be searched in the command menu
  */
  locales: 'locales',
  /**
  *@description A tag of Sensors tool that can be searched in the command menu
  */
  accelerometer: 'accelerometer',
  /**
  *@description A tag of Sensors tool that can be searched in the command menu
  */
  deviceOrientation: 'device orientation',
  /**
  *@description City name in Locations Settings
  */
  berlin: 'Berlin',
  /**
  *@description City name in Locations Settings
  */
  london: 'London',
  /**
  *@description City name in Locations Settings
  */
  moscow: 'Moscow',
  /**
  *@description City name in Locations Settings
  */
  mountainView: 'Mountain View',
  /**
  *@description City name in Locations Settings
  */
  mumbai: 'Mumbai',
  /**
  *@description City name in Locations Settings
  */
  sanFrancisco: 'San Francisco',
  /**
  *@description City name in Locations Settings
  */
  shanghai: 'Shanghai',
  /**
  *@description City name in Locations Settings
  */
  saoPaulo: 'São Paulo',
  /**
  *@description City name in Locations Settings
  */
  tokyo: 'Tokyo',
  /**
  *@description Title of Locations settings
  */
  locations: 'Locations',
  /**
  *@description Text for the touch type to simulate on a device
  */
  touch: 'Touch',
  /**
  *@description Text in Sensors View of the Device Toolbar
  */
  devicebased: 'Device-based',
  /**
  *@description Text in Sensors View of the Device Toolbar
  */
  forceEnabled: 'Force enabled',
  /**
  *@description Title of a section option in Sensors tab for idle emulation
  */
  emulateIdleDetectorState: 'Emulate Idle Detector state',
  /**
  *@description Title of an option in Sensors tab idle emulation select
  */
  noIdleEmulation: 'No idle emulation',
  /**
  *@description Title of an option in Sensors tab idle emulation select
  */
  userActiveScreenUnlocked: 'User active, screen unlocked',
  /**
  *@description Title of an option in Sensors tab idle emulation select
  */
  userActiveScreenLocked: 'User active, screen locked',
  /**
  *@description Title of an option in Sensors tab idle emulation select
  */
  userIdleScreenUnlocked: 'User idle, screen unlocked',
  /**
  *@description Title of an option in Sensors tab idle emulation select
  */
  userIdleScreenLocked: 'User idle, screen locked',
  /**
  *@description Title of an action that shows emulation.
  */
  showDevices: 'Show Devices',
  /**
  *@description Title of an action that shows sensors.
  */
  showSensors: 'Show Sensors',
  /**
  *@description Title of an action that shows geographic locations.
  */
  showLocations: 'Show Locations',
};
const str_ = i18n.i18n.registerUIStrings('emulation/emulation-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

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
  commandPrompt: i18nString(UIStrings.showDevices),
  title: i18nString(UIStrings.devices),
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
  commandPrompt: i18nString(UIStrings.showSensors),
  title: i18nString(UIStrings.sensors),
  id: 'sensors',
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  order: 100,
  async loadView() {
    const Emulation = await loadEmulationModule();
    return Emulation.SensorsView.SensorsView.instance();
  },
  tags: [
    i18nString(UIStrings.geolocation),
    i18nString(UIStrings.timezones),
    i18nString(UIStrings.locale),
    i18nString(UIStrings.locales),
    i18nString(UIStrings.accelerometer),
    i18nString(UIStrings.deviceOrientation),
  ],
});

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.SETTINGS_VIEW,
  id: 'emulation-locations',
  commandPrompt: i18nString(UIStrings.showLocations),
  title: i18nString(UIStrings.locations),
  order: 40,
  async loadView() {
    const Emulation = await loadEmulationModule();
    return Emulation.LocationsSettingsTab.LocationsSettingsTab.instance();
  },
  settings: [
    'emulation.locations',
  ],
});

UI.ActionRegistration.registerActionExtension({
  category: UI.ActionRegistration.ActionCategory.MOBILE,
  actionId: 'emulation.toggle-device-mode',
  toggleable: true,
  async loadActionDelegate() {
    const Emulation = await loadEmulationModule();
    return Emulation.DeviceModeWrapper.ActionDelegate.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  title: i18nString(UIStrings.toggleDeviceToolbar),
  iconClass: UI.ActionRegistration.IconClass.LARGEICON_PHONE,
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Shift+Ctrl+M',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Shift+Meta+M',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'emulation.capture-screenshot',
  category: UI.ActionRegistration.ActionCategory.SCREENSHOT,
  async loadActionDelegate() {
    const Emulation = await loadEmulationModule();
    return Emulation.DeviceModeWrapper.ActionDelegate.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  title: i18nString(UIStrings.captureScreenshot),
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'emulation.capture-full-height-screenshot',
  category: UI.ActionRegistration.ActionCategory.SCREENSHOT,
  async loadActionDelegate() {
    const Emulation = await loadEmulationModule();
    return Emulation.DeviceModeWrapper.ActionDelegate.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  title: i18nString(UIStrings.captureFullSizeScreenshot),
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'emulation.capture-node-screenshot',
  category: UI.ActionRegistration.ActionCategory.SCREENSHOT,
  async loadActionDelegate() {
    const Emulation = await loadEmulationModule();
    return Emulation.DeviceModeWrapper.ActionDelegate.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  title: i18nString(UIStrings.captureNodeScreenshot),
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'emulation.show-sensors',
  category: UI.ActionRegistration.ActionCategory.SENSORS,
  async loadActionDelegate() {
    const Emulation = await loadEmulationModule();
    return Emulation.SensorsView.ShowActionDelegate.instance();
  },
  title: i18nString(UIStrings.sensors),
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategory.MOBILE,
  settingName: 'showMediaQueryInspector',
  settingType: Common.Settings.SettingType.BOOLEAN,
  defaultValue: false,
  options: [
    {
      value: true,
      title: i18nString(UIStrings.showMediaQueries),
    },
    {
      value: false,
      title: i18nString(UIStrings.hideMediaQueries),
    },
  ],
  tags: [i18nString(UIStrings.device)],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategory.MOBILE,
  settingName: 'emulation.showRulers',
  settingType: Common.Settings.SettingType.BOOLEAN,
  defaultValue: false,
  options: [
    {
      value: true,
      title: i18nString(UIStrings.showRulers),
    },
    {
      value: false,
      title: i18nString(UIStrings.hideRulers),
    },
  ],
  tags: [i18nString(UIStrings.device)],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategory.MOBILE,
  settingName: 'emulation.showDeviceOutline',
  settingType: Common.Settings.SettingType.BOOLEAN,
  defaultValue: false,
  options: [
    {
      value: true,
      title: i18nString(UIStrings.showDeviceFrame),
    },
    {
      value: false,
      title: i18nString(UIStrings.hideDeviceFrame),
    },
  ],
  tags: [i18nString(UIStrings.device)],
});

Common.Settings.registerSettingExtension({
  settingName: 'emulation.locations',
  settingType: Common.Settings.SettingType.ARRAY,
  defaultValue: [
    {
      title: i18nString(UIStrings.berlin),
      lat: 52.520007,
      long: 13.404954,
      timezoneId: 'Europe/Berlin',
      locale: 'de_DE',
    },
    {
      title: i18nString(UIStrings.london),
      lat: 51.507351,
      long: -0.127758,
      timezoneId: 'Europe/London',
      locale: 'en_GB',
    },
    {
      title: i18nString(UIStrings.moscow),
      lat: 55.755826,
      long: 37.6173,
      timezoneId: 'Europe/Moscow',
      locale: 'ru_RU',
    },
    {
      title: i18nString(UIStrings.mountainView),
      lat: 37.386052,
      long: -122.083851,
      timezoneId: 'US/Pacific',
      locale: 'en_US',
    },
    {
      title: i18nString(UIStrings.mumbai),
      lat: 19.075984,
      long: 72.877656,
      timezoneId: 'Asia/Kolkata',
      locale: 'mr_IN',
    },
    {
      title: i18nString(UIStrings.sanFrancisco),
      lat: 37.774929,
      long: -122.419416,
      timezoneId: 'US/Pacific',
      locale: 'en_US',
    },
    {
      title: i18nString(UIStrings.shanghai),
      lat: 31.230416,
      long: 121.473701,
      timezoneId: 'Asia/Shanghai',
      locale: 'zh_Hans_CN',
    },
    {
      title: i18nString(UIStrings.saoPaulo),
      lat: -23.55052,
      long: -46.633309,
      timezoneId: 'America/Sao_Paulo',
      locale: 'pt_BR',
    },
    {
      title: i18nString(UIStrings.tokyo),
      lat: 35.689487,
      long: 139.691706,
      timezoneId: 'Asia/Tokyo',
      locale: 'ja_JP',
    },
  ],
});

Common.Settings.registerSettingExtension({
  title: i18nString(UIStrings.touch),
  reloadRequired: true,
  settingName: 'emulation.touch',
  settingType: Common.Settings.SettingType.ENUM,
  defaultValue: 'none',
  options: [
    {
      value: 'none',
      title: i18nString(UIStrings.devicebased),
      text: i18nString(UIStrings.devicebased),
    },
    {
      value: 'force',
      title: i18nString(UIStrings.forceEnabled),
      text: i18nString(UIStrings.forceEnabled),
    },
  ],
});

Common.Settings.registerSettingExtension({
  title: i18nString(UIStrings.emulateIdleDetectorState),
  settingName: 'emulation.idleDetection',
  settingType: Common.Settings.SettingType.ENUM,
  defaultValue: 'none',
  options: [
    {
      value: 'none',
      title: i18nString(UIStrings.noIdleEmulation),
      text: i18nString(UIStrings.noIdleEmulation),
    },
    {
      value: '{\"isUserActive\":true,\"isScreenUnlocked\":true}',
      title: i18nString(UIStrings.userActiveScreenUnlocked),
      text: i18nString(UIStrings.userActiveScreenUnlocked),
    },
    {
      value: '{\"isUserActive\":true,\"isScreenUnlocked\":false}',
      title: i18nString(UIStrings.userActiveScreenLocked),
      text: i18nString(UIStrings.userActiveScreenLocked),
    },
    {
      value: '{\"isUserActive\":false,\"isScreenUnlocked\":true}',
      title: i18nString(UIStrings.userIdleScreenUnlocked),
      text: i18nString(UIStrings.userIdleScreenUnlocked),
    },
    {
      value: '{\"isUserActive\":false,\"isScreenUnlocked\":false}',
      title: i18nString(UIStrings.userIdleScreenLocked),
      text: i18nString(UIStrings.userIdleScreenLocked),
    },
  ],
});

UI.Toolbar.registerToolbarItem({
  actionId: 'emulation.toggle-device-mode',
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  location: UI.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_LEFT,
  order: 1,
  showLabel: undefined,
  loadItem: undefined,
  separator: undefined,
});

Common.AppProvider.registerAppProvider({
  async loadAppProvider() {
    const Emulation = await loadEmulationModule();
    return Emulation.AdvancedApp.AdvancedAppProvider.instance();
  },
  condition: Root.Runtime.ConditionName.CAN_DOCK,
  order: 0,
});

UI.ContextMenu.registerItem({
  location: UI.ContextMenu.ItemLocation.DEVICE_MODE_MENU_SAVE,
  order: 12,
  actionId: 'emulation.capture-screenshot',
});

UI.ContextMenu.registerItem({
  location: UI.ContextMenu.ItemLocation.DEVICE_MODE_MENU_SAVE,
  order: 13,
  actionId: 'emulation.capture-full-height-screenshot',
});
