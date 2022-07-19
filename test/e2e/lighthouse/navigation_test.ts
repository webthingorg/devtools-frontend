// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {expectError} from '../../conductor/events.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  clickStartButton,
  getAuditsBreakdown,
  navigateToLighthouseTab,
  setLegacyNavigation,
  setThrottlingMethod,
  waitForArtifacts,
  waitForLHR,
  waitForReport,
} from '../helpers/lighthouse-helpers.js';

// This test will fail (by default) in headful mode, as the target page never gets painted.
// To resolve this when debugging, just make sure the target page is visible during the lighthouse run.

describe('Navigation', async function() {
  // The tests in this suite are particularly slow
  this.timeout(60_000);

  const modes = ['legacy', 'FR'];

  for (const mode of modes) {
    describe(`in ${mode} mode`, () => {
      beforeEach(() => {
        if (mode === 'FR') {
          // TODO: Figure out why these are emitted in FR.
          expectError(/Protocol Error: the message with wrong session id/);
          expectError(/Protocol Error: the message with wrong session id/);
        }
      });

      it('successfully returns a Lighthouse report', async () => {
        await navigateToLighthouseTab('lighthouse/hello.html');

        await setLegacyNavigation(mode === 'legacy');
        await clickStartButton();

        const lhr = await waitForLHR();
        const artifacts = await waitForArtifacts();
        const reportEl = await waitForReport();

        assert.strictEqual(lhr.lighthouseVersion, '9.6.2');
        assert.match(lhr.finalUrl, /https:\/\/localhost:[0-9]+\/test\/e2e\/resources\/lighthouse\/hello.html/);
        assert.strictEqual(lhr.configSettings.throttlingMethod, 'simulate');
        assert.deepStrictEqual(artifacts.ViewportDimensions, {
          innerWidth: 980,
          innerHeight: 1742,
          outerWidth: 360,
          outerHeight: 640,
          devicePixelRatio: 3,
        });

        const {auditResults, failedAudits, erroredAudits} = getAuditsBreakdown(lhr);
        assert.strictEqual(auditResults.length, 152);
        assert.strictEqual(failedAudits.length, 14);
        assert.strictEqual(erroredAudits.length, 0);

        const viewTraceText = await reportEl.$eval('.lh-button--trace', viewTraceEl => {
          return viewTraceEl.textContent;
        });
        assert.strictEqual(viewTraceText, 'View Original Trace');
      });

      it('successfully returns a Lighthouse report with DevTools throttling', async () => {
        await navigateToLighthouseTab('lighthouse/hello.html');

        await setThrottlingMethod('devtools');
        await setLegacyNavigation(mode === 'legacy');
        await clickStartButton();

        const lhr = await waitForLHR();
        const reportEl = await waitForReport();

        assert.strictEqual(lhr.configSettings.throttlingMethod, 'devtools');

        const {auditResults, erroredAudits} = getAuditsBreakdown(lhr);
        assert.strictEqual(auditResults.length, 152);
        assert.strictEqual(erroredAudits.length, 0);

        const viewTraceText = await reportEl.$eval('.lh-button--trace', viewTraceEl => {
          return viewTraceEl.textContent;
        });
        assert.strictEqual(viewTraceText, 'View Trace');
      });
    });
  }
});
