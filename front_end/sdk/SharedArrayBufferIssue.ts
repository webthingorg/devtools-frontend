// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import type {MarkdownIssueDescription} from './Issue.js';
import {Issue, IssueCategory, IssueKind} from './Issue.js';
import type {IssuesModel} from './IssuesModel.js';

export class SharedArrayBufferIssue extends Issue {
  private issueDetails: Protocol.Audits.SharedArrayBufferIssueDetails;

  constructor(issueDetails: Protocol.Audits.SharedArrayBufferIssueDetails, issuesModel: IssuesModel) {
    const umaCode = [Protocol.Audits.InspectorIssueCode.SharedArrayBufferIssue, issueDetails.type].join('::');
    super({code: Protocol.Audits.InspectorIssueCode.SharedArrayBufferIssue, umaCode}, issuesModel);
    this.issueDetails = issueDetails;
  }

  getCategory(): IssueCategory {
    return IssueCategory.Other;
  }

  details(): Protocol.Audits.SharedArrayBufferIssueDetails {
    return this.issueDetails;
  }

  getDescription(): MarkdownIssueDescription {
    return {
      file: 'issues/descriptions/sharedArrayBuffer.md',
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
