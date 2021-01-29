// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {AffectedElement, Issue, IssueCategory, IssueKind, MarkdownIssueDescription} from './Issue.js';  // eslint-disable-line no-unused-vars

export class LowTextContrastIssue extends Issue {
  /**
   * @param {Protocol.Audits.LowTextContrastIssueDetails} issueDetails
   */
  constructor(issueDetails) {
    super('LowTextContrastIssue');
    /** @type {Protocol.Audits.LowTextContrastIssueDetails} */
    this._details = issueDetails;
  }

  /**
   * @override
   */
  primaryKey() {
    return `${this.code()}-(${this._details.violatingNodeId})`;
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.LowTextContrast;
  }

  /**
   * @override
   * @return {!Iterable<AffectedElement>}
   */
  elements() {
    return [{
      backendNodeId: this._details.violatingNodeId,
      nodeName: this._details.violatingNodeSelector,
    }];
  }

  /**
   * @override
   * @returns {?MarkdownIssueDescription}
   */
  getDescription() {
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
