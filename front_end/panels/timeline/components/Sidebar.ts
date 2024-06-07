// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../../core/root/root.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';

const COLLAPSED_WIDTH = 40;
const DEFAULT_EXPANDED_WIDTH = 240;

const enum SidebarTabsName {
  INSIGHTS = 'Insights',
  ANNOTATION = 'Annotation',
}

export class SidebarWidget extends UI.SplitWidget.SplitWidget {
  #sidebarExpanded: boolean = false;
  #sidebarUI = new SidebarUI();

  constructor() {
    super(true /* isVertical */, false /* secondIsSidebar */, undefined /* settingName */, COLLAPSED_WIDTH);

    if (Root.Runtime.experiments.isEnabled(Root.Runtime.ExperimentName.TIMELINE_SIDEBAR)) {
      this.sidebarElement().append(this.#sidebarUI);
    } else {
      this.hideSidebar();
    }

    this.#sidebarUI.render(this.#sidebarExpanded);

    this.#sidebarUI.addEventListener('togglebuttonclick', () => {
      this.#sidebarExpanded = !this.#sidebarExpanded;

      if (this.#sidebarExpanded) {
        this.setResizable(true);
        this.forceSetSidebarWidth(DEFAULT_EXPANDED_WIDTH);

      } else {
        this.setResizable(false);
        this.forceSetSidebarWidth(COLLAPSED_WIDTH);
      }

      this.#sidebarUI.render(this.#sidebarExpanded);
    });
  }
}

export class SidebarUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #activeTab: SidebarTabsName = SidebarTabsName.INSIGHTS;
  #insightsTabContent?: LitHtml.TemplateResult;
  #annotationTabContent?: LitHtml.TemplateResult;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  #toggleButtonClick(): void {
    this.dispatchEvent(new Event('togglebuttonclick'));
  }

  #onTabHeaderClicked(activeTab: SidebarTabsName): void {
    this.#activeTab = activeTab;
    // When the tabs are shown the sidebar is always open.
    this.render(/* expanded= */ true);
  }

  #renderHeader(): LitHtml.LitTemplate {
    // clang-format off
    return LitHtml.html`
      <div class="tabs-header"}>
        <input
          type="button"
          value=${SidebarTabsName.INSIGHTS}
          ?active=${this.#activeTab === SidebarTabsName.INSIGHTS}
          @click=${()=>this.#onTabHeaderClicked(SidebarTabsName.INSIGHTS)}>
        <input
          type="button"
          value=${SidebarTabsName.ANNOTATION}
          ?active=${this.#activeTab === SidebarTabsName.ANNOTATION}
          @click=${()=>this.#onTabHeaderClicked(SidebarTabsName.ANNOTATION)}>
      </div>
    `;
    // clang-format on
  }

  #renderInsightsTabContent(): LitHtml.TemplateResult {
    if (this.#insightsTabContent) {
      return this.#insightsTabContent;
    }
    // clang-format off
    this.#insightsTabContent = LitHtml.html`
      <h2>Content for Insights Tab</h2>
      <p>This is the content of the Insights tab.</p>
    `;
    // clang-format on
    return this.#insightsTabContent;
  }

  #renderAnnotationTabContent(): LitHtml.TemplateResult {
    if (this.#annotationTabContent) {
      return this.#annotationTabContent;
    }
    // clang-format off
    this.#annotationTabContent = LitHtml.html`
      <h2>Content for Annotation Tab</h2>
      <p>This is the content of the Annotation tab.</p>
    `;
    // clang-format on
    return this.#annotationTabContent;
  }

  #renderContent(): LitHtml.TemplateResult|null {
    switch (this.#activeTab) {
      case SidebarTabsName.INSIGHTS:
        return this.#renderInsightsTabContent();
      case SidebarTabsName.ANNOTATION:
        return this.#renderAnnotationTabContent();
      default:
        return null;
    }
  }

  render(expanded: boolean): void {
    const toggleIcon = expanded ? 'left-panel-close' : 'left-panel-open';
    // clang-format off
    const output = LitHtml.html`<div class=${LitHtml.Directives.classMap({
      sidebar: true,
      'is-expanded': expanded,
      'is-closed': !expanded,
    })}>
      <div class="tab-bar">
        ${expanded? this.#renderHeader() :LitHtml.nothing}
        <${IconButton.Icon.Icon.litTagName} name=${toggleIcon} @click=${this.#toggleButtonClick} class="sidebar-toggle-button">
        </${IconButton.Icon.Icon.litTagName}>
      </div>
      ${expanded? this.#renderContent() :LitHtml.nothing}
    </div>`;
    // clang-format on
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-sidebar': SidebarWidget;
  }
}

customElements.define('devtools-performance-sidebar', SidebarUI);
