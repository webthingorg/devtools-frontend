
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
  hideIssueByCode: 'Hide issues like this',
  /**
  *@description Menu entry for Unhiding a particular issue, in the Hide Issues context menu.
  */
  UnhideIssueByCode: 'Unhide issues like this',
  /**
  *@description Menu entry for hiding all available issues belonging to a particular kind.
  */
  hideAllAvailableIssues: 'Hide all available issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/components/HideIssuesMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export interface HiddenIssuesMenuData {
  issueCode?: string;
  issueKind?: IssuesManager.Issue.IssueKind;
  forHiddenIssue: boolean;
}

export class HideIssuesMenu extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-hide-issues-menu`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private code: string|null = null;
  private kind: IssuesManager.Issue.IssueKind|null = null;
  private visible: boolean = false;
  private hideIssueSetting: Common.Settings.Setting<IssuesManager.IssuesManager.HideIssueMenuSetting> =
      IssuesManager.IssuesManager.getHideIssueByCodeSetting();
  private forHiddenIssue: boolean = false;

  set data(data: HiddenIssuesMenuData) {
    this.classList.add('hide-issues-menu');
    if (data.issueCode) {
      this.code = data.issueCode;
    }
    if (data.issueKind) {
      this.kind = data.issueKind;
    }
    this.forHiddenIssue = data.forHiddenIssue;
    this.render();
  }

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [hideIssuesMenuStyles];
  }

  setVisible(x: boolean): void {
    if (this.visible === x) {
      return;
    }
    this.visible = x;
    this.render();
  }

  onMenuOpen(event: Event): void {
    event.stopPropagation();
    const contextMenu = new UI.ContextMenu.ContextMenu(event, {useSoftMenu: true});
    if (this.forHiddenIssue) {
      contextMenu.headerSection().appendItem(i18nString(UIStrings.UnhideIssueByCode), () => this.unhideIssueByCode());
    }
    if (this.kind) {
      contextMenu.headerSection().appendItem(
          i18nString(UIStrings.hideAllAvailableIssues), () => this.hideAllAvailableIssues());
    }
    if (this.code && !this.forHiddenIssue) {
      contextMenu.headerSection().appendItem(i18nString(UIStrings.hideIssueByCode), () => this.hideIssueByCode());
    }
    contextMenu.show();
  }

  hideIssueByCode(): void {
    const values = this.hideIssueSetting.get();
    if (this.code) {
      values[this.code] = IssuesManager.IssuesManager.IssueStatus.Hidden;
      this.hideIssueSetting.set(values);
    }
  }

  unhideIssueByCode(): void {
    const values = this.hideIssueSetting.get();
    if (this.code) {
      values[this.code] = IssuesManager.IssuesManager.IssueStatus.Unhidden;
      this.hideIssueSetting.set(values);
    }
  }

  hideAllAvailableIssues(): void {
    const values = this.hideIssueSetting.get();
    for (const issue of IssuesManager.IssuesManager.IssuesManager.instance().issues()) {
      if (issue.getKind() === this.kind) {
        values[issue.code()] = IssuesManager.IssuesManager.IssueStatus.Hidden;
      }
    }
    this.hideIssueSetting.set(values);
  }

  private render(): void {
    this.classList.toggle('hidden', !this.visible);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      LitHtml.render(LitHtml.html`
        <button class="hide-issues-menu-btn" @click=${this.onMenuOpen.bind(this)} title=${i18nString(UIStrings.tooltipTitle)}>
        <${IconButton.Icon.Icon.litTagName}
          .data=${{ color: '', iconName: 'three_dots_menu_icon', height: '14px', width: '4px' } as IconButton.Icon.IconData}
        >
        </${IconButton.Icon.Icon.litTagName}>
        </button>
      `, this.shadow, {host: this});
    }
  }

ComponentHelpers.CustomElements.defineComponent('devtools-hide-issues-menu', HideIssuesMenu);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-hide-issues-menu': HideIssuesMenu;
  }
}
