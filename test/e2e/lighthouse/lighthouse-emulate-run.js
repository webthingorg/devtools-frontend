// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getPanel, getRunButton, navigateToLighthouseTab, waitForResults} from '../helpers/lighthouse-helpers.js';

describe('The Lighthouse Tab', async () => {
  it('mobile emulation works.', async () => {
    await navigateToLighthouseTab('resources/lighthouse-emulate-pass.html');

    LighthouseTestRunner.dumpStartAuditState();
    getRunButton().click();
    const {lhr} = await waitForResults();

    TestRunner.addResult('\n=============== Lighthouse Results ===============');
    TestRunner.addResult(`URL: ${lhr.finalUrl}`);
    TestRunner.addResult(`Version: ${lhr.lighthouseVersion}`);
    TestRunner.addResult(`formFactor: ${lhr.configSettings.formFactor}`);
    TestRunner.addResult(`screenEmulation: ${JSON.stringify(lhr.configSettings.screenEmulation, null, 2)}`);
    TestRunner.addResult(`Mobile network UA?: ${lhr.environment.networkUserAgent.includes('Mobile')}`);
    TestRunner.addResult(`Mobile configured UA?: ${lhr.configSettings.emulatedUserAgent.includes('Mobile')}`);
    TestRunner.addResult(`throttlingMethod: ${lhr.configSettings.throttlingMethod}`);
    TestRunner.addResult(`throttling.rttMs: ${lhr.configSettings.throttling.rttMs}`);
    TestRunner.addResult('');

    const auditName = 'content-width';
    const audit = lhr.audits[auditName];
    if (audit.scoreDisplayMode === 'error') {
      TestRunner.addResult(`${auditName}: ERROR ${audit.errorMessage}`);
    } else if (audit.scoreDisplayMode === 'binary') {
      TestRunner.addResult(`${auditName}: ${audit.score ? 'pass' : 'fail'} ${audit.explanation}`);
    } else {
      TestRunner.addResult(`${auditName}: ${audit.scoreDisplayMode}`);
    }

    TestRunner.completeTest();
  });
});
