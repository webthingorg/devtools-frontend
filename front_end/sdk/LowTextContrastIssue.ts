// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {Issue, IssueCategory, IssueKind, MarkdownIssueDescription} from './Issue.js';  // eslint-disable-line no-unused-vars

export class LowTextContrastIssue extends Issue {
  private _details: Protocol.Audits.LowTextContrastIssueDetails;

  constructor(issueDetails: Protocol.Audits.LowTextContrastIssueDetails) {
    super('LowTextContrastIssue');
    this._details = issueDetails;
  }

  primaryKey(): string {
    return `${this.code()}-(${this._details.violatingNodeId})`;
  }

  getCategory(): IssueCategory {
    return IssueCategory.LowTextContrast;
  }

  details(): Protocol.Audits.LowTextContrastIssueDetails {
    return this._details;
  }

  getDescription(): MarkdownIssueDescription {
    return {
      file: 'issues/descriptions/LowTextContrast.md',
      substitutions: undefined,
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: 'https://web.dev/color-and-contrast-accessibility/', linkTitle: ls`Color and contrast accessibility`},
      ],
    };
  }
}
