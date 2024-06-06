// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarTabsStyles from './sidebarTabs.css.js';

const enum SidebarTabsName {
  INSIGHTS = 'Insights',
  ANNOTATION = 'Annotation',
}

export class SidebarTabs extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar-tabs`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  #activeTab: SidebarTabsName = SidebarTabsName.INSIGHTS;
  #insightsTabContent?: LitHtml.TemplateResult;
  #annotationTabContent?: LitHtml.TemplateResult;

  constructor() {
    super();
    this.#render();
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarTabsStyles];
  }

  #onTabHeaderClicked(activeTab: SidebarTabsName): void {
    this.#activeTab = activeTab;
    this.#render();
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

  #render(): void {
    // clang-format off
    const output = LitHtml.html`
      ${this.#renderHeader()}
      ${this.#renderContent()}
    `;
    // clang-format on
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-sidebar-tabs': SidebarTabs;
  }
}

customElements.define('devtools-performance-sidebar-tabs', SidebarTabs);
