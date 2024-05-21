// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../core/i18n/i18n.js';
import type * as Platform from '../../core/platform/platform.js';

import {AffectedResourcesView} from './AffectedResourcesView.js';

const UIStrings = {
  /**
   *@description Label for the the number of affected `Allowed Sites` associated with a
   *DevTools issue. In this context, `Allowed` refers to permission to access cookies
   *via the third-party cookie deprecation global metadata, and `Site` is equivalent
   *to eTLD+1.
   *See https://developer.mozilla.org/en-US/docs/Glossary/eTLD.
   */
  nAllowedSites: '{n, plural, =1 {1 website allowed to access cookies} other {# websites allowed to access cookies}}',
};
const str_ = i18n.i18n.registerUIStrings('panels/issues/AffectedMetadataAllowedSitesView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class AffectedMetadataAllowedSitesView extends AffectedResourcesView {
  protected override getResourceNameWithCount(count: number): Platform.UIString.LocalizedString {
    return i18nString(UIStrings.nAllowedSites, {n: count});
  }

  override update(): void {
    this.clear();
    const issues = this.issue.getCookieDeprecationMetadataIssues();
    let count = 0;

    for (const issueData of issues) {
      const row = document.createElement('tr');
      row.classList.add('affected-resource-directive');

      let text: string;
      text = issueData.details().allowedSites.join(', ');
      if (!issueData.details().isOptOutTopLevel && issueData.details().optOutPercentage > 0) {
        text += ' (opt-out: ' + issueData.details().optOutPercentage +
            '%  - <a href="https://github.com/amaliev/3pcd-exemption-heuristics/blob/main/explainer.md">learn more</a>)';
      }

      // appendIssueDetailCell sets the text as a Node.textContent, which doesn't parse the HTML link.
      // Adding the text in the innerHTML field instead.
      const cell = this.appendIssueDetailCell(row, '');
      cell.innerHTML = text;
      this.affectedResources.appendChild(row);
      count++;
    }
    this.updateAffectedResourceCount(count);
  }
}
