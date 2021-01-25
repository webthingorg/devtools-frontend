// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import type * as Platform from '../platform/platform.js';
import {ls} from '../platform/platform.js';

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.NETWORK,
  title: (): Platform.UIString.LocalizedString => ls`Preserve log`,
  settingName: 'network_log.preserve-log',
  settingType: Common.Settings.SettingTypeObject.BOOLEAN,
  defaultValue: false,
  tags: [
    (): Platform.UIString.LocalizedString => ls`preserve`,
    (): Platform.UIString.LocalizedString => ls`clear`,
    (): Platform.UIString.LocalizedString => ls`reset`,
  ],
  options: [
    {
      value: true,
      title: (): Platform.UIString.LocalizedString => ls`Preserve log on page reload / navigation`,
    },
    {
      value: false,
      title: (): Platform.UIString.LocalizedString => ls`Do not preserve log on page reload / navigation`,
    },
  ],
});

Common.Settings.registerSettingExtension({
  category: Common.Settings.SettingCategoryObject.NETWORK,
  title: (): Platform.UIString.LocalizedString => ls`Record network log`,
  settingName: 'network_log.record-log',
  settingType: Common.Settings.SettingTypeObject.BOOLEAN,
  defaultValue: true,
  storageType: Common.Settings.SettingStorageType.Session,
});
