// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';

import {Issue, IssueCategory, MarkdownIssueDescription} from './Issue.js';
import type {IssuesModel} from './IssuesModel.js';

export const UIStrings = {
  /**
  *@description Label for the link for Mixed Content Issues
  */
  preventingMixedContent: 'Preventing mixed content',
};
const str_ = i18n.i18n.registerUIStrings('sdk/MixedContentIssue.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class MixedContentIssue extends Issue {
  private issueDetails: Protocol.Audits.MixedContentIssueDetails;

  constructor(issueDetails: Protocol.Audits.MixedContentIssueDetails, issuesModel: IssuesModel) {
    super(Protocol.Audits.InspectorIssueCode.MixedContentIssue, issuesModel);
    this.issueDetails = issueDetails;
  }

  requests(): Iterable<Protocol.Audits.AffectedRequest> {
    if (this.issueDetails.request) {
      return [this.issueDetails.request];
    }
    return [];
  }

  getDetails(): Protocol.Audits.MixedContentIssueDetails {
    return this.issueDetails;
  }

  getCategory(): IssueCategory {
    return IssueCategory.MixedContent;
  }

  getDescription(): MarkdownIssueDescription {
    return {
      file: 'issues/descriptions/mixedContent.md',
      substitutions: undefined,
      links:
          [{link: 'https://web.dev/what-is-mixed-content/', linkTitle: i18nString(UIStrings.preventingMixedContent)}],
    };
  }

  primaryKey(): string {
    return JSON.stringify(this.issueDetails);
  }
}
