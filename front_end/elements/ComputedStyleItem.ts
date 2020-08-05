// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

export class ComputedStyleItem extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  set data(data: {}) {
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on
  }
}

customElements.define('devtools-computed-style-item', ComputedStyleItem);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-computed-style-item': ComputedStyleItem;
  }
}
