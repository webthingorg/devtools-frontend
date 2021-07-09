
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
  *@description Menu entry for hiding all issues corresponding to a paricular IssueKind, in the Hide Issues context menu.
  *@example {Improvements} PH1
  */
  hideIssueByKind: 'Hide all {PH1}',
  /**
  *@description Menu entry for hiding all issues corresponding to a paricular IssueCategory, in the Hidden Issues context menu.
  *@example {SameSiteCookie} PH1
  */
  hideIssueByCategory: 'Hide all {PH1} issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/components/HideIssuesMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export interface HiddenIssuesMenuData {
  issueCode: string;
  issueCategory: string;
  issueKind: string;
}
export class HideIssuesMenu extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-hide-issues-menu`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private code: string = '';
  private kind: string = '';
  private category: string = '';
  private visible: boolean = false;
  private hideIssueMenuSetting: Common.Settings.Setting<IssuesManager.Issue.HideIssueMenuSetting> =
      IssuesManager.Issue.getHideIssueMenuSetting();

  set data(data: HiddenIssuesMenuData) {
    this.code = data.issueCode;
    this.category = data.issueCategory;
    this.kind = data.issueKind;
    this.classList.toggle('hidden', !this.visible);
    UI.Tooltip.Tooltip.install(this, i18nString(UIStrings.tooltipTitle));
    this.render();
  }

  isVisible(): boolean {
    return this.visible;
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
    if (!event) {
      return;
    }
    event.stopPropagation();
    const kind = this.kind;
    const category = this.category;
    const contextMenu = new UI.ContextMenu.ContextMenu(
        event, true, this.totalOffsetLeft(), this.totalOffsetTop() + (this as HTMLElement).offsetHeight);
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByKind, {PH1: kind}), () => this.hideIssueClickHandler(MenuAction.Kind));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCategory, {PH1: category}),
        () => this.hideIssueClickHandler(MenuAction.Category));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCode), () => this.hideIssueClickHandler(MenuAction.Code));
    contextMenu.show();
  }

  hideIssueClickHandler(action: MenuAction): void {
    const setting = this.hideIssueMenuSetting;
    const values = setting.get();
    switch (action) {
      case MenuAction.Kind:
        values[this.kind] = IssuesManager.Issue.HideIssue.Hide;
        setting.set(values);
        break;
      case MenuAction.Category:
        if (values[this.category]) {
          return;
        }
        values[this.category] = IssuesManager.Issue.HideIssue.Hide;
        setting.set(values);
        break;
      case MenuAction.Code:
        if (values[this.code]) {
          return;
        }
        values[this.code] = IssuesManager.Issue.HideIssue.Hide;
        setting.set(values);
        break;
      default:
        return;
    }
  }

  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      // eslint-disable-next-line rulesdir/ban_style_tags_in_lit_html
      LitHtml.render(LitHtml.html`
        <style>
        .hide-issues-menu-btn {
          position: relative;
          display: flex;
          background-color: transparent;
          flex: none;
          align-items: center;
          justify-content: center;
          padding: 1px 4px;
          overflow: hidden;
          border-radius: 0;
          cursor: pointer;
          border: none;
        }
        </style>
        <button class="hide-issues-menu-btn" @click=${this.clickHandler.bind(this)}>
        <${IconButton.Icon.Icon.litTagName}
          .data=${{ color: '', iconName: 'three_dots_menu_icon', height: '14px', width: '4px' } as IconButton.Icon.IconData}
        >
        </${IconButton.Icon.Icon.litTagName}>
        </button>
      `, this.shadow);
    }
  }

const enum MenuAction {
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
