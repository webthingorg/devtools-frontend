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

import type {AggregatedIssue} from '../IssueAggregator.js';

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

const str_ = i18n.i18n.registerUIStrings('panels/issues/components/hideIssuesMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export class HideIssuesMenu extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-hide-issues-menu`;
  private visible: boolean;
  private shadow: ShadowRoot;
  private issue: AggregatedIssue;
  private hideIssueByCategorySetting: Common.Settings.Setting<IssuesManager.Issue.HiddenIssuesSetting>;
  private hideIssueByKindSetting: Common.Settings.Setting<IssuesManager.Issue.HiddenIssuesSetting>;
  private hideIssueByCodeSetting: Common.Settings.Setting<IssuesManager.Issue.HiddenIssuesSetting>;

  constructor(issue: AggregatedIssue) {
    super();
    this.visible = false;
    this.issue = issue;
    this.issue = issue;
    this.shadow = this.attachShadow({mode: 'open'});
    this.classList.toggle('hidden', !this.visible);
    UI.Tooltip.Tooltip.install(this, i18nString(UIStrings.tooltipTitle));
    this.hideIssueByCategorySetting = IssuesManager.Issue.getHideIssueByCatergorySetting();
    this.hideIssueByKindSetting = IssuesManager.Issue.getHideIssueByKindSetting();
    this.hideIssueByCodeSetting = IssuesManager.Issue.getHideIssueByCodeSetting();
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

  connectedCallback(): void {
    this.render();
  }

  clickHandler(event: Event): void {
    if (!event) {
      return;
    }
    event.stopPropagation();
    const kind = this.issue.getKind();
    const category = this.issue.getCategory();
    const contextMenu = new UI.ContextMenu.ContextMenu(
        event, true, this.totalOffsetLeft(), this.totalOffsetTop() + (this as HTMLElement).offsetHeight);
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByKind, {PH1: kind}), this.hideByIssueKindMenuHandler.bind(this));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCategory, {PH1: category}), this.hideByIssueCategoryMenuHandler.bind(this));
    contextMenu.headerSection().appendItem(
        i18nString(UIStrings.hideIssueByCode), this.hideByIssueCodeMenuHandler.bind(this));
    // for (const entry of entries) {
    //   contextMenu.headerSection().appendItem(
    //     // eslint-disable-next-line no-console
    //     entry, () => console.log(entry));
    // }
    contextMenu.show();
  }
  hideByIssueKindMenuHandler(): void {
    const kind = this.issue.getKind();
    const kindSetting = this.hideIssueByKindSetting;
    const values = kindSetting.get();
    if (values[kind]) {
      return;
    }
    values[kind] = true;
    kindSetting.set(values);
  }

  hideByIssueCategoryMenuHandler(): void {
    const category = this.issue.getCategory();
    const categorySetting = this.hideIssueByCategorySetting;
    const values = categorySetting.get();
    if (values[category]) {
      return;
    }
    values[category] = true;
    categorySetting.set(values);
  }

  hideByIssueCodeMenuHandler(): void {
    const code = this.issue.code();
    const codeSetting = this.hideIssueByCodeSetting;
    const values = codeSetting.get();
    if (values[code]) {
      return;
    }
    values[code] = true;
    codeSetting.set(values);
  }

  private async render(): Promise<void> {
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

ComponentHelpers.CustomElements.defineComponent('devtools-hide-issues-menu', HideIssuesMenu);
