// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, getResultsElement, getRunButton, navigateToLighthouseTab, waitForResults} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('Lighthouse report is translated.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-basic.html');

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

    TestRunner.override(LighthouseTestRunner._panel().protocolService, 'getLocales', overrideLookupLocale, true);

    const locales = ['invalid-locale', 'es'];
    function overrideLookupLocale() {
      return locales;
    }

    LighthouseTestRunner.dumpStartAuditState();
    getRunButton().click();

    const {lhr} = await waitForResults();

    TestRunner.addResult(`resolved to locale ${lhr.configSettings.locale}`);
    TestRunner.addResult(`\ni18n footerIssue: "${lhr.i18n.rendererFormattedStrings.footerIssue}"`);

    const footerIssueLink = getResultsElement().querySelector('.lh-footer__version_issue');
    TestRunner.addResult(`\nFooter Issue Link Text: "${footerIssueLink.textContent}"`);

    TestRunner.completeTest();
  });
});
