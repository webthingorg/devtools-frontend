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
   * @override
   * @returns {!Iterable<!Protocol.Audits.HeavyAdIssueDetails>}
   */
  heavyAds() {
    return [this._issueDetails];
  }

  /**
   * @override
   * @returns {string}
   */
  primaryKey() {
    return `${Protocol.Audits.InspectorIssueCode.HeavyAdIssue}-${JSON.stringify(this._issueDetails)}`;
  }

  /**
   * @override
   * @return {?IssueDescription}
   */
  getDescription() {
    return {
      title: ls`An ad on your site is exceeding resource limits`,
      message: mkHeavyAdsDescription,
      issueKind: IssueKind.BreakingChange,
      links: [
        {
          link: 'https://developers.google.com/web/updates/2020/05/heavy-ad-interventions',
          linkTitle: ls`Handling Heavy Ad Interventions`
        },
      ],
    };
  }

  /**
   * @override
   * @return {!IssueCategory}
   */
  getCategory() {
    return IssueCategory.HeavyAds;
  }
}

/**
 * @return {!Element}
 */
function mkHeavyAdsDescription() {
  const message = document.createElement('div');
  message.classList.add('message');
  const contextParagraph = document.createElement('p');
  contextParagraph.textContent = ls`
  Chrome identifies large ads on your site that use too many resources without a user gesture. Large ads have an impact on performance and harm the user’s browsing experience. They increase battery drain, consume mobile data and make your site slow. To improve the user experience, Chrome warns about or blocks large ads.`;

  message.append(contextParagraph);

  const resourceLimitHeader = ls`An ad is considered a large ad if one or more of the following apply`;
  const resourceLimits = [
    ls`it uses more than 4 MB of network bandwidth without a user gesture`,
    ls`it uses more than a 60 seconds of total CPU time without a user gesture`,
    ls`it uses more than a peak limit of 50% of CPU time across 30 seconds without a user gesture`
  ];

  const resourceLimitsParagraph = document.createElement('p');
  resourceLimitsParagraph.appendChild(document.createTextNode(resourceLimitHeader));
  const resourceLimitsList = document.createElement('ul');
  for (const resourceLimit of resourceLimits) {
    const listItem = document.createElement('li');
    listItem.classList.add('plain-enum');
    listItem.textContent = resourceLimit;
    resourceLimitsList.append(listItem);
  }
  resourceLimitsParagraph.appendChild(resourceLimitsList);
  message.append(resourceLimitsParagraph);

  const resolutionParagraph = document.createElement('p');
  resolutionParagraph.textContent = ls`Stop this from happening by only showing ads that stay within resource limits.`;
  message.append(resolutionParagraph);

  return message;
}
