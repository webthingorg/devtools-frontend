// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, waitFor} from '../../shared/helper.js';

export const ISSUES_TAB_SELECTOR = '#tab-issues-pane';
export const ISSUES_PANE_SELECTOR = '.issues-pane';
export const ISSUE = '.issue';
export const AFFECTED_ELEMENT_ICON = '.affected-resource-csp-info-node';
export const ELEMENT_REVEAL_ICON = '.element-reveal-icon';
export const ELEMENTS_PANEL_SELECTOR = '.panel[aria-label="elements"]';

export async function navigateToIssuesTab() {
  await click(ISSUES_TAB_SELECTOR);
  await waitFor(ISSUES_PANE_SELECTOR);
}

export async function expandIssue() {
  await waitFor(ISSUE);
  await click(ISSUE);
  await waitFor('.message');
}

export async function revealNodeInElementsPanel() {
  await waitFor(AFFECTED_ELEMENT_ICON);
  await click(ELEMENT_REVEAL_ICON);
  await waitFor(ELEMENTS_PANEL_SELECTOR);
}
