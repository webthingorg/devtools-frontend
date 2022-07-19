// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, goToResource, waitFor, waitForFunction} from '../../shared/helper.js';

import {waitForQuotaUsage} from './application-helpers.js';

import {type ElementHandle} from 'puppeteer';

export async function waitForLighthousePanelContentLoaded() {
  await waitFor('.view-container[aria-label="Lighthouse panel"]');
}

export async function navigateToLighthouseTab(path?: string): Promise<ElementHandle<Element>> {
  await click('#tab-lighthouse');
  await waitForLighthousePanelContentLoaded();
  if (path) {
    await goToResource(path);
  }

  return waitFor('.lighthouse-start-view-fr');
}

export async function waitForReport() {
  return await waitFor('.lh-root');
}

// Instead of watching the worker or controller/panel internals, we wait for the Lighthouse renderer
// to create the new report DOM. And we pull the LHR off the lh-root node.
export async function waitForLHR() {
  return await waitForFunction(async () => {
    const reportEl = await waitForReport();
    return await reportEl.evaluate(elem => {
      // @ts-ignore we installed this obj on a DOM element
      const lhr = elem._lighthouseResultForTesting;
      // Delete so any subsequent runs don't accidentally reuse this.
      // @ts-ignore
      delete elem._lighthouseResultForTesting;
      return lhr;
    });
  });
}

// Instead of watching the worker or controller/panel internals, we wait for the Lighthouse renderer
// to create the new report DOM. And we pull the LHR off the lh-root node.
export async function waitForArtifacts() {
  return await waitForFunction(async () => {
    const reportEl = await waitForReport();
    return await reportEl.evaluate(elem => {
      // @ts-ignore we installed this obj on a DOM element
      const artifacts = elem._lighthouseArtifactsForTesting;
      // Delete so any subsequent runs don't accidentally reuse this.
      // @ts-ignore
      delete elem._lighthouseArtifactsForTesting;
      return artifacts;
    });
  });
}

// Can't reference ToolbarSettingCheckbox inside e2e
type CheckboxLabel = Element&{checkboxElement: HTMLInputElement};

/**
 * Set the category checkboxes
 * @param selectedCategoryIds One of 'performance'|'accessibility'|'best-practices'|'seo'|'pwa'|'lighthouse-plugin-publisher-ads'
 */
export async function selectCategories(selectedCategoryIds: string[]) {
  const panel = await waitFor('.lighthouse-start-view-fr');
  const checkboxHandles = await panel.$$('[is=dt-checkbox]');
  for (const checkboxHandle of checkboxHandles) {
    await checkboxHandle.evaluate((dtCheckboxElem, selectedCategoryIds: string[]) => {
      const elem = dtCheckboxElem as CheckboxLabel;
      const categoryId = elem.getAttribute('data-lh-category') || '';
      elem.checkboxElement.checked = selectedCategoryIds.includes(categoryId);
      elem.checkboxElement.dispatchEvent(new Event('change'));  // Need change event to update the backing setting.
    }, selectedCategoryIds);
  }
}

export async function setLegacyNavigation(enabled: boolean) {
  const toolbarHandle = await waitFor('.lighthouse-settings-pane .toolbar');
  await toolbarHandle.evaluate((toolbar, enabled: boolean) => {
    const navCheckboxElem = toolbar.shadowRoot?.querySelector('[is=dt-checkbox]') as CheckboxLabel;
    navCheckboxElem.checkboxElement.checked = enabled;
    navCheckboxElem.checkboxElement.dispatchEvent(
        new Event('change'));  // Need change event to update the backing setting.
  }, enabled);
}

export async function setThrottlingMethod(throttlingMethod: 'simulate'|'devtools') {
  const toolbarHandle = await waitFor('.lighthouse-settings-pane .toolbar');
  await toolbarHandle.evaluate((toolbar, throttlingMethod) => {
    const selectElem = toolbar.shadowRoot?.querySelector('select') as HTMLSelectElement;
    const optionElem = selectElem.querySelector(`option[value="${throttlingMethod}"]`) as HTMLOptionElement;
    optionElem.selected = true;
    selectElem.dispatchEvent(new Event('change'));  // Need change event to update the backing setting.
  }, throttlingMethod);
}

export async function clickStartButton() {
  const panel = await waitFor('.lighthouse-start-view-fr');
  const button = await waitFor('button', panel);
  await button.click();
}

export async function isGenerateReportButtonDisabled() {
  const button = await waitFor('.lighthouse-start-view-fr .primary-button');
  return button.evaluate(element => (element as HTMLButtonElement).disabled);
}

export async function openStorageView() {
  await click('#tab-resources');
  const STORAGE_SELECTOR = '[aria-label="Storage"]';
  await waitFor('.storage-group-list-item');
  await waitFor(STORAGE_SELECTOR);
  await click(STORAGE_SELECTOR);
}

export async function clearSiteData() {
  await goToResource('empty.html');
  await openStorageView();
  await click('#storage-view-clear-button');
  await waitForQuotaUsage(quota => quota === 0);
}

export async function waitForStorageUsage(p: (quota: number) => boolean) {
  await openStorageView();
  await waitForQuotaUsage(p);
  await click('#tab-lighthouse');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuditsBreakdown(lhr: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditResults = Object.values(lhr.audits) as any[];
  const irrelevantDisplayModes = new Set(['notApplicable', 'manual']);
  const applicableAudits = auditResults.filter(
      audit => !irrelevantDisplayModes.has(audit.scoreDisplayMode),
  );

  const informativeAudits = applicableAudits.filter(
      audit => audit.scoreDisplayMode === 'informative',
  );

  const erroredAudits = applicableAudits.filter(
      audit => audit.score === null && audit && !informativeAudits.includes(audit),
  );

  const failedAudits = applicableAudits.filter(audit => audit.score !== null && audit.score < 1);

  return {auditResults, erroredAudits, failedAudits};
}
