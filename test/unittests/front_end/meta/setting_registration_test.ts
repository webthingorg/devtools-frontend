// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../front_end/common/common.js';
import * as QuickOpen from '../../../../front_end/quick_open/quick_open.js';
import {initializeGlobalVars} from '../helpers/EnvironmentHelpers.js';

const {assert} = chai;
const settingName = 'mockSetting';
const settingTitle = 'Mock setting';
const settingCategory = 'Console';
const enableTitle = 'Enable mock setting';
const disableTitle = 'Disable mock setting';

describe('Action registration', () => {
  before(() => {
    Common.Settings.registerSettingExtension({
      category: settingCategory,
      title: settingTitle,
      settingType: 'boolean',
      settingName,
      defaultValue: false,
      options: [
        {
          value: true,
          title: enableTitle,
        },
        {
          value: false,
          title: disableTitle,
        },
      ],
    });
    initializeGlobalVars();
  });

  it('Retrieves a registered setting', () => {
    try {
      const preRegisteredSetting = Common.Settings.Settings.instance().moduleSetting(settingName) as
          Common.Settings.PreRegisteredSetting<boolean>;
      assert.strictEqual(preRegisteredSetting.title(), settingTitle, 'Setting title is not returned correctly');
      assert.strictEqual(
          preRegisteredSetting.category(), settingCategory, 'Setting category is not returned correctly');
      assert.isNotTrue(preRegisteredSetting.get(), 'Setting value is not returned correctly');
    } catch (error) {
      assert.fail('Failed to find setting registration');
    }
  });

  it('Adds commands for changing a setting\'s value', () => {
    const allCommands = QuickOpen.CommandMenu.CommandMenu.instance({forceNew: true}).commands();
    const disableSettingCommands =
        allCommands.filter(command => command.title() === disableTitle && command.category() === settingCategory);
    const enableSettingCommands =
        allCommands.filter(command => command.title() === enableTitle && command.category() === settingCategory);
    assert.strictEqual(
        disableSettingCommands.length, 1, 'Commands for changing a setting\'s value were not added correctly');
    assert.strictEqual(
        enableSettingCommands.length, 1, 'Commands for changing a setting\'s value were not added correctly');
  });

  it('Triggers a setting\'s change listener when a setting is set', () => {
    const preRegisteredSetting =
        Common.Settings.Settings.instance().moduleSetting(settingName) as Common.Settings.PreRegisteredSetting<boolean>;
    let settingChanged = false;
    preRegisteredSetting.addChangeListener(() => {
      settingChanged = true;
    });
    preRegisteredSetting.set(true);
    assert.isTrue(settingChanged, 'Setting\'s change listener was not triggered after the setting was set');
  });

  it('Throws an error when trying to register a duplicated setting name', () => {
    assert.throws(() => {
      Common.Settings.registerSettingExtension({
        settingName,
        settingType: 'boolean',
        defaultValue: false,
      });
    });
  });
});
