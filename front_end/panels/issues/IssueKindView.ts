// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as Adorners from '../../ui/components/adorners/adorners.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as IssueCounter from '../../ui/components/issue_counter/issue_counter.js';
import * as UI from '../../ui/legacy/legacy.js';

const UIStrings = {
  /**
   * @description Kind title for a group of improvements
   */
  improvements: 'Improvements',
  /**
    * @description Kind title for a group of page errors
    */
  pageErrors: 'Page Errors',
  /**
    * @description Kind title for a group of breaking changes
    */
  breakingChanges: 'Breaking Changes',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/IssueKindView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export function getGroupIssuesByKindSetting(): Common.Settings.Setting<boolean> {
  return Common.Settings.Settings.instance().createSetting('groupIssuesByKind', false);
}

export function issueKindViewSortPriority(a: IssueKindView, b: IssueKindView): number {
  if (a.getKind() === IssuesManager.Issue.IssueKind.PageError) {
    return -1;
  }
  if (a.getKind() === IssuesManager.Issue.IssueKind.BreakingChange &&
      b.getKind() === IssuesManager.Issue.IssueKind.Improvement) {
    return -1;
  }
  return 1;
}

export function getClassNameFromKind(kind: IssuesManager.Issue.IssueKind): string {
  switch (kind) {
    case IssuesManager.Issue.IssueKind.BreakingChange:
      return 'breaking-changes';
    case IssuesManager.Issue.IssueKind.Improvement:
      return 'improvements';
    case IssuesManager.Issue.IssueKind.PageError:
      return 'page-errors';
  }
}

export class IssueKindView extends UI.TreeOutline.TreeElement {
  private kind: IssuesManager.Issue.IssueKind;
  private issueCount: HTMLElement;

  constructor(kind: IssuesManager.Issue.IssueKind) {
    super(undefined, true);
    this.kind = kind;
    this.issueCount = document.createElement('span');

    this.toggleOnClick = true;
    this.listItemElement.classList.add('issue-category');
    this.listItemElement.classList.add('issue-kind');
    this.listItemElement.classList.add(getClassNameFromKind(kind));
    this.childrenListElement.classList.add('issue-kind-body');
  }

  getKindName(): string {
    switch (this.kind) {
      case IssuesManager.Issue.IssueKind.BreakingChange:
        return i18nString(UIStrings.breakingChanges);
      case IssuesManager.Issue.IssueKind.Improvement:
        return i18nString(UIStrings.improvements);
      case IssuesManager.Issue.IssueKind.PageError:
        return i18nString(UIStrings.pageErrors);
    }
  }

  getKind(): IssuesManager.Issue.IssueKind {
    return this.kind;
  }

  private appendHeader(): void {
    const header = document.createElement('div');
    header.classList.add('header');

    const issueKindIcon = new IconButton.Icon.Icon();
    issueKindIcon.data = IssueCounter.IssueCounter.getIssueKindIconData(this.kind);
    issueKindIcon.classList.add('leading-issue-icon');

    const countAdorner = new Adorners.Adorner.Adorner();
    countAdorner.data = {
      name: 'countWrapper',
      content: this.issueCount,
    };
    countAdorner.classList.add('aggregated-issues-count');
    this.issueCount.textContent = '0';

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = this.getKindName();

    header.appendChild(issueKindIcon);
    header.appendChild(countAdorner);
    header.appendChild(title);

    this.listItemElement.appendChild(header);
  }

  onattach(): void {
    this.appendHeader();
    this.expand();
  }

  update(count: number): void {
    this.issueCount.textContent = `${count}`;
  }
}
