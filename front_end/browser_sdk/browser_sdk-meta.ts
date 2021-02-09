// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';


export const UIStrings = {
  /**
  *@description Title of the Network tool
  */
  network: 'Network',
  /**
 *@description Text to preserve the log after refreshing
 */
  preserveLog: 'Preserve log',
  /**
 *@description A tag of Network preserve log settings that can be searched in the command menu
 */
  preserve: 'preserve',
  /**
 *@description A tag of Network preserve log settings that can be searched in the command menu
 */
  clear: 'clear',
  /**
 *@description A tag of Network preserve log settings that can be searched in the command menu
 */
  reset: 'reset',
  /**
 *@description Title of a setting under the Network category that can be invoked through the Command Menu
 */
  preserveLogOnPageReload: 'Preserve log on page reload / navigation',
  /**
 *@description Title of a setting under the Network category that can be invoked through the Command Menu
 */
  doNotPreserveLogOnPageReload: 'Do not preserve log on page reload / navigation',
  /**
 *@description Title of an action in the network tool to toggle recording
 */
  recordNetworkLog: 'Record network log',
};
const str_ = i18n.i18n.registerUIStrings('browser_sdk/browser_sdk-meta.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.NETWORK,
  title: i18nLazyString(UIStrings.preserveLog),
  settingName: 'network_log.preserve-log',
  settingType: Common.Settings.SettingTypeObject.BOOLEAN,
  defaultValue: false,
  tags: [
    i18nLazyString(UIStrings.preserve),
    i18nLazyString(UIStrings.clear),
    i18nLazyString(UIStrings.reset),
  ],
  options: [
    {
      value: true,
      title: i18nLazyString(UIStrings.preserveLogOnPageReload),
    },
    {
      value: false,
      title: i18nLazyString(UIStrings.doNotPreserveLogOnPageReload),
    },
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.NETWORK,
  title: i18nLazyString(UIStrings.recordNetworkLog),
  settingName: 'network_log.record-log',
  settingType: Common.Settings.SettingTypeObject.BOOLEAN,
  defaultValue: true,
  storageType: Common.Settings.SettingStorageType.Session,
});
