// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';

import * as SettingsScreen from './SettingsScreen.js';

const {assert} = chai;

describeWithEnvironment('SettingsScreen', () => {
  it('resets console-insights-onboarding-finished if console-insights-enabled becomes true', async () => {
    await import('./settings-meta.js');
    Common.Settings.moduleSetting('console-insights-enabled').set(true);
    Common.Settings.moduleSetting('console-insights-enabled').set(false);
    Common.Settings.Settings.instance().createLocalSetting('console-insights-onboarding-finished', false).set(true);
    // Force instance that will track the settings.
    SettingsScreen.SettingsScreen.instance();
    Common.Settings.moduleSetting('console-insights-enabled').set(true);
    assert.strictEqual(
        Common.Settings.Settings.instance().createLocalSetting('console-insights-onboarding-finished', false).get(),
        false);
  });
});
