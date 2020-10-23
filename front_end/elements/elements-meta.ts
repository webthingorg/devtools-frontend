// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import {ls} from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';

async function loadElementsModule() {
  // Side-effect import resources in module.json
  await Root.Runtime.Runtime.instance().loadModulePromise('elements');

  return import('./elements.js');
}

UI.ViewManager.registerViewExtension({
  title: ls`Elements`,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  id: 'elements',
  hasToolbar: false,
  async loadView() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsPanel.instance();
  },
  location: UI.ViewManager.ViewLocationValues.PANEL,
  order: 10,
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'elements.hide-element',
  category: UI.ActionRegistration.ActionCategory.ELEMENTS,
  title: ls`Hide element`,
  async loadActionDelegate() {
    const Elements = await loadElementsModule();
    return Elements.ElementsPanel.ElementsActionDelegate.instance();
  },
  async loadContextTypes() {
    const Elements = await loadElementsModule();
    return [Elements.ElementsPanel.ElementsPanel];
  },
  bindings: [
    {
      shortcut: 'H',
      platform: undefined,
      keybindSets: undefined,
    },
  ],
  iconClass: undefined,
  toggleWithRedColor: undefined,
  toggledIconClass: undefined,
  tags: undefined,
  toggleable: undefined,
  options: undefined,
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategory.ELEMENTS,
  order: 1,
  title: ls`Show user agent shadow DOM`,
  settingName: 'showUAShadowDOM',
  settingType: Common.Settings.SettingType.BOOLEAN,
  defaultValue: false,
  tags: undefined,
  isRegex: undefined,
  options: undefined,
  reloadRequired: undefined,
  storageType: undefined,
  titleMac: undefined,
  userActionCondition: undefined,
});
