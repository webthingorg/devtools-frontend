// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';

import {Issue, IssueCategory, IssueKind} from './Issue.js';
import {type MarkdownIssueDescription} from './MarkdownIssueDescription.js';

const earlyHintsDeveloperBlogLinks = [{
  link: 'https://developer.chrome.com/docs/web-platform/early-hints#current-limitations/',
  linkTitle: 'EarlyHints developer blogpost',
}];

export class EarlyHintsIssue extends Issue {
  #issueDetails: Protocol.Audits.EarlyHintsIssueDetails;
  constructor(issueDetails: Protocol.Audits.EarlyHintsIssueDetails, issuesModel: SDK.IssuesModel.IssuesModel) {
    const code = 'EarlyHintsIssue::' + issueDetails.earlyHintsError;
    super(code, issuesModel);
    this.#issueDetails = issueDetails;
  }

  requests(): Array<Protocol.Audits.AffectedRequest> {
    if (!this.#issueDetails.request) {
      return [];
    }
    const {url, requestId} = this.#issueDetails.request;
    if (!requestId) {
      return [];
    }
    return [{url, requestId}];
  }

  details(): Protocol.Audits.EarlyHintsIssueDetails {
    return this.#issueDetails;
  }

  primaryKey(): string {
    return JSON.stringify(this.#issueDetails);
  }

  getDescription(): MarkdownIssueDescription {
    switch (this.#issueDetails.earlyHintsError) {
      case Protocol.Audits.EarlyHintsError.EarlyHintsHeadersInSubResources:
        return {
          file: 'earlyHintsHeadersInSubResources.md',
          links: earlyHintsDeveloperBlogLinks,
        };
    }
  }

  getCategory(): IssueCategory {
    return IssueCategory.Other;
  }

  getKind(): IssueKind {
    return IssueKind.PageError;
  }

  static fromInspectorIssue(issuesModel: SDK.IssuesModel.IssuesModel, inspectorIssue: Protocol.Audits.InspectorIssue):
      EarlyHintsIssue[] {
    const details = inspectorIssue.details.earlyHintsIssueDetails;
    if (!details) {
      console.warn('EarlyHints issue without details received.');
      return [];
    }
    return [new EarlyHintsIssue(details, issuesModel)];
  }
}
