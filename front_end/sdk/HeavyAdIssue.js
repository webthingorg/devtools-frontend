// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import


import {Issue, IssueCategory, IssueDescription, IssueKind} from './Issue.js';  // eslint-disable-line no-unused-vars

export class HeavyAdIssue extends Issue {
  /**
   * @param {!Protocol.Audits.HeavyAdIssueDetails} issueDetails
   */
  constructor(issueDetails) {
    super(Protocol.Audits.InspectorIssueCode.HeavyAdIssue);
    this._issueDetails = issueDetails;
  }

  /**
   * @param {string} resolutionStatus
   * @returns {!string}
   */
  static translateStatus(resolution) {
    return heavyAdStatus.get(resolution) || resolution;
  }

  /**
   * @override
   * @returns {!Iterable<!Protocol.Audits.HeavyAdIssueDetails>}
   */
  heavyAd() {
    return [this._issueDetails];
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.HeavyAd;
  }
}
