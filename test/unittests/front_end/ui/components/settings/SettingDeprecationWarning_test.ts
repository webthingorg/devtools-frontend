// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../../../front_end/core/common/common.js';
import type * as Platform from '../../../../../../front_end/core/platform/platform.js';
import {assertNotNullOrUndefined} from '../../../../../../front_end/core/platform/platform.js';
import * as Root from '../../../../../../front_end/core/root/root.js';
import * as SettingComponents from '../../../../../../front_end/ui/components/settings/settings.js';

function createWarningElement(deprecation: Common.SettingRegistration.SettingRegistration['deprecation']) {
  const registration: Common.SettingRegistration.SettingRegistration = {
    settingName: 'boolean',
    settingType: Common.Settings.SettingType.BOOLEAN,
    defaultValue: false,
    deprecation,
  };
  const component = new SettingComponents.SettingDeprecationWarning.SettingDeprecationWarning();
  component.data = new Common.Settings.Deprecation(registration);
  const element = component.shadowRoot?.firstElementChild as HTMLElement | undefined;
  return {component, element};
}

const warning = () => 'Warning' as Platform.UIString.LocalizedString;

describe('SettingDeprecationWarning', () => {
  beforeEach(() => {
    Root.Runtime.experiments.clearForTest();
  });
  afterEach(() => {
    Root.Runtime.experiments.clearForTest();
  });

  it('shows the warning tooltip', () => {
    const {element} = createWarningElement({disabled: true, warning});
    assert.deepEqual(element?.title, warning());
  });

  it('is clickable when disabled and associated with an experiment', () => {
    Root.Runtime.experiments.register('testExperiment', 'testExperiment');
    const {element} = createWarningElement({disabled: true, warning, experiment: 'testExperiment'});
    assertNotNullOrUndefined(element);
    assert.include(Array.from(element.classList.values()), 'clickable');
  });

  it('is not clickable when not disabled and associated with an experiment', () => {
    Root.Runtime.experiments.register('testExperiment', 'testExperiment');
    const {element} = createWarningElement({disabled: false, warning, experiment: 'testExperiment'});
    assertNotNullOrUndefined(element);
    assert.notInclude(Array.from(element.classList.values()), 'clickable');
  });
});
