// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../host/host.js';
import * as i18n from '../i18n/i18n.js';
import * as Network from '../network/network.js';
import * as UI from '../ui/ui.js';

import {AffectedItem, AffectedResourcesView} from './AffectedResourcesView.js';
import {AggregatedIssue} from './IssueAggregator.js';  // eslint-disable-line no-unused-vars
import {IssueView} from './IssueView.js';

export const UIStrings = {
  /**
  *@description Label for number of affected resources indication in issue view
  */
  cookie: 'cookie',
  /**
  *@description Label for number of affected resources indication in issue view
  */
  cookies: 'cookies',
  /**
  *@description Text for the name of something
  */
  name: 'Name',
  /**
  *@description Text for the domain of a website
  */
  domain: 'Domain',
  /**
  *@description Text that refers to a file path
  */
  path: 'Path',
};
const str_ = i18n.i18n.registerUIStrings('issues/AffectedCookiesView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class AffectedCookiesView extends AffectedResourcesView {
  private issue: AggregatedIssue;
  constructor(parent: IssueView, issue: AggregatedIssue) {
    super(parent, {singular: i18nString(UIStrings.cookie), plural: i18nString(UIStrings.cookies)});
    this.issue = issue;
  }

  private appendAffectedCookies(cookies: Iterable<{cookie: Protocol.Audits.AffectedCookie, hasRequest: boolean}>):
      void {
    const header = document.createElement('tr');
    this.appendColumnTitle(header, i18nString(UIStrings.name));
    this.appendColumnTitle(
        header, i18nString(UIStrings.domain) + ' & ' + i18nString(UIStrings.path),
        'affected-resource-cookie-info-header');

    this.affectedResources.appendChild(header);

    let count = 0;
    for (const cookie of cookies) {
      count++;
      this.appendAffectedCookie(cookie.cookie, cookie.hasRequest);
    }
    this.updateAffectedResourceCount(count);
  }

  private appendAffectedCookie(cookie: Protocol.Audits.AffectedCookie, hasAssociatedRequest: boolean): void {
    const element = document.createElement('tr');
    element.classList.add('affected-resource-cookie');
    const name = document.createElement('td');
    if (hasAssociatedRequest) {
      name.appendChild(UI.UIUtils.createTextButton(cookie.name, () => {
        Host.userMetrics.issuesPanelResourceOpened(this.issue.getCategory(), AffectedItem.Cookie);
        Network.NetworkPanel.NetworkPanel.revealAndFilter([
          {
            filterType: 'cookie-domain',
            filterValue: cookie.domain,
          },
          {
            filterType: 'cookie-name',
            filterValue: cookie.name,
          },
          {
            filterType: 'cookie-path',
            filterValue: cookie.path,
          },
        ]);
      }, 'link-style devtools-link'));
    } else {
      name.textContent = cookie.name;
    }
    element.appendChild(name);
    this.appendIssueDetailCell(element, `${cookie.domain}${cookie.path}`, 'affected-resource-cookie-info');

    this.affectedResources.appendChild(element);
  }

  update(): void {
    this.clear();
    this.appendAffectedCookies(this.issue.cookiesWithRequestIndicator());
  }
}
