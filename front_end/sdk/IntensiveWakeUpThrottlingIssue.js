// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ls} from '../common/common.js';  // eslint-disable-line rulesdir/es_modules_import

import {Issue, IssueCategory, IssueDescription, IssueKind} from './Issue.js';  // eslint-disable-line no-unused-vars

export class IntensiveWakeUpThrottlingIssue extends Issue {
  /**
   * @param {!Protocol.Audits.IntensiveWakeUpThrottlingIssueDetails} issueDetails
   */
  constructor(issueDetails) {
    super(Protocol.Audits.InspectorIssueCode.IntensiveWakeUpThrottlingIssue);
    this._issueDetails = issueDetails;
  }

  /**
   * @override
   * @returns {!Iterable<!Protocol.Audits.IntensiveWakeUpThrottlingIssueDetails>}
   */
  intensiveWakeUpThrottlings() {
    return [this._issueDetails];
  }

  /**
   * @override
   * @returns {string}
   */
  primaryKey() {
    return `${Protocol.Audits.InspectorIssueCode.IntensiveWakeUpThrottlingIssue}-${JSON.stringify(this._issueDetails)}`;
  }

  /**
   * @override
   * @return {?IssueDescription}
   */
  getDescription() {
    return {
      title: ls`Your site has excessive wake ups in the background.`,
      message: mkIntesiveWakeUpThrottlingDescription,
      issueKind: IssueKind.BreakingChange,
      links: [
        {link: 'https://todo.thissitedoenstexistyetrightpat.com', linkTitle: ls`Handling Intensive Wake Up Throttling`},
      ],
    };
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.IntensiveWakeUpThrottling;
  }
}

/**
 * @return {!Element}
 */
function mkIntesiveWakeUpThrottlingDescription() {
  const message = document.createElement('div');
  message.classList.add('message');
  const contextParagraph = document.createElement('p');
  contextParagraph.textContent =
      ls`Chrome throttles wake ups due to excessive use of timers when your page hasn't been visible for at least 5 minutes.`;

  message.append(contextParagraph);

  return message;
}
