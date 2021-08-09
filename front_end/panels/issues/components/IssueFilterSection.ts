// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import type * as Common from '../../../core/common/common.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import {HideIssueLabel} from './HideIssueLabel.js';
import type {HideIssueLabelData} from './HideIssueLabel.js';

import hideFilterSectionsStyles from './issueFilterSection.css.js';

export interface HideFilterSectionsData {
  parameter: IssuesManager.IssuesManager.HideIssueFilterType;
  includedCallback: (event: Common.EventTarget.EventTargetEvent) => void;
  excludedCallback: (event: Common.EventTarget.EventTargetEvent) => void;
}
export class IssueFilterSection extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-issue-filter-section`;
  private readonly shadow: ShadowRoot = this.attachShadow({mode: 'open'});
  private visible: boolean = true;
  private includedCallback: ((event: Common.EventTarget.EventTargetEvent) => void)|null = null;
  private excludedCallback: ((event: Common.EventTarget.EventTargetEvent) => void)|null = null;
  private includedFilters: Map<string, HideIssueLabel> = new Map();
  private excludedFilters: Map<string, HideIssueLabel> = new Map();
  private parameter: IssuesManager.IssuesManager.HideIssueFilterType|null = null;
  private setting: Common.Settings.Setting<IssuesManager.IssuesManager.JointHideIssueFilter> =
      IssuesManager.IssuesManager.getJointHideIssueFilter();

  connectedCallback(): void {
    this.shadow.adoptedStyleSheets = [hideFilterSectionsStyles];
    this.setting.addChangeListener(() => {
      this.update();
    });
  }

  set data(data: HideFilterSectionsData) {
    this.includedCallback = data.includedCallback;
    this.excludedCallback = data.excludedCallback;
    this.parameter = data.parameter;
    this.render();
  }

  setVisible(x: boolean): void {
    if (this.visible === x) {
      return;
    }
    this.visible = x;
    this.render();
  }

  excludedClick(event: Event): void {
    const evTarget = {data: event} as Common.EventTarget.EventTargetEvent;
    if (this.excludedCallback) {
      this.excludedCallback(evTarget);
    }
  }

  includedClick(event: Event): void {
    const evTarget = {data: event} as Common.EventTarget.EventTargetEvent;
    if (this.includedCallback) {
      this.includedCallback(evTarget);
    }
  }

  update(): void {
    let values = null;
    if (this.parameter) {
      values = this.setting.get()[this.parameter];
    } else {
      return;
    }
    this.includedFilters.clear();
    this.excludedFilters.clear();
    for (const level of values.included) {
      const newLabel = new HideIssueLabel();
      newLabel.data = {text: level, included: true, excluded: false, parameter: this.parameter} as HideIssueLabelData;
      this.includedFilters.set(level, newLabel);
    }
    for (const level of values.excluded) {
      const newLabel = new HideIssueLabel();
      newLabel.data = {text: level, included: false, excluded: true, parameter: this.parameter} as HideIssueLabelData;
      this.excludedFilters.set(level, newLabel);
    }
    this.render();
  }

  private render(): void {
    this.classList.toggle('hidden', !this.visible);
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
      LitHtml.render(LitHtml.html`
        <div class="included-section-header" @click=${this.includedClick.bind(this)}>
          <div class="included-filters-title">
                Include
          </div>
          <button class="included-icon">
            <${IconButton.Icon.Icon.litTagName}
               .data=${{ color: '#f1f3f4', iconName: 'add-icon', height: '9px', width: '9px' } as IconButton.Icon.IconData}
            >
            </${IconButton.Icon.Icon.litTagName}>
          </button>
        </div>
        ${(this.includedFilters.size > 0) ? LitHtml.html`<div class="included-section-body">${this.includedFilters.values()}</div>` : null}
        <div class="excluded-section-header" @click=${this.excludedClick.bind(this)}>
          <div class="excluded-filters-title">
                Exclude
          </div>
          <button class="excluded-icon">
            <${IconButton.Icon.Icon.litTagName}
               .data=${{ color: '#f1f3f4', iconName: 'add-icon', height: '9px', width: '9px' } as IconButton.Icon.IconData}
            >
            </${IconButton.Icon.Icon.litTagName}>
          </button>
        </div>
      ${(this.excludedFilters.size > 0) ? LitHtml.html`<div class="excluded-section-body">${this.excludedFilters.values()}</div>` : null}
    `, this.shadow);
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-issue-filter-section', IssueFilterSection);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-issue-filter-section': IssueFilterSection;
  }
}
