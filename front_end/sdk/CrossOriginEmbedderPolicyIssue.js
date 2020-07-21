// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {Issue, IssueCategory, IssueKind, MarkdownIssueDescription} from './Issue.js';  // eslint-disable-line no-unused-vars

/**
 * @param {string} string
 * @return {string}
 */
function toCamelCase(string) {
  const result = string.replace(/-\p{ASCII}/gu, match => match.substr(1).toUpperCase());
  return result.replace(/^./, match => match.toUpperCase());
}

export class CrossOriginEmbedderPolicyIssue extends Issue {
  /**
   * @param {string} blockedReason
   * @param {string} requestId
   */
  constructor(blockedReason, requestId) {
    super(`CrossOriginEmbedderPolicy::${toCamelCase(blockedReason)}`);
    /** @type {!Protocol.Audits.AffectedRequest} */
    this._affectedRequest = {requestId};
  }

  /**
   * @override
   */
  primaryKey() {
    return `${this.code()}-(${this._affectedRequest.requestId})`;
  }

  /**
   * @override
   * @returns {!Iterable<Protocol.Audits.AffectedRequest>}
   */
  requests() {
    return [this._affectedRequest];
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.CrossOriginEmbedderPolicy;
  }

  /**
   * @override
   * @returns {?MarkdownIssueDescription}
   */
  getDescription() {
    const description = issueDescriptions.get(this.code());
    if (!description) {
      return null;
    }
    return description;
  }
}

/** @type {!Map<string, !MarkdownIssueDescription>} */
const issueDescriptions = new Map([
  [
    'CrossOriginEmbedderPolicy::CorpNotSameOriginAfterDefaultedToSameOriginByCoep', {
      file: 'issues/descriptions/CoepCorpNotSameOriginAfterDefaultedToSameOriginByCoep.md',
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: ls`https://web.dev/coop-coep/`, linkTitle: ls`COOP and COEP`},
        {link: ls`https://web.dev/same-site-same-origin/`, linkTitle: ls`Same-Site and Same-Origin`},
      ],
    }
  ],
  [
    'CrossOriginEmbedderPolicy::CoepFrameResourceNeedsCoepHeader', {
      file: 'issues/descriptions/CoepFrameResourceNeedsCoepHeader.md',
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: ls`https://web.dev/coop-coep/`, linkTitle: ls`COOP and COEP`},
      ],
    }
  ],
  [
    'CrossOriginEmbedderPolicy::CoopSandboxedIframeCannotNavigateToCoopPage', {
      file: 'issues/descriptions/CoepCoopSandboxedIframeCannotNavigateToCoopPage.md',
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: ls`https://web.dev/coop-coep/`, linkTitle: ls`COOP and COEP`},
      ],
    }
  ],
  [
    'CrossOriginEmbedderPolicy::CorpNotSameSite', {
      file: 'issues/descriptions/CoepCorpNotSameSite.md',
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: ls`https://web.dev/coop-coep/`, linkTitle: ls`COOP and COEP`},
        {link: ls`https://web.dev/same-site-same-origin/`, linkTitle: ls`Same-Site and Same-Origin`},
      ],
    }
  ],
  [
    'CrossOriginEmbedderPolicy::CorpNotSameOrigin', {
      file: 'issues/descriptions/CoepCorpNotSameOrigin.md',
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: ls`https://web.dev/coop-coep/`, linkTitle: ls`COOP and COEP`},
        {link: ls`https://web.dev/same-site-same-origin/`, linkTitle: ls`Same-Site and Same-Origin`},
      ],
    }
  ],
]);
