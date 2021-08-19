// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as Issues from '../../../../../front_end/panels/issues/issues.js';
import * as IssuesManager from '../../../../../front_end/models/issues_manager/issues_manager.js';
import {StubIssue} from '../../models/issues_manager/StubIssue.js';

describe('IssueView', () => {
  it('reset issues correctly', async () => {
    let issue = new StubIssue('LowTextContrastStubIssue', [], [], IssuesManager.Issue.IssueKind.Improvement);
    let aggregatedIssue = new Issues.IssueAggregator.AggregatedIssue('LowTextContrastStubIssue');
    aggregatedIssue.addInstance(issue);
    let description = {
      file: 'LowTextContrast.md',
      links: [
        {
          link: 'https://web.dev/color-and-contrast-accessibility/',
          linkTitle: 'Color and contrast accessibility',
        },
      ],
    };
    const markdownDescription =
        await IssuesManager.MarkdownIssueDescription.createIssueDescriptionFromMarkdown(description);
    const issueView = new Issues.IssueView.IssueView(aggregatedIssue, markdownDescription);
    assert.strictEqual(
        issueView.getIssueTitle(),
        'Users may have difficulties reading text content due to insufficient color contrast');
    issue = new StubIssue('CrossOriginEmbedderPolicyIssueStubIssue', [], [], IssuesManager.Issue.IssueKind.Improvement);
    description = {
      file: 'CoepCorpNotSameOriginAfterDefaultedToSameOriginByCoep.md',
      links: [
        {link: 'https://web.dev/coop-coep/', linkTitle: 'COOP and COEP'},
        {link: 'https://web.dev/same-site-same-origin/', linkTitle: 'Same-Site and Same-Origin'},
      ],
    };
    issue.setDescription(description);
    aggregatedIssue = new Issues.IssueAggregator.AggregatedIssue('CrossOriginEmbedderPolicyIssueStubIssue');
    aggregatedIssue.addInstance(issue);
    issueView.setIssue(aggregatedIssue);
    assert.strictEqual(
        issueView.getIssueTitle(), 'Specify a Cross-Origin Resource Policy to prevent a resource from being blocked');
  });
});
