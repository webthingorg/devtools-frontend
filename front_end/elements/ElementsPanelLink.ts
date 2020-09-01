// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

export class ElementsPanelLink extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private onElementRevealIconClick: ((event?: Event) => void) = () => {};
  private onElementRevealIconMouseEnter: ((event?: Event) => void) = () => {};
  private onElementRevealIconMouseLeave: ((event?: Event) => void) = () => {};

  set data(data: {
    onElementRevealIconClick: (event?: Event) => void,
    onElementRevealIconMouseEnter: (event?: Event) => void,
    onElementRevealIconMouseLeave: (event?: Event) => void
  }) {
    this.onElementRevealIconClick = data.onElementRevealIconClick;
    this.onElementRevealIconMouseEnter = data.onElementRevealIconMouseEnter;
    this.onElementRevealIconMouseLeave = data.onElementRevealIconMouseLeave;
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    const output = LitHtml.html`
        <span 
          is="ui-icon" 
          class="icon spritesheet-largeicons largeicon-node-search icon-mask"
          style="--spritesheet-position:-140px 96px;
                width: 28px;
                height: 24px;"
          @click=${this.onElementRevealIconClick()}
          @mouseenter=${this.onElementRevealIconMouseEnter()}
          @mouseleave=${this.onElementRevealIconMouseLeave()}>ic</span>
        
        `;
    // clang-format off
        LitHtml.render(output, this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-elements-elements_panel_link', ElementsPanelLink);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-elements-elements_panel_link': ElementsPanelLink;
  }
}
