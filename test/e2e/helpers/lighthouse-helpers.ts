// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, goToResource, waitFor, waitForFunction} from '../../shared/helper.js';

import {waitForQuotaUsage} from './application-helpers.js';

import type {ElementHandle} from 'puppeteer';
// import type {ReportJSON} from '../../../front_end/panels/lighthouse/LighthouseReporterTypes.js';

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

export async function waitForLHR() {
  return await waitForFunction(async () => {
    const reportEl = await waitFor('.lh-root');
    const lhr = await reportEl.evaluate(elem => {
      // @ts-ignore we installed this obj on a DOM element
      return elem.lighthouseResult;
    });
    return lhr;
  });
}

type LhCategoryId = 'performance'|'accessibility'|'best-practices'|'seo'|'pwa'|'lighthouse-plugin-publisher-ads';
export async function selectCategories(selectedCategoryIds: Array<LhCategoryId>) {
  const panel = await waitFor('.lighthouse-start-view-fr');
  // @ts-ignore Resolving this categoryId enum is hard…
  await panel.$$eval('[is=dt-checkbox]', (dtCheckboxes, selectedCategoryIds: Array<string>) => {
    dtCheckboxes.forEach(dtCheckboxElem => {
      const categoryId = dtCheckboxElem.getAttribute('data-lhCategory') || '';
      // @ts-ignore Can't reference ToolbarSettingCheckbox inside e2e :/
      dtCheckboxElem.checkboxElement.checked = selectedCategoryIds.includes(categoryId);
    });
  }, selectedCategoryIds);
}

export async function clickButton() {
  const panel = await waitFor('.lighthouse-start-view-fr');
  const button = await panel.$('button');
  if (!button) {
    assert.fail('no button');
  }
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
