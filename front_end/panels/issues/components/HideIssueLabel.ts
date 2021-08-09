// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import hideIssueLabelStyles from './hideIssueLabel.css.js';

export interface HideIssueLabelData {
  text: string|null;
  included: boolean;
  excluded: boolean;
}

export class HideIssueLabel extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-hide-issue-label`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private visible: boolean = true;
  text: string = '';
  private labelClasses = {included: false, excluded: false};

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [hideIssueLabelStyles];
  }

  setVisible(x: boolean): void {
    if (this.visible === x) {
      return;
    }
    this.visible = x;
    this.render();
  }

  set data(data: HideIssueLabelData) {
    if (data.text) {
      this.text = data.text;
    }
    if (data.included && data.excluded) {
      this.labelClasses.included = false;
      this.labelClasses.excluded = false;
      this.render();
      return;
    }
    this.labelClasses.included = data.included;
    this.labelClasses.excluded = data.excluded;
    this.render();
  }

  private render(): void {
    this.classList.toggle('hidden', !this.visible);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      LitHtml.render(LitHtml.html`
        <button class="hide-issue-label ${LitHtml.Directives.classMap(this.labelClasses)}">
          ${this.text}
        </button>
      `, this.shadow);
    }
  }

ComponentHelpers.CustomElements.defineComponent('devtools-hide-issue-label', HideIssueLabel);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-hide-issue-label': HideIssueLabel;
  }
}
