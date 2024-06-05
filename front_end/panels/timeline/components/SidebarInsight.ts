// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarInsightStyles from './sidebarinsight.css.js';

// We can use this to pass in data.
export interface InsightDetails {
  title: string;
  text: string;
}

export class SidebarInsight extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-performance-sidebar-insight`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #boundRender = this.#render.bind(this);
  #insightTitle: string = '';
  #insightText: string = '';

  constructor() {
    super();
  }

  set data(data: InsightDetails) {
    this.#insightTitle = data.title;
    this.#insightText = data.text;
  }

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarInsightStyles];
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
  }

  #render(): void {
    const output = LitHtml.html`
        <div class=insight>
            <h2 class=insight-title>${this.#insightTitle}</h2>
            <span class=insight-text>
              <p>${this.#insightText}</p>
            </span>
        </div>`;
    LitHtml.render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-performance-sidebar-insight': SidebarInsight;
  }
}

customElements.define('devtools-performance-sidebar-insight', SidebarInsight);
