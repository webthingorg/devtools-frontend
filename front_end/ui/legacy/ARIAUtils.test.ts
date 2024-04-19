// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';

import * as UI from './legacy.js';

describeWithEnvironment('ARIAUtils', () => {
  beforeEach(() => {
    UI.ARIAUtils.alert('');
    UI.ARIAUtils.alert('');
  });

  afterEach(() => {
    UI.ARIAUtils.alert('');
    UI.ARIAUtils.alert('');
  });

  function asAlertContainer(element: HTMLElement): UI.ARIAUtils.AlertContainer {
    return element as unknown as UI.ARIAUtils.AlertContainer;
  }

  describe('ARIAUtils.alertElementInstance', () => {
    it('switches elements to announce alerts', () => {
      const container = document.createElement('div');
      const element1 = UI.ARIAUtils.alertElementInstance(asAlertContainer(container));
      const element2 = UI.ARIAUtils.alertElementInstance(asAlertContainer(container));
      const element3 = UI.ARIAUtils.alertElementInstance(asAlertContainer(container));
      const element4 = UI.ARIAUtils.alertElementInstance(asAlertContainer(container));
      assert.strictEqual(element1, element3);
      assert.strictEqual(element2, element4);
      assert.strictEqual(element1.textContent, '');
      assert.strictEqual(element2.textContent, '');
    });
  });

  describe('ARIAUtils.alert', () => {
    it('shows alerts in the dialog if it is shown', () => {
      UI.ARIAUtils.initAlertElements(document.body as unknown as UI.ARIAUtils.AlertContainer);
      const dialog = new UI.Dialog.Dialog();
      UI.ARIAUtils.initAlertElements(asAlertContainer(dialog.contentElement));
      dialog.show();

      UI.ARIAUtils.alert('test');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementTwo].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementOne].textContent, 'test');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementTwo].textContent, '');

      UI.ARIAUtils.alert('test');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementTwo].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementTwo].textContent, 'test');
    });

    it('shows alerts in the body if the dialog is not shown', () => {
      UI.ARIAUtils.initAlertElements(document.body as unknown as UI.ARIAUtils.AlertContainer);
      const dialog = new UI.Dialog.Dialog();
      UI.ARIAUtils.initAlertElements(asAlertContainer(dialog.contentElement));
      dialog.hide();

      UI.ARIAUtils.alert('test');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementOne].textContent, 'test');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementTwo].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementTwo].textContent, '');

      UI.ARIAUtils.alert('test');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(document.body))[UI.ARIAUtils.alertElementTwo].textContent, 'test');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementOne].textContent, '');
      assert.strictEqual((asAlertContainer(dialog.contentElement))[UI.ARIAUtils.alertElementTwo].textContent, '');
    });
  });
});
