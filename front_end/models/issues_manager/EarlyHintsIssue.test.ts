// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import {describeWithLocale} from '../../testing/EnvironmentHelpers.js';
import {MockIssuesModel} from '../../testing/MockIssuesModel.js';
import * as IssuesManager from '../issues_manager/issues_manager.js';

function createProtocolIssue(earlyHintsIssueDetails: Protocol.Audits.EarlyHintsIssueDetails):
    Protocol.Audits.InspectorIssue {
  return {
    code: Protocol.Audits.InspectorIssueCode.EarlyHintsIssue,
    details: {earlyHintsIssueDetails},
  };
}

describeWithLocale('SharedDictionaryIssue', () => {
  const mockModel = new MockIssuesModel([]) as unknown as SDK.IssuesModel.IssuesModel;
  const issueDetails = {
    earlyHintsError: Protocol.Audits.EarlyHintsError.EarlyHintsHeadersInSubResources,
    request: {
      requestId: 'test-request-id' as Protocol.Network.RequestId,
      url: 'https://example.com/',
    },
  };
  const issue = createProtocolIssue(issueDetails);
  const earlyHintsIssues =
      IssuesManager.EarlyHintsIssue.EarlyHintsIssue.fromInspectorIssue(mockModel, issue);
  assert.lengthOf(earlyHintsIssues, 1);
  const earlyHintsIssue = earlyHintsIssues[0];
  assert.strictEqual(earlyHintsIssue.getCategory(), IssuesManager.Issue.IssueCategory.Other);
  assert.deepStrictEqual(earlyHintsIssue.details(), issueDetails);
  assert.strictEqual(earlyHintsIssue.getKind(), IssuesManager.Issue.IssueKind.PageError);
  assert.isNotNull(earlyHintsIssue.getDescription());
});
