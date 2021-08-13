
// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import unhideAllIssuesButtonStyles from './unhideAllIssuesButton.css.js';

const UIStrings = {
  /**
  *@description Title for the tooltip for the Unhide all issues button.
  */
  tooltipTitle: 'Unhide all hidden issues',
};

const str_ = i18n.i18n.registerUIStrings('panels/issues/components/UnhideAllIssuesButton.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export interface UnhideAllIssuesButtonData {
  callback: () => void;
}

export class UnhideAllIssuesButton extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-unhide-all-issues-button`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private callback: (() => void)|null = null;

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [unhideAllIssuesButtonStyles];
  }

  set data(data: UnhideAllIssuesButtonData) {
    this.callback = data.callback;
    this.render();
  }

  unhideAllIssues(): void {
    if (this.callback) {
      this.callback();
    }
  }

  private render(): void {
    this.classList.add('unhide-all-issues');
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      LitHtml.render(LitHtml.html`
        <button class="unhide-all-issues-btn" @click=${this.unhideAllIssues.bind(this)} title=${i18nString(UIStrings.tooltipTitle)}>
        <${IconButton.Icon.Icon.litTagName}
          .data=${{iconName: 'refresh_12x12_icon', color: '', height: '12px', width: '12px'} as IconButton.Icon.IconData}
        >
        </${IconButton.Icon.Icon.litTagName}>
        </button>
      `, this.shadow);
    }
  }

ComponentHelpers.CustomElements.defineComponent('devtools-unhide-all-issues-button', UnhideAllIssuesButton);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-unhide-all-issues-button': UnhideAllIssuesButton;
  }
}
