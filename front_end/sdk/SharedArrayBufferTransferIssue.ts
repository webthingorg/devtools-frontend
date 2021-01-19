// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {Issue, IssueCategory, IssueKind, MarkdownIssueDescription} from './Issue.js';  // eslint-disable-line no-unused-vars
import {IssuesModel} from './IssuesModel.js';  // eslint-disable-line no-unused-vars

export class SharedArrayBufferTransferIssue extends Issue {
  private issueDetails: Protocol.Audits.SharedArrayBufferTransferIssueDetails;

  constructor(issueDetails: Protocol.Audits.SharedArrayBufferTransferIssueDetails, issuesModel: IssuesModel) {
    super(Protocol.Audits.InspectorIssueCode.SharedArrayBufferTransferIssue, issuesModel);
    this.issueDetails = issueDetails;
  }

  getCategory(): IssueCategory {
    return IssueCategory.Other;
  }

  sharedArrayBufferTransfers(): Protocol.Audits.SharedArrayBufferTransferIssueDetails[] {
    return [this.issueDetails];
  }

  details(): Protocol.Audits.SharedArrayBufferTransferIssueDetails {
    return this.issueDetails;
  }

  getDescription(): MarkdownIssueDescription {
    return {
      file: 'issues/descriptions/sharedArrayBufferTransfer.md',
      substitutions: undefined,
      issueKind: IssueKind.BreakingChange,
      links: [{
        link: 'https://developer.chrome.com/blog/enabling-shared-array-buffer/',
        linkTitle: ls`Enabling Shared Array Buffer`,
      }],
    };
  }

  primaryKey(): string {
    return JSON.stringify(this.issueDetails);
  }
}
