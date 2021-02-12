// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';
import * as Components from '../components/components.js';

// eslint-disable-next-line rulesdir/es_modules_import
import type * as Main from './main.js';
import type * as InspectorMain from '../inspector_main/inspector_main.js';

import * as i18n from '../i18n/i18n.js';
export const UIStrings = {
  /**
  *@description Text in Main
  */
  focusDebuggee: 'Focus debuggee',
  /**
  *@description Text in the Shortcuts page in settings to explain a keyboard shortcut
  */
  toggleDrawer: 'Toggle drawer',
  /**
  *@description Title of an action that navigates to the next panel
  */
  nextPanel: 'Next panel',
  /**
  *@description Title of an action that navigates to the previous panel
  */
  previousPanel: 'Previous panel',
  /**
  *@description Title of an action that reloads the DevTools
  */
  reloadDevtools: 'Reload DevTools',
  /**
  *@description Title of an action in the main tool to toggle dock
  */
  restoreLastDockPosition: 'Restore last dock position',
  /**
  *@description Text in the Shortcuts page to explain a keyboard shortcut (zoom in)
  */
  zoomIn: 'Zoom in',
  /**
  *@description Text in the Shortcuts page to explain a keyboard shortcut (zoom out)
  */
  zoomOut: 'Zoom out',
  /**
  *@description Title of an action that reset the zoom level to its default
  */
  resetZoomLevel: 'Reset zoom level',
  /**
  *@description Title of an action to search in panel
  */
  searchInPanel: 'Search in panel',
  /**
  *@description Title of an action that cancels the current search
  */
  cancelSearch: 'Cancel search',
  /**
  *@description Title of an action that finds the next search result
  */
  findNextResult: 'Find next result',
  /**
  *@description Title of an action to find the previous search result
  */
  findPreviousResult: 'Find previous result',
  /**
  *@description Title of a setting under the Appearance category in Settings
  */
  theme: 'Theme:',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  switchToSystemPreferredColor: 'Switch to system preferred color theme',
  /**
  *@description A drop-down menu option to switch to system preferred color theme
  */
  systemPreference: 'System preference',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  switchToLightTheme: 'Switch to light theme',
  /**
  *@description A drop-down menu option to switch to light theme
  */
  light: 'Light',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  switchToDarkTheme: 'Switch to dark theme',
  /**
  *@description A drop-down menu option to switch to dark theme
  */
  dark: 'Dark',
  /**
  *@description A tag of theme preference settings that can be searched in the command menu
  */
  darkL: 'dark',
  /**
  *@description A tag of theme preference settings that can be searched in the command menu
  */
  lightL: 'light',
  /**
  *@description Title of a setting under the Appearance category in Settings
  */
  panelLayout: 'Panel layout:',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  useHorizontalPanelLayout: 'Use horizontal panel layout',
  /**
  *@description A drop-down menu option to use horizontal panel layout
  */
  horizontal: 'horizontal',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  useVerticalPanelLayout: 'Use vertical panel layout',
  /**
  *@description A drop-down menu option to use vertical panel layout
  */
  vertical: 'vertical',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  useAutomaticPanelLayout: 'Use automatic panel layout',
  /**
  *@description Text short for automatic
  */
  auto: 'auto',
  /**
  *@description Title of a setting under the Appearance category in Settings
  */
  colorFormat: 'Color format:',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  setColorFormatAsAuthored: 'Set color format as authored',
  /**
  *@description A drop-down menu option to set color format as authored
  */
  asAuthored: 'As authored',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  setColorFormatToHex: 'Set color format to HEX',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  setColorFormatToRgb: 'Set color format to RGB',
  /**
  *@description Title of a setting under the Appearance category that can be invoked through the Command Menu
  */
  setColorFormatToHsl: 'Set color format to HSL',
  /**
  *@description Title of a setting under the Appearance category in Settings
  */
  enableCtrlShortcutToSwitchPanels: 'Enable Ctrl + 1-9 shortcut to switch panels',
  /**
  *@description (Mac only) Title of a setting under the Appearance category in Settings
  */
  enableShortcutToSwitchPanels: 'Enable ⌘ + 1-9 shortcut to switch panels',
  /**
  *@description A drop-down menu option to dock to right
  */
  right: 'Right',
  /**
  *@description Text to dock the DevTools to the right of the browser tab
  */
  dockToRight: 'Dock to right',
  /**
  *@description A drop-down menu option to dock to bottom
  */
  bottom: 'Bottom',
  /**
  *@description Text to dock the DevTools to the bottom of the browser tab
  */
  dockToBottom: 'Dock to bottom',
  /**
  *@description A drop-down menu option to dock to left
  */
  left: 'Left',
  /**
  *@description Text to dock the DevTools to the left of the browser tab
  */
  dockToLeft: 'Dock to left',
  /**
  *@description A drop-down menu option to undock into separate window
  */
  undocked: 'Undocked',
  /**
  *@description Text to undock the DevTools
  */
  undockIntoSeparateWindow: 'Undock into separate window',
  /**
  *@description Name of the default set of DevTools keyboard shortcuts
  */
  devtoolsDefault: 'DevTools (Default)',
  /**
  *@description Name of a set of keyboard shortcuts from Visual Studio Code
  */
  visualStudioCode: 'Visual Studio Code',
};
const str_ = i18n.i18n.registerUIStrings('main/main-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedMainModule: (typeof Main|undefined);
let loadedInspectorMainModule: (typeof InspectorMain|undefined);

async function loadMainModule(): Promise<typeof Main> {
  if (!loadedMainModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('main');
    loadedMainModule = await import('./main.js');
  }
  return loadedMainModule;
}

// We load the `inspector_main` module for the action `inspector_main.focus-debuggee`
// which depends on it. It cannot be registered in `inspector_main-meta` as the action
// belongs to the shell app (the module `main` belongs to the`shell` app while
// `inspector_main` belongs to the `devtools_app`).

async function loadInspectorMainModule(): Promise<typeof InspectorMain> {
  if (!loadedInspectorMainModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('inspector_main');
    loadedInspectorMainModule = await import('../inspector_main/inspector_main.js');
  }
  return loadedInspectorMainModule;
}

UI.ActionRegistration.registerActionExtension({
  category: UI.ActionRegistration.ActionCategory.DRAWER,
  actionId: 'inspector_main.focus-debuggee',
  async loadActionDelegate() {
    const InspectorMain = await loadInspectorMainModule();
    return InspectorMain.InspectorMain.FocusDebuggeeActionDelegate.instance();
  },
  order: 100,
  title: i18nString(UIStrings.focusDebuggee),
});

UI.ActionRegistration.registerActionExtension({
  category: UI.ActionRegistration.ActionCategory.DRAWER,
  actionId: 'main.toggle-drawer',
  async loadActionDelegate() {
    return UI.InspectorView.ActionDelegate.instance();
  },
  order: 101,
  title: i18nString(UIStrings.toggleDrawer),
  bindings: [
    {
      shortcut: 'Esc',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.next-tab',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.nextPanel),
  async loadActionDelegate() {
    return UI.InspectorView.ActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+]',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+]',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.previous-tab',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.previousPanel),
  async loadActionDelegate() {
    return UI.InspectorView.ActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+[',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+[',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.debug-reload',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.reloadDevtools),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.ReloadActionDelegate.instance();
  },
  bindings: [
    {
      shortcut: 'Alt+R',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.restoreLastDockPosition),
  actionId: 'main.toggle-dock',
  async loadActionDelegate() {
    return UI.DockController.ToggleDockActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+D',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+D',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.zoom-in',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.zoomIn),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.ZoomActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Plus',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+Plus',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+NumpadPlus',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+NumpadPlus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Plus',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+Plus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+NumpadPlus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+NumpadPlus',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.zoom-out',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.zoomOut),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.ZoomActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Minus',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+Minus',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+NumpadMinus',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+NumpadMinus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Minus',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+Minus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+NumpadMinus',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+NumpadMinus',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.zoom-reset',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.resetZoomLevel),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.ZoomActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+0',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Numpad0',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Numpad0',
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+0',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.search-in-panel.find',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.searchInPanel),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.SearchActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+F',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+F',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'F3',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.search-in-panel.cancel',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.cancelSearch),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.SearchActionDelegate.instance();
  },
  order: 10,
  bindings: [
    {
      shortcut: 'Esc',
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.search-in-panel.find-next',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.findNextResult),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.SearchActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+G',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+G',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'F3',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
  ],
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'main.search-in-panel.find-previous',
  category: UI.ActionRegistration.ActionCategory.GLOBAL,
  title: i18nString(UIStrings.findPreviousResult),
  async loadActionDelegate() {
    const Main = await loadMainModule();
    return Main.MainImpl.SearchActionDelegate.instance();
  },
  bindings: [
    {
      platform: UI.ActionRegistration.Platforms.Mac,
      shortcut: 'Meta+Shift+G',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Ctrl+Shift+G',
    },
    {
      platform: UI.ActionRegistration.Platforms.WindowsLinux,
      shortcut: 'Shift+F3',
      keybindSets: [
        UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT,
        UI.ActionRegistration.KeybindSet.VS_CODE,
      ],
    },
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.APPEARANCE,
  title: i18nString(UIStrings.theme),
  settingName: 'uiTheme',
  settingType: Common.Settings.SettingTypeObject.ENUM,
  defaultValue: 'systemPreferred',
  reloadRequired: true,
  options: [
    {
      title: i18nString(UIStrings.switchToSystemPreferredColor),
      text: i18nString(UIStrings.systemPreference),
      value: 'systemPreferred',
    },
    {
      title: i18nString(UIStrings.switchToLightTheme),
      text: i18nString(UIStrings.light),
      value: 'default',
    },
    {
      title: i18nString(UIStrings.switchToDarkTheme),
      text: i18nString(UIStrings.dark),
      value: 'dark',
    },
  ],
  tags: [
    i18nString(UIStrings.darkL),
    i18nString(UIStrings.lightL),
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.APPEARANCE,
  title: i18nString(UIStrings.panelLayout),
  settingName: 'sidebarPosition',
  settingType: Common.Settings.SettingTypeObject.ENUM,
  defaultValue: 'auto',
  options: [
    {
      title: i18nString(UIStrings.useHorizontalPanelLayout),
      text: i18nString(UIStrings.horizontal),
      value: 'bottom',
    },
    {
      title: i18nString(UIStrings.useVerticalPanelLayout),
      text: i18nString(UIStrings.vertical),
      value: 'right',
    },
    {
      title: i18nString(UIStrings.useAutomaticPanelLayout),
      text: i18nString(UIStrings.auto),
      value: 'auto',
    },
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.APPEARANCE,
  title: i18nString(UIStrings.colorFormat),
  settingName: 'colorFormat',
  settingType: Common.Settings.SettingTypeObject.ENUM,
  defaultValue: 'original',
  options: [
    {
      title: i18nString(UIStrings.setColorFormatAsAuthored),
      text: i18nString(UIStrings.asAuthored),
      value: 'original',
    },
    {
      title: i18nString(UIStrings.setColorFormatToHex),
      text: 'HEX: #dac0de',
      value: 'hex',
      raw: true,
    },
    {
      title: i18nString(UIStrings.setColorFormatToRgb),
      text: 'RGB: rgb(128 255 255)',
      value: 'rgb',
      raw: true,
    },
    {
      title: i18nString(UIStrings.setColorFormatToHsl),
      text: 'HSL: hsl(300deg 80% 90%)',
      value: 'hsl',
      raw: true,
    },
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.APPEARANCE,
  title: i18nString(UIStrings.enableCtrlShortcutToSwitchPanels),
  titleMac: i18nString(UIStrings.enableShortcutToSwitchPanels),
  settingName: 'shortcutPanelSwitch',
  settingType: Common.Settings.SettingTypeObject.BOOLEAN,
  defaultValue: false,
});


Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.GLOBAL,
  settingName: 'currentDockState',
  settingType: Common.Settings.SettingTypeObject.ENUM,
  defaultValue: 'right',
  options: [
    {
      value: 'right',
      text: i18nString(UIStrings.right),
      title: i18nString(UIStrings.dockToRight),
    },
    {
      value: 'bottom',
      text: i18nString(UIStrings.bottom),
      title: i18nString(UIStrings.dockToBottom),
    },
    {
      value: 'left',
      text: i18nString(UIStrings.left),
      title: i18nString(UIStrings.dockToLeft),
    },
    {
      value: 'undocked',
      text: i18nString(UIStrings.undocked),
      title: i18nString(UIStrings.undockIntoSeparateWindow),
    },
  ],
});

Common.Settings.registerSettingExtension({
  settingName: 'activeKeybindSet',
  settingType: Common.Settings.SettingTypeObject.ENUM,
  defaultValue: 'devToolsDefault',
  options: [
    {
      value: 'devToolsDefault',
      title: i18nString(UIStrings.devtoolsDefault),
      text: i18nString(UIStrings.devtoolsDefault),
    },
    {
      value: 'vsCode',
      title: i18nString(UIStrings.visualStudioCode),
      text: i18nString(UIStrings.visualStudioCode),
    },
  ],
});

Common.Settings.registerSettingExtension({
  settingName: 'userShortcuts',
  settingType: Common.Settings.SettingTypeObject.ARRAY,
  defaultValue: [],
});

UI.ViewManager.registerLocationResolver({
  name: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  category: UI.ViewManager.ViewLocationCategoryValues.DRAWER,
  async loadResolver() {
    return UI.InspectorView.InspectorView.instance();
  },
});

UI.ViewManager.registerLocationResolver({
  name: UI.ViewManager.ViewLocationValues.DRAWER_SIDEBAR,
  category: UI.ViewManager.ViewLocationCategoryValues.DRAWER_SIDEBAR,
  async loadResolver() {
    return UI.InspectorView.InspectorView.instance();
  },
});

UI.ViewManager.registerLocationResolver({
  name: UI.ViewManager.ViewLocationValues.PANEL,
  category: UI.ViewManager.ViewLocationCategoryValues.PANEL,
  async loadResolver() {
    return UI.InspectorView.InspectorView.instance();
  },
});

UI.ContextMenu.registerProvider({
  contextTypes() {
    return [
      Workspace.UISourceCode.UISourceCode,
      SDK.Resource.Resource,
      SDK.NetworkRequest.NetworkRequest,
    ];
  },
  async loadProvider() {
    return Components.Linkifier.ContentProviderContextMenuProvider.instance();
  },
  experiment: undefined,
});

UI.ContextMenu.registerProvider({
  contextTypes() {
    return [
      Node,
    ];
  },
  async loadProvider() {
    return UI.XLink.ContextMenuProvider.instance();
  },
  experiment: undefined,
});

UI.ContextMenu.registerProvider({
  contextTypes() {
    return [
      Node,
    ];
  },
  async loadProvider() {
    return Components.Linkifier.LinkContextMenuProvider.instance();
  },
  experiment: undefined,
});
