// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {DOMNode, Settings} from './LayoutPaneUtils.js';

export class LayoutPane extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private settings: Readonly<Settings>|null = null;
  private selectedDOMNode: Readonly<DOMNode>|null = null;

  set data(data: {selectedNode: DOMNode|null, settings: Settings}) {
    this.selectedDOMNode = data.selectedNode;
    this.settings = data.settings;
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
      <div>
        <h2>CSS Grid</h2>
        ${this.settings && LitHtml.html`
        <div>
          showGridBorder = ${this.settings.showGridBorder}
        </div>
        `}
      </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }
}

customElements.define('devtools-layout-pane', LayoutPane);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-layout-pane': LayoutPane;
  }
}
