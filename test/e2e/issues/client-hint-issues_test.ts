// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {ensureResourceSectionIsExpanded, getAndExpandSpecificIssueByTitle, getResourcesElement, navigateToIssuesTab, waitForTableFromResourceSectionContents} from '../helpers/issues-helpers.js';

describe('Client Hint issues test', async () => {
  it('should display issue when Client Hints are used with invalid origin', async () => {
    await goToResource('issues/client-hint-issue-MetaTagAllowListInvalidOrigin.html');
    await navigateToIssuesTab();
    const issueElement = await getAndExpandSpecificIssueByTitle('Client Hint meta tag contained invalid origin');
    assert.isNotNull(issueElement);
    if (issueElement) {
      const section = await getResourcesElement('violation', issueElement);
      const text = await section.label.evaluate(el => el.textContent);
      assert.strictEqual(text, '1 violation');
      await ensureResourceSectionIsExpanded(section);
      const expectedTableRows = [
        ['client-hint-issue-MetaTagAllowListInvalidOrigin.html:0'],
      ];
      await waitForTableFromResourceSectionContents(section.content, expectedTableRows);
    }
  });

  it('should display issue when Client Hints are modified by javascript', async () => {
    await goToResource('issues/client-hint-issue-MetaTagModifiedHTML.html');
    await navigateToIssuesTab();
    const issueElement = await getAndExpandSpecificIssueByTitle('Client Hint meta tag modified by javascript');
    assert.isNotNull(issueElement);
    if (issueElement) {
      const section = await getResourcesElement('violation', issueElement);
      const text = await section.label.evaluate(el => el.textContent);
      assert.strictEqual(text, '1 violation');
      await ensureResourceSectionIsExpanded(section);
      const expectedTableRows = [
        ['client-hint-issue-MetaTagModifiedHTML.html:6'],
      ];
      await waitForTableFromResourceSectionContents(section.content, expectedTableRows);
    }
  });
});
