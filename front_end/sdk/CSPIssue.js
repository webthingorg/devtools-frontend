// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../platform/platform.js';

import {Issue, IssueCategory, IssueDescription, IssueKind} from './Issue.js';  // eslint-disable-line no-unused-vars

export class CSPIssue extends Issue {
  /**
   * @param {!Protocol.Audits.CSPIssueDetails} issueDetails
   */
  constructor(issueDetails) {
    super(Protocol.Audits.InspectorIssueCode.CSPIssue);
    this._issueDetails = issueDetails;
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.ContentSecurityPolicy;
  }

  /**
   * @override
   */
  primaryKey() {
    return JSON.stringify(this._issueDetails);
  }

  /**
   * @override
   * @return {string}
   */
  code() {
    return this._issueDetails.violationType;
  }

  /**
   * @override
   * @returns {?IssueDescription}
   */
  getDescription() {
    const details = this._issueDetails;
    if (details) {
      const description = issueDescriptions.get(details.violationType);
      if (description) {
        return description;
      }
    }
    return null;
  }

  /**
   * @override
   * @returns {!Iterable<!Protocol.Audits.CSPIssueDetails>}
   */
  CSPviolations() {
    return [this._issueDetails];
  }
  // /**
  //  * @returns {!Iterable<string>}
  //  */
  // directives() {
  //   if (this._issueDetails.violatedDirective) {
  //     return [this._issueDetails.violatedDirective];
  //   }
  //   return [];
  // }

  // /**
  //  * @returns {!string}
  //  */
  // blockedURL() {
  //   if (this._issueDetails.blockedURL) {
  //     return this._issueDetails.blockedURL;
  //   }
  //   return '';
  // }

  // /**
  //  * @returns {!string}
  //  */
  // violationType() {
  //   if (this._issueDetails.violationType) {
  //     return this._issueDetails.violationType;
  //   }
  //   return '';
  // }
}

/**
 * @param {!Array<string>} paragraphs
 * @return {!Element}
 */
function paragraphedMessage(paragraphs) {
  const message = document.createElement('div');
  message.classList.add('message');
  for (const paragraph of paragraphs) {
    const paragraphElement = document.createElement('p');
    paragraphElement.textContent = paragraph;
    message.appendChild(paragraphElement);
  }
  return message;
}

const cspURLViolation = {
  title:
      ls`Content Security Policy: include all sources of your resources in content security policy header to improve the
     functioning of your site`,
  message: () => paragraphedMessage([
    ls`Even though some sources are included in the content security policy header, some resources accessed by your site
         like images, stylesheets or scripts originate from sources not included in content security policy directives.`,
    ls`Usage of content from not included sources is restricted to strengthen the security of your entire site.`
  ]),
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: ls`https://developers.google.com/web/fundamentals/security/csp#source_whitelists`,
    linkTitle: ls`Content Security Policy | Source Whitelists`
  }],
};

// TODO bug 1082628: Add handling of other CSP violation types later as they'll need more work.
/** @type {!Map<!Protocol.Audits.ViolationType, !IssueDescription>} */
const issueDescriptions = new Map([
  [Protocol.Audits.ViolationType.KURLViolation, cspURLViolation],
]);
