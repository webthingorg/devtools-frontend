// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('Lighthouse panel displays a warning when important data may affect performance.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-storage.html');

    await TestRunner.RuntimeAgent.invoke_evaluate({
      expression: 'webSqlPromise',
      awaitPromise: true,
    });

    const containerElement = getPanel().contentElement;
    const checkboxes = containerElement.querySelectorAll('.checkbox');
    for (const checkbox of checkboxes) {
      if (checkbox.textElement.textContent === 'Performance' || checkbox.textElement.textContent === 'Clear storage') {
        continue;
      }

      if (checkbox.checkboxElement.checked) {
        checkbox.checkboxElement.click();
      }
    }

    LighthouseTestRunner.dumpStartAuditState();

    const Events = Lighthouse.LighthousePanel.getEvents();
    const warningText = containerElement.querySelector('.lighthouse-warning-text');

    // Wait for warning event to be handled
    LighthouseTestRunner._panel().controller.addEventListener(Events.PageWarningsChanged, () => {
      TestRunner.addResult(`Warning Text: ${warningText.textContent}`);
      TestRunner.completeTest();
    });
    LighthouseTestRunner.forcePageAuditabilityCheck();
  });
});
