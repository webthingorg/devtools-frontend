// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {assertNotNull, goToResource, waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToConsoleTab} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('shows the toolbar button for no issue correctly', async () => {
    // Navigate to page which causes no issues.
    await goToResource('console/empty.html');
    await navigateToConsoleTab();

    const infobarButton = await waitFor('#console-issues-counter');
    const titleElement = await waitFor('.icon-button-title', infobarButton);
    assertNotNull(titleElement);
    const infobarButtonText = await titleElement.evaluate(node => (node as HTMLElement).textContent);
    assert.strictEqual(infobarButtonText, 'No Issues');
  });

  it('shows the toolbar button for one issue correctly', async () => {
    // Navigate to page which causes a SameSiteCookieIssue.
    await goToResource('console/cookie-issue.html');
    await navigateToConsoleTab();

    const infobarButton = await waitFor('#console-issues-counter');
    const titleElement = await waitFor('.icon-button-title', infobarButton);
    assertNotNull(titleElement);
    const infobarButtonText = await titleElement.evaluate(node => (node as HTMLElement).textContent);
    assert.strictEqual(infobarButtonText, '1 Issue');
  });

  it('shows the toolbar button for two issues correctly', async () => {
    // Navigate to page which causes two SameSiteCookieIssue.
    await goToResource('console/two-cookie-issues.html');
    await navigateToConsoleTab();

    const infobarButton = await waitFor('#console-issues-counter');
    const titleElement = await waitFor('.icon-button-title', infobarButton);
    assertNotNull(titleElement);
    const infobarButtonText = await titleElement.evaluate(node => (node as HTMLElement).textContent);
    assert.strictEqual(infobarButtonText, '2 Issues');
  });
});
