// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../lit-html/lit-html.js';

import spinnerStyles from './spinner.css.js';

export class Spinner extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-spinner`;
  readonly #shadow = this.attachShadow({mode: 'open'});

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [spinnerStyles];
    this.#render();
  }

  #render(): void {
    // clang-format off
    LitHtml.render(LitHtml.html`
      <div class="spinner"></div>
    `, this.#shadow, {
      host: this,
    });
    // clang-format on
  }
}

customElements.define('devtools-spinner', Spinner);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-spinner': Spinner;
  }
}
