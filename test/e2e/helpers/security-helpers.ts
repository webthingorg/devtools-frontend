// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, closePanelTab, getBrowserAndPages, typeText, waitFor, waitForNone} from '../../shared/helper.js';

import {openCommandMenu} from './quick_open-helpers.js';
import {openPanelViaMoreTools} from './settings-helpers.js';

const SECURITY_PANEL_CONTENT = '.view-container[aria-label="Security panel"]';
const SECURITY_TAB_ID = '#tab-security';
const SECURITY_PANEL_TITLE = 'Security';

export async function securityTabExists() {
  await waitFor(SECURITY_TAB_ID);
}

export async function securityTabDoesNotExists() {
  await waitForNone(SECURITY_TAB_ID);
}

export async function securityContentPanelIsLoaded() {
  await waitFor(SECURITY_PANEL_CONTENT);
}

export async function navigateToSecurityTab() {
  await click(SECURITY_TAB_ID);
  await securityContentPanelIsLoaded();
}

export async function closeSecurityTab() {
  await closePanelTab(SECURITY_TAB_ID);
  await securityTabDoesNotExists();
}

export async function openSecurityPanelFromMoreTools() {
  await openPanelViaMoreTools(SECURITY_PANEL_TITLE);
  await securityTabExists();
  await securityContentPanelIsLoaded();
}

export async function openSecurityPanelFromCommandMenu() {
  const {frontend} = getBrowserAndPages();
  await openCommandMenu();
  await typeText('Security');
  await frontend.keyboard.press('Enter');
  await securityTabExists();
  await securityContentPanelIsLoaded();
}
