// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Issue, IssueCategory, IssueDescription, IssueKind} from './Issue.js';  // eslint-disable-line no-unused-vars

export class MixedContentIssue extends Issue {
  /**
   * @param {string} code
   * @param {!Protocol.Audits.MixedContentIssueDetails} issueDetails
   */
  constructor(code, issueDetails) {
    super(code);
    this._issueDetails = JSON.parse(JSON.stringify(issueDetails));
    this._issueDetails.resolutionStatusText =
        mixedContentStatus.get(this._issueDetails.resolutionStatus) || this._issueDetails.resolutionStatus;
  }

  /**
   * @override
   * @returns {!Iterable<Protocol.Audits.AffectedRequest>}
   */
  requests() {
    if (this._issueDetails.request) {
      return [this._issueDetails.request];
    }
    return [];
  }

  /**
   * @override
   * @returns {!Iterable<!Protocol.Audits.MixedContentIssueDetails>}
   */
  mixedContents() {
    return [this._issueDetails];
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.MixedContent;
  }


  /**
   * @override
   * @returns {!IssueDescription}
   */
  getDescription() {
    return {
      title: ls`Mixed content: Not all of the page's resources are being loaded over HTTPS.`,
      message: () => textOnlyMessage(ls
      `The initial HTML is loaded over a secure HTTPS connection, but some other resources are loaded over an insecure HTTP connection.`),
      issueKind: IssueKind.BreakingChange,
      link: ls`https://developers.google.com/web/fundamentals/security/prevent-mixed-content/fixing-mixed-content`,
      linkTitle: ls`Preventing mixed content`,
    };
  }

  /**
  * @override
  */
  primaryKey() {
    return JSON.stringify(this._issueDetails);
  }
}

/**
  * @param {string} text
  * @return {!Element}
  */
function textOnlyMessage(text) {
  const message = document.createElement('div');
  message.classList.add('message');
  message.textContent = text;
  return message;
}

/** @type {!Map<string, string>} */
const mixedContentStatus = new Map([
  ['MixedContentBlocked', 'blocked'],
  ['MixedContentAutomaticallyUpgraded', 'automatically upgraded'],
  ['MixedContentWarning', 'warned'],
]);

export const mixedContentIssueCode = 'MixedContentIssue';
