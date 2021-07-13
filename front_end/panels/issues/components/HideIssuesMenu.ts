
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Common from '../../../core/common/common.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as UI from '../../../ui/legacy/legacy.js';

import hideIssuesMenuStyles from './hideIssuesMenu.css.js';

const UIStrings = {
  /**
  *@description Title for the tooltip of the (3 dots) Hide Issues menu icon.
  */
  tooltipTitle: 'Hide issues menu',
  /**
  *@description Menu entry for hiding a particular issue, in the Hide Issues context menu.
  */
  hideIssueByCode: 'Hide this issue only',
  /**
  *@description Menu entry for hiding all issues belonging to IssueKind.PageError, in the Hide Issues context menu.
  */
  hideAllPageErrors: 'Hide all PageErrors',
  /**
  *@description Menu entry for hiding all issues belonging to IssueKind.Improvements, in the Hide Issues context menu.
  */
  hideAllImprovements: 'Hide all Improvements',
  /**
  *@description Menu entry for hiding all issues belonging to IssueKind.BreakingChange, in the Hide Issues context menu.
  */
  hideAllBreakingChanges: 'Hide all Breaking Changes',
  /**
  *@description Menu entry for hiding all issues corresponding to a paricular IssueCategory, in the Hidden Issues context menu.
  *@example {SameSiteCookie} PH1
  */
  hideIssueByCategory: 'Hide all {PH1} issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/components/HideIssuesMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

function getMenuKindEntry(kind: string): string {
  switch (kind) {
    case IssuesManager.Issue.IssueKind.Improvement:
      return UIStrings.hideAllImprovements;
    case IssuesManager.Issue.IssueKind.BreakingChange:
      return UIStrings.hideAllBreakingChanges;
    case IssuesManager.Issue.IssueKind.PageError:
      return UIStrings.hideAllPageErrors;
  }
  return '';
}

export interface HiddenIssuesMenuData {
  issueCode: string;
  issueCategory: string;
  issueKind: string;
  callback: () => void;
}

export class HideIssuesMenu extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-hide-issues-menu`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private code: string = '';
  private kind: string = '';
  private category: string = '';
  private callback: (() => void)|null = null;
  private visible: boolean = false;
  private hideIssueSetting: Common.Settings.Setting<IssuesManager.Issue.HideIssueSetting> =
      IssuesManager.Issue.getHideIssueSetting();

  set data(data: HiddenIssuesMenuData) {
    this.code = data.issueCode;
    this.category = data.issueCategory;
    this.kind = data.issueKind;
    this.callback = data.callback;
    this.classList.toggle('hidden', !this.visible);
    UI.Tooltip.Tooltip.install(this, i18nString(UIStrings.tooltipTitle));
    this.render();
  }

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [hideIssuesMenuStyles];
  }

  setVisible(x: boolean): void {
    if (this.visible === x) {
      return;
    }
    this.classList.toggle('hidden', !x);
    this.visible = x;
  }

  focus(): void {
    this.focus();
  }

  clickHandler(event: Event): void {
    event.stopPropagation();
    const contextMenu = new UI.ContextMenu.ContextMenu(
        event, true, this.totalOffsetLeft(), this.totalOffsetTop() + (this as HTMLElement).offsetHeight);
    contextMenu.headerSection().appendItem(
        i18nString(getMenuKindEntry(this.kind)), () => this.hideIssueClickHandler(MenuEntryAction.Kind));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCategory, {PH1: this.category}),
        () => this.hideIssueClickHandler(MenuEntryAction.Category));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCode), () => this.hideIssueClickHandler(MenuEntryAction.Code));
    contextMenu.show();
  }

  hideIssueClickHandler(action: MenuEntryAction): void {
    const values = this.hideIssueSetting.get();
    switch (action) {
      case MenuEntryAction.Kind:
        if (values['kind'][this.kind] === IssuesManager.Issue.IssueStatus.Hidden) {
          return;
        }
        values['kind'][this.kind] = IssuesManager.Issue.IssueStatus.Hidden;
        break;
      case MenuEntryAction.Category:
        if (values['category'][this.category] === IssuesManager.Issue.IssueStatus.Hidden) {
          return;
        }
        values['category'][this.category] = IssuesManager.Issue.IssueStatus.Hidden;
        break;
      case MenuEntryAction.Code:
        if (values['code'][this.code] === IssuesManager.Issue.IssueStatus.Hidden) {
          return;
        }
        values['code'][this.code] = IssuesManager.Issue.IssueStatus.Hidden;
        break;
    }
    if (this.callback) {
      this.hideIssueSetting.set(values);
      this.callback();
    }
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      LitHtml.render(LitHtml.html`
        <button class="hide-issues-menu-btn" @click=${this.clickHandler.bind(this)}>
        <${IconButton.Icon.Icon.litTagName}
          .data=${{ color: '', iconName: 'three_dots_menu_icon', height: '14px', width: '4px' } as IconButton.Icon.IconData}
        >
        </${IconButton.Icon.Icon.litTagName}>
        </button>
      `, this.shadow);
    }
  }

const enum MenuEntryAction {
    Category = 'Category',
    Kind = 'Kind',
    Code = 'Code',
}

ComponentHelpers.CustomElements.defineComponent('devtools-hide-issues-menu', HideIssuesMenu);


declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-hide-issues-menu': HideIssuesMenu;
  }
}
