// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../../../front_end/core/common/common.js';
import type * as Platform from '../../../../../../../front_end/core/platform/platform.js';
import * as QuickOpen from '../../../../../../../front_end/ui/legacy/components/quick_open/quick_open.js';
import {createFakeSetting, describeWithLocale} from '../../../../helpers/EnvironmentHelpers.js';

function createCommandMenuProvider(
    deprecation: {disabled: boolean, warning: () => Platform.UIString.LocalizedString, experiment?: string}) {
  const setting = createFakeSetting<boolean>('Test Setting', false);
  setting.setRegistration({
    settingName: 'Test Setting',
    settingType: Common.SettingRegistration.SettingType.BOOLEAN,
    category: Common.SettingRegistration.SettingCategory.APPEARANCE,
    defaultValue: false,
    deprecation,
  });
  const command = QuickOpen.CommandMenu.CommandMenu.createSettingCommand(setting, 'Test Set Value', true);
  return new QuickOpen.CommandMenu.CommandMenuProvider([command]);
}

describeWithLocale('CommandMenu', () => {
  it('shows a deprecation warning for deprecated settings', () => {
    const deprecation = {disabled: true, warning: () => ('Deprecation Warning' as Platform.UIString.LocalizedString)};
    const provider = createCommandMenuProvider(deprecation);

    const toplevel = document.createElement('div');
    const container = toplevel.createChild('div');
    const titleElement = container.createChild('div');
    const subtitleElement = container.createChild('div');
    provider.renderItem(0, 'Test', titleElement, subtitleElement);

    const tags = Array.from(toplevel.querySelectorAll('.tag')) as HTMLElement[];
    try {
      assert.deepEqual(tags.map(e => e.textContent), ['Deprecated', 'Appearance']);
      assert.deepEqual(tags[0].title, 'Deprecation Warning');
    } finally {
      subtitleElement?.remove();
      titleElement?.remove();
      container?.remove();
      toplevel?.remove();
    }
  });
});
