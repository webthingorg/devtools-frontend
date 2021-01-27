// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {Issue, IssueCategory, IssueKind, MarkdownIssueDescription} from './Issue.js';  // eslint-disable-line no-unused-vars

export class TrustedWebActivityIssue extends Issue {
  /**
   * @param {!Protocol.Audits.TrustedWebActivityIssueDetails} issueDetails
   */
  constructor(issueDetails) {
    const issue_code =
        [Protocol.Audits.InspectorIssueCode.TrustedWebActivityIssue, issueDetails.violationType].join('::');
    super(issue_code);
    this._issueDetails = issueDetails;
  }

  /**
   * @override
   * @returns {!Iterable<!Protocol.Audits.TrustedWebActivityIssueDetails>}
   */
  trustedWebActivityIssues() {
    return [this._issueDetails];
  }

  /**
   * @override
   * @returns {string}
   */
  primaryKey() {
    return `${Protocol.Audits.InspectorIssueCode.TrustedWebActivityIssue}-${JSON.stringify(this._issueDetails)}`;
  }

  /**
   * @override
   * @return {?MarkdownIssueDescription}
   */
  getDescription() {
    const description = issueDescriptions.get(this._issueDetails.violationType);
    if (description) {
      return description;
    }
    return null;
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.TrustedWebActivity;
  }
}

const twaDigitalAssetLinksFailed = {
  file: 'issues/descriptions/TwaDigitalAssetLinksFailed.md',
  substitutions: undefined,
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: 'https://blog.chromium.org/2020/06/changes-to-quality-criteria-for-pwas.html',
    linkTitle: ls`Changes to quality criteria for PWAs using Trusted Web Activity`
  }],
};

const twaHttpError = {
  file: 'issues/descriptions/TwaHttpError.md',
  substitutions: undefined,
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: 'https://blog.chromium.org/2020/06/changes-to-quality-criteria-for-pwas.html',
    linkTitle: ls`Changes to quality criteria for PWAs using Trusted Web Activity`
  }],
};

const twaPageUnavailableOffline = {
  file: 'issues/descriptions/TwaPageUnavailableOffline.md',
  substitutions: undefined,
  issueKind: IssueKind.BreakingChange,
  links: [{
    link: 'https://blog.chromium.org/2020/06/changes-to-quality-criteria-for-pwas.html',
    linkTitle: ls`Changes to quality criteria for PWAs using Trusted Web Activity`
  }],
};

/** @type {string} */
export const httpViolationCode = [
  Protocol.Audits.InspectorIssueCode.TrustedWebActivityIssue,
  Protocol.Audits.TwaQualityEnforcementViolationType.KHttpError
].join('::');

/** @type {string} */
export const offlineViolationCode = [
  Protocol.Audits.InspectorIssueCode.TrustedWebActivityIssue,
  Protocol.Audits.TwaQualityEnforcementViolationType.KUnavailableOffline
].join('::');

/** @type {string} */
export const assetlinkViolationCode = [
  Protocol.Audits.InspectorIssueCode.TrustedWebActivityIssue,
  Protocol.Audits.TwaQualityEnforcementViolationType.KDigitalAssetLinks
].join('::');


/** @type {!Map<!Protocol.Audits.TwaQualityEnforcementViolationType,
 * !MarkdownIssueDescription>} */
const issueDescriptions = new Map([
  [Protocol.Audits.TwaQualityEnforcementViolationType.KHttpError, twaHttpError],
  [Protocol.Audits.TwaQualityEnforcementViolationType.KUnavailableOffline, twaPageUnavailableOffline],
  [Protocol.Audits.TwaQualityEnforcementViolationType.KDigitalAssetLinks, twaDigitalAssetLinksFailed],
]);
