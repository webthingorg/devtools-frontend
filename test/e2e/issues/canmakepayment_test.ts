// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  ensureResourceSectionIsExpanded,
  expandIssue,
  getIssueByTitle,
  getResourcesElement,
  navigateToIssuesTab,
  waitForTableFromResourceSectionContents,
} from '../helpers/issues-helpers.js';

describe('"canmakepayment" event identity issues test', async () => {
  it('should display issue when identity fields in "canmakepayment" event are used', async () => {
    await goToResource('issues/canmakepayment.html');
    await navigateToIssuesTab();
    await expandIssue();
    const issueElement = await getIssueByTitle(
        'The merchant origin and arbitrary data from the canmakepayment service worker event are deprecated and will be removed: topOrigin, paymentRequestOrigin, methodData, modifiers.');
    assertNotNullOrUndefined(issueElement);
    const section = await getResourcesElement('4 sources', issueElement, '.affected-resource-label');
    await ensureResourceSectionIsExpanded(section);
    const expectedTableRows = [
      ['issues/canmakepayment.html:9'],
      ['issues/canmakepayment.html:10'],
      ['issues/canmakepayment.html:11'],
      ['issues/canmakepayment.html:12'],
    ];
    await waitForTableFromResourceSectionContents(section.content, expectedTableRows);
  });
});
