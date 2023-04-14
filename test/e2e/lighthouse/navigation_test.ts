// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type * as puppeteer from 'puppeteer';

import {expectError} from '../../conductor/events.js';
import {
  $textContent,
  getBrowserAndPages,
  setDevToolsSettings,
  waitFor,
  waitForElementWithTextContent,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  clickStartButton,
  getAuditsBreakdown,
  getServiceWorkerCount,
  interceptNextFileSave,
  navigateToLighthouseTab,
  registerServiceWorker,
  renderHtmlInIframe,
  selectCategories,
  selectDevice,
  setLegacyNavigation,
  setThrottlingMethod,
  setToolbarCheckboxWithText,
  unregisterAllServiceWorkers,
  waitForResult,
} from '../helpers/lighthouse-helpers.js';

// This test will fail (by default) in headful mode, as the target page never gets painted.
// To resolve this when debugging, just make sure the target page is visible during the lighthouse run.

describe.skipOnParallel('Navigation', async function() {
  // The tests in this suite are particularly slow
  if (this.timeout() !== 0) {
    this.timeout(60_000);
  }

  let consoleLog: string[] = [];
  const consoleListener = (e: puppeteer.ConsoleMessage) => {
    consoleLog.push(e.text());
  };

  beforeEach(async () => {
    // https://github.com/GoogleChrome/lighthouse/issues/14572
    expectError(/Request CacheStorage\.requestCacheNames failed/);

    // https://bugs.chromium.org/p/chromium/issues/detail?id=1357791
    expectError(/Protocol Error: the message with wrong session id/);
    expectError(/Protocol Error: the message with wrong session id/);
    expectError(/Protocol Error: the message with wrong session id/);
    expectError(/Protocol Error: the message with wrong session id/);
    expectError(/Protocol Error: the message with wrong session id/);

    consoleLog = [];
    const {frontend} = await getBrowserAndPages();
    frontend.on('console', consoleListener);
  });

  afterEach(async function() {
    await unregisterAllServiceWorkers();

    const {frontend} = await getBrowserAndPages();
    frontend.off('console', consoleListener);

    if (this.currentTest?.isFailed()) {
      console.error(consoleLog.join('\n'));
    }
  });

  const modes = ['legacy', 'FR'];

  for (const mode of modes) {
    describe(`in ${mode} mode`, () => {
      it('successfully returns a Lighthouse report', async () => {
        await navigateToLighthouseTab('lighthouse/hello.html');
        await registerServiceWorker();

        await setLegacyNavigation(mode === 'legacy');
        await selectCategories([
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa',
          'lighthouse-plugin-publisher-ads',
        ]);

        let numNavigations = 0;
        const {target} = await getBrowserAndPages();
        target.on('framenavigated', () => ++numNavigations);

        await clickStartButton();

        const {lhr, artifacts, reportEl} = await waitForResult();

        if (mode === 'legacy') {
          // 1 initial about:blank jump
          // 1 about:blank jump + 1 navigation for the default pass
          // 1 about:blank jump + 1 navigation for the offline pass
          // 2 navigations to go to chrome://terms and back testing bfcache
          // 1 navigation after auditing to reset state
          assert.strictEqual(numNavigations, 8);
        } else {
          // 1 initial about:blank jump
          // 1 about:blank jump + 1 navigation for the default pass
          // 2 navigations to go to chrome://terms and back testing bfcache
          // 1 navigation after auditing to reset state
          assert.strictEqual(numNavigations, 6);
        }

        assert.strictEqual(lhr.lighthouseVersion, '10.1.1');
        assert.match(lhr.finalUrl, /^https:\/\/localhost:[0-9]+\/test\/e2e\/resources\/lighthouse\/hello.html/);

        assert.strictEqual(lhr.configSettings.throttlingMethod, 'simulate');
        assert.strictEqual(lhr.configSettings.disableStorageReset, false);
        assert.strictEqual(lhr.configSettings.formFactor, 'mobile');
        assert.strictEqual(lhr.configSettings.throttling.rttMs, 150);
        assert.strictEqual(lhr.configSettings.screenEmulation.disabled, true);
        assert.include(lhr.configSettings.emulatedUserAgent, 'Mobile');
        assert.include(lhr.environment.networkUserAgent, 'Mobile');

        assert.deepStrictEqual(artifacts.ViewportDimensions, {
          innerHeight: 823,
          innerWidth: 412,
          outerHeight: 823,
          outerWidth: 412,
          devicePixelRatio: 1.75,
        });

        const {auditResults, erroredAudits, failedAudits} = getAuditsBreakdown(lhr);
        assert.strictEqual(auditResults.length, 173);
        assert.deepStrictEqual(erroredAudits, []);
        assert.deepStrictEqual(failedAudits.map(audit => audit.id), [
          'service-worker',
          'installable-manifest',
          'splash-screen',
          'themed-omnibox',
          'maskable-icon',
          'document-title',
          'html-has-lang',
          'meta-description',
          'bf-cache',
        ]);

        const viewTraceButton = await $textContent('View Original Trace', reportEl);
        if (!viewTraceButton) {
          throw new Error('Could not find view trace button');
        }

        // Test view trace button behavior
        await viewTraceButton.click();
        let selectedTab = await waitFor('.tabbed-pane-header-tab.selected[aria-label="Performance"]');
        let selectedTabText = await selectedTab.evaluate(selectedTabEl => {
          return selectedTabEl.textContent;
        });
        assert.strictEqual(selectedTabText, 'Performance');

        await navigateToLighthouseTab();

        // Test element link behavior
        const lcpElementAudit = await waitForElementWithTextContent('Largest Contentful Paint element', reportEl);
        await lcpElementAudit.click();
        const lcpElementLink = await waitForElementWithTextContent('button');
        await lcpElementLink.click();

        selectedTab = await waitFor('.tabbed-pane-header-tab.selected[aria-label="Elements"]');
        selectedTabText = await selectedTab.evaluate(selectedTabEl => {
          return selectedTabEl.textContent;
        });
        assert.strictEqual(selectedTabText, 'Elements');

        const waitForJson = await interceptNextFileSave();

        // For some reason the CDP click command doesn't work here even if the tools menu is open.
        await reportEl.$eval(
            'a[data-action="save-json"]:not(.hidden)', saveJsonEl => (saveJsonEl as HTMLElement).click());

        const jsonContent = await waitForJson();
        assert.strictEqual(jsonContent, JSON.stringify(lhr, null, 2));

        const waitForHtml = await interceptNextFileSave();

        // For some reason the CDP click command doesn't work here even if the tools menu is open.
        await reportEl.$eval(
            'a[data-action="save-html"]:not(.hidden)', saveHtmlEl => (saveHtmlEl as HTMLElement).click());

        const htmlContent = await waitForHtml();
        const iframeHandle = await renderHtmlInIframe(htmlContent);
        const iframeAuditDivs = await iframeHandle.$$('.lh-audit');
        const frontendAuditDivs = await reportEl.$$('.lh-audit');
        assert.strictEqual(frontendAuditDivs.length, iframeAuditDivs.length);

        // Ensure service worker was cleared.
        assert.strictEqual(await getServiceWorkerCount(), 0);
      });

      // [crbug.com/1427407] Flaky in legacy mode
      if (mode !== 'legacy') {
        it('successfully returns a Lighthouse report with DevTools throttling', async () => {
          await navigateToLighthouseTab('lighthouse/hello.html');

          await setThrottlingMethod('devtools');
          await setLegacyNavigation(mode === 'legacy');

          await clickStartButton();

          const {lhr, reportEl} = await waitForResult();

          assert.strictEqual(lhr.configSettings.throttlingMethod, 'devtools');

          // [crbug.com/1347220] DevTools throttling can force resources to load slow enough for these audits to fail sometimes.
          const flakyAudits = [
            'server-response-time',
            'render-blocking-resources',
          ];

          const {auditResults, erroredAudits, failedAudits} = getAuditsBreakdown(lhr, flakyAudits);
          assert.strictEqual(auditResults.length, 150);
          assert.deepStrictEqual(erroredAudits, []);
          assert.deepStrictEqual(failedAudits.map(audit => audit.id), [
            'service-worker',
            'installable-manifest',
            'splash-screen',
            'themed-omnibox',
            'maskable-icon',
            'document-title',
            'html-has-lang',
            'meta-description',
            'bf-cache',
          ]);

          const viewTraceButton = await $textContent('View Trace', reportEl);
          assert.ok(viewTraceButton);
        });
      }

      it('successfully returns a Lighthouse report when settings changed', async () => {
        await setDevToolsSettings({language: 'es'});
        await navigateToLighthouseTab('lighthouse/hello.html');
        await registerServiceWorker();

        await setToolbarCheckboxWithText(mode === 'legacy', 'Navegación antigua');
        await setToolbarCheckboxWithText(false, 'Borrar almacenamiento');
        await selectCategories(['performance', 'best-practices']);
        await selectDevice('desktop');

        await clickStartButton();

        const {reportEl, lhr, artifacts} = await waitForResult();

        const {innerWidth, innerHeight, devicePixelRatio} = artifacts.ViewportDimensions;
        // TODO: Figure out why outerHeight can be different depending on OS
        assert.strictEqual(innerHeight, 720);
        assert.strictEqual(innerWidth, 1280);
        assert.strictEqual(devicePixelRatio, 1);

        const {erroredAudits} = getAuditsBreakdown(lhr);
        assert.deepStrictEqual(erroredAudits, []);

        assert.deepStrictEqual(Object.keys(lhr.categories), ['performance', 'best-practices']);
        assert.strictEqual(lhr.configSettings.disableStorageReset, true);
        assert.strictEqual(lhr.configSettings.formFactor, 'desktop');
        assert.strictEqual(lhr.configSettings.throttling.rttMs, 40);
        assert.strictEqual(lhr.configSettings.screenEmulation.disabled, true);
        assert.notInclude(lhr.configSettings.emulatedUserAgent, 'Mobile');
        assert.notInclude(lhr.environment.networkUserAgent, 'Mobile');

        const viewTraceButton = await $textContent('Ver rastro original', reportEl);
        assert.ok(viewTraceButton);

        const footerIssueText = await reportEl.$eval('.lh-footer__version_issue', footerIssueEl => {
          return footerIssueEl.textContent;
        });
        assert.strictEqual(lhr.i18n.rendererFormattedStrings.footerIssue, 'Notificar un problema');
        assert.strictEqual(footerIssueText, 'Notificar un problema');

        // Ensure service worker is not cleared because we disable the storage reset.
        assert.strictEqual(await getServiceWorkerCount(), 1);
      });
    });
  }
});
