// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, navigateToLighthouseTab} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('lighthouse panel passes flags.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-basic.html');

    const dialogElement = getPanel().contentElement;
    dialogElement.querySelector('input[name="lighthouse.device_type"][value="desktop"]').click();
    // Turn off simulated throttling.
    dialogElement.querySelector('.lighthouse-settings-pane > div')
        .shadowRoot.querySelectorAll('span')[2]
        .shadowRoot.querySelector('input')
        .click();

    LighthouseTestRunner.dumpStartAuditState();
    LighthouseTestRunner.getRunButton().click();

    const {lhr} = await LighthouseTestRunner.waitForResults();
    TestRunner.addResult('\n=============== Lighthouse Results ===============');
    TestRunner.addResult(`formFactor: ${lhr.configSettings.formFactor}`);
    TestRunner.addResult(`disableStorageReset: ${lhr.configSettings.disableStorageReset}`);
    TestRunner.addResult(`throttlingMethod: ${lhr.configSettings.throttlingMethod}`);

    const viewTraceButton = LighthouseTestRunner.getResultsElement().querySelector('.lh-button--trace');
    TestRunner.addResult(`\nView Trace Button Text: "${viewTraceButton.textContent}"`);
    TestRunner.addResult(`View Trace Button Title: "${viewTraceButton.title}"`);

    TestRunner.completeTest();
  });
});
