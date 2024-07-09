// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import {createFakeSetting, describeWithLocale} from '../../../../testing/EnvironmentHelpers.js';

import * as QuickOpen from './quick_open.js';

function createCommandMenuProvider() {
  const setting = createFakeSetting<boolean>('test-setting', false);
  setting.setRegistration({
    settingName: 'test-setting',
    settingType: Common.SettingRegistration.SettingType.BOOLEAN,
    category: Common.SettingRegistration.SettingCategory.APPEARANCE,
    defaultValue: false,
  });
  const provider = new QuickOpen.CommandMenu.CommandMenuProvider([
    QuickOpen.CommandMenu.CommandMenu.createSettingCommand(setting, i18n.i18n.lockedString('first setting'), true),
    QuickOpen.CommandMenu.CommandMenu.createSettingCommand(setting, i18n.i18n.lockedString('second setting'), true),
    QuickOpen.CommandMenu.CommandMenu.createSettingCommand(setting, i18n.i18n.lockedString('third setting'), true),
  ]);
  return provider;
}

describeWithLocale('FilteredListWidget', () => {
  it('set query to select item and type Enter', async () => {
    const provider = createCommandMenuProvider();
    const selectItem = sinon.spy(provider, 'selectItem');

    async function testSetting(query: string, expectation: number) {
      const filteredListWidget = new QuickOpen.FilteredListWidget.FilteredListWidget(provider, [], () => undefined);
      await filteredListWidget.setQuery(query);
      // FilteredListWidget.scheduleFilter uses setTimeout.
      await new Promise(resolve => window.setTimeout(resolve, 0));
      const keyboardEvent = new KeyboardEvent('keydown', {key: 'Enter'});
      filteredListWidget.contentElement.dispatchEvent(keyboardEvent);
      assert.strictEqual(expectation, selectItem.lastCall.args[0]);
    }

    await testSetting('third', 2);
    await testSetting('second', 1);
    await testSetting('first', 0);
  });

  it('type Enter when no item has been selected', () => {
    const provider = createCommandMenuProvider();
    const selectItem = sinon.spy(provider, 'selectItem');
    const filteredListWidget = new QuickOpen.FilteredListWidget.FilteredListWidget(provider, [], () => undefined);
    const keyboardEvent = new KeyboardEvent('keydown', {key: 'Enter'});
    filteredListWidget.contentElement.dispatchEvent(keyboardEvent);
    assert.isTrue(selectItem.notCalled);
  });
});
