// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
import * as UI from '../../ui/legacy/legacy.js';

import type * as Freestyler from './freestyler.js';

const UIStrings = {
  /**
   * @description The title of the action for showing Freestyler panel.
   */
  showFreestyler: 'Show Freestyler',
  /**
   * @description The title of the Freestyler panel.
   */
  freestyler: 'Freestyler',
  /**
   * @description The setting title to enable the freestyler via
   * the settings tab.
   */
  enableFreestyler: 'Freestyler Enabled',
  /**
   *@description Text of a tooltip to redirect to the AI assistant panel with
   *the current element as context
   */
  askAI: 'Ask AI',
};
const str_ = i18n.i18n.registerUIStrings('panels/freestyler/freestyler-meta.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

let loadedFreestylerModule: (typeof Freestyler|undefined);

async function loadFreestylerModule(): Promise<typeof Freestyler> {
  if (!loadedFreestylerModule) {
    loadedFreestylerModule = await import('./freestyler.js');
  }
  return loadedFreestylerModule;
}

function isFeatureAvailable(): boolean {
  return Root.Runtime.Runtime.queryParam('freestyler_dogfood') === 'true';
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: 'freestyler',
  commandPrompt: i18nLazyString(UIStrings.showFreestyler),
  title: i18nLazyString(UIStrings.freestyler),
  order: 10,
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  hasToolbar: false,
  condition: isFeatureAvailable,
  async loadView() {
    const Freestyler = await loadFreestylerModule();
    return Freestyler.FreestylerPanel.instance();
  },
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategory.NONE,
  settingName: 'freestyler-enabled',
  settingType: Common.Settings.SettingType.BOOLEAN,
  title: i18nLazyString(UIStrings.enableFreestyler),
  defaultValue: isFeatureAvailable() ? true : false,
  reloadRequired: true,
  disabledCondition: () => {
    if (!isFeatureAvailable()) {
      return {reason: 'Freestyler disabled', disabled: true};
    }
    return {disabled: false};
  },
});

UI.ActionRegistration.registerActionExtension({
  actionId: 'freestyler.element-panel-context',
  contextTypes(): [] {
    return [];
  },
  setting: 'freestyler-enabled',
  category: UI.ActionRegistration.ActionCategory.NONE,
  title: i18nLazyString(UIStrings.askAI),
  async loadActionDelegate() {
    const Freestyler = await loadFreestylerModule();
    return new Freestyler.ActionDelegate();
  },
  condition: isFeatureAvailable,
});
