// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('audits panel works when only the pwa category is selected.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-basic.html');

    const containerElement = getPanel().contentElement;
    const checkboxes = containerElement.querySelectorAll('.checkbox');
    for (const checkbox of checkboxes) {
      if (checkbox.textElement.textContent === 'Progressive Web App' ||
          checkbox.textElement.textContent === 'Clear storage') {
        continue;
      }

      if (checkbox.checkboxElement.checked) {
        checkbox.checkboxElement.click();
      }
    }

    LighthouseTestRunner.dumpStartAuditState();
    LighthouseTestRunner.getRunButton().click();

    const {lhr} = await LighthouseTestRunner.waitForResults();
    TestRunner.addResult('\n=============== Audits run ===============');
    TestRunner.addResult(Object.keys(lhr.audits).sort().join('\n'));

    TestRunner.completeTest();
  });
});
