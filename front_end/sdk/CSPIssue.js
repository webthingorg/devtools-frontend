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
   * @returns {!Iterable<string>}
   */
  directives() {
    if (this._issueDetails.violatedDirective) {
      return [this._issueDetails.violatedDirective];
    }
    return [];
  }

  /**
   * @returns {!string}
   */
  blockedURL() {
    if (this._issueDetails.blockedURL) {
      return this._issueDetails.blockedURL;
    }
    return "";
  }
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
    link: ls`https://developers.google.com/web/fundamentals/security/csp`,
    linkTitle: ls`Content Security Policy | Web Fundamentals`
  }],
};

const cspInlineViolation = {
  title:
      ls`Content Security Policy: use 'unsafe-inline' keyword, a hash, or a nonce in content security policy header to
     enable inline execution and improve the functioning of your site (comes at the risk of inline script injection)`,
  message: () => paragraphedMessage([
    ls`Even though some sources are included in the content security policy header, some resources accessed by your site
         like stylesheets or scripts have inline location with no respective directive allowing it.`,
    ls`Usage of content placed inline, without directives enabling such,  is restricted to strengthen the security of your
         entire site.`
  ]),
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: ls`https://developers.google.com/web/fundamentals/security/csp`,
    linkTitle: ls`Content Security Policy | Web Fundamentals`
  }],
};

const cspEvalViolation = {
  title:
      ls`Content Security Policy: use 'unsafe-eval' source in content security policy header to improve the functioning
     of your site (comes at the risk of evaluating malicious text)`,
  message: () => paragraphedMessage([
    ls`Even though some script sources are included in the content security policy header, script accessed by your site
         has string evaluation code with no respective directive allowing it.`,
    ls`Execution of string evaluation code, without directives enabling such, is restricted to strengthen the security of
         your entire site.`
  ]),
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: ls`https://developers.google.com/web/fundamentals/security/csp`,
    linkTitle: ls`Content Security Policy | Web Fundamentals`
  }],
};

/** @type {!Map<!Protocol.Audits.ViolationType, !IssueDescription>} */
const issueDescriptions = new Map([
  [Protocol.Audits.ViolationType.KURLViolation, cspURLViolation],
  [Protocol.Audits.ViolationType.KInlineViolation, cspInlineViolation],
  [Protocol.Audits.ViolationType.KEvalViolation, cspEvalViolation],
]);
