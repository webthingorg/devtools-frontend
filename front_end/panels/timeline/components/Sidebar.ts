// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../../core/root/root.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';
import * as SidebarInsight from './SidebarInsight.js';

const COLLAPSED_WIDTH = 40;
const DEFAULT_EXPANDED_WIDTH = 240;

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

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  #toggleButtonClick(): void {
    this.dispatchEvent(new Event('togglebuttonclick'));
  }

  render(expanded: boolean): void {
    const toggleIcon = expanded ? 'left-panel-close' : 'left-panel-open';
    const showLCPPhases = true;
    const lcpTitle = 'LCP by Phase';

    const lcpPhaseData = [
      {phase: 'Time to first byte', percentage: 15},
      {phase: 'Resource load delay', percentage: 42},
      {phase: 'Resource load duration', percentage: 25},
      {phase: 'Resource render delay', percentage: 18},
    ];

    // clang-format off
    const output = LitHtml.html`<div class=${LitHtml.Directives.classMap({
      sidebar: true,
      'is-expanded': expanded,
      'is-closed': !expanded,
    })}>
      <div class="tab-bar">
        <${IconButton.Icon.Icon.litTagName} name=${toggleIcon} @click=${this.#toggleButtonClick} class="sidebar-toggle-button">
        </${IconButton.Icon.Icon.litTagName}>
      </div>
      <div class="insights">
        ${expanded && showLCPPhases ? LitHtml.html`
          <${SidebarInsight.SidebarInsight.litTagName} .data=${{
              title: lcpTitle,
            } as SidebarInsight.InsightDetails}>
            <div slot="insight-description" class="insight-description">
                Each
                <x-link class="link" href="https://web.dev/articles/optimize-lcp#lcp-breakdown">phase has specific recommendations to improve.</x-link>
                In an ideal load, the two delay phases should be quite short.
            </div>
            <div slot="insight-content" class="table-container">
              <dl>
                <dt style="font-weight: bold;">Phase</dt>
                <dd style="font-weight: bold;">% of LCP</dd>
                ${lcpPhaseData.map(phase => LitHtml.html`
                  <dt>${phase.phase}</dt>
                  <dd style="font-weight: bold;">${phase.percentage}%</dd>
                `)}
              </dl>
            </div>
          </${SidebarInsight.SidebarInsight}>
        ` : null}
      </div>
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
