// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, closePanelTab, getBrowserAndPages, goToResource, typeText, waitFor, waitForNone} from '../../shared/helper.js';
import {openCommandMenu} from './quick_open-helpers.js';
import {openPanelViaMoreTools} from './settings-helpers.js';

export const LIGHTHOUSE_TAB_SELECTOR = '#tab-lighthouse';
const LIGHTHOUSE_PANEL_TITLE = 'Lighthouse';
const LIGHTHOUSE_PANEL_CONTENT = 'div[aria-label="Lighthouse panel"]';

export async function navigateToLighthouseTab(testName: string) {
  await goToResource(`lighthouse/${testName}.html`);
  await click('#tab-lighthouse');
  // Make sure the lighthouse start view is shown
  await waitFor('.lighthouse-start-view');
}

export async function isGenerateReportButtonDisabled() {
  const button = await waitFor('.lighthouse-start-view .primary-button');
  return button.evaluate(element => (element as HTMLButtonElement).disabled);
}

export async function lighthouseTabExists() {
  await waitFor(LIGHTHOUSE_TAB_SELECTOR);
}

export async function lighthouseTabDoesNotExist() {
  await waitForNone(LIGHTHOUSE_TAB_SELECTOR);
}

export async function lighthousePanelContentIsLoaded() {
  await waitFor(LIGHTHOUSE_PANEL_CONTENT);
}

export async function closeLighthouseTab() {
  await closePanelTab(LIGHTHOUSE_TAB_SELECTOR);
  await lighthouseTabDoesNotExist();
}

export async function openLighthousePanelFromMoreTools() {
  await openPanelViaMoreTools(LIGHTHOUSE_PANEL_TITLE);
  await lighthouseTabExists();
  await lighthousePanelContentIsLoaded();
}

export async function openLighthousePanelFromCommandMenu() {
  const {frontend} = getBrowserAndPages();
  await openCommandMenu();
  await typeText('Show Lighthouse');
  await frontend.keyboard.press('Enter');
  await lighthouseTabExists();
  await lighthousePanelContentIsLoaded();
}
