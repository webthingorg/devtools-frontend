// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import cssVariableValueViewStyles from './cssVariableValueView.css.js';

const {render, html} = LitHtml;

export class CSSVariableValueView extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-css-variable-value-view`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  readonly #variableLink: Element;

  constructor(link: Element) {
    super();
    this.#variableLink = link;
    this.#shadow.adoptedStyleSheets = [cssVariableValueViewStyles];
    this.#render();
  }

  #render(): void {
    const variableValue = this.#variableLink.getAttribute('data-title');
    // clang-format off
    render(html`
        <div class="variable-value-popup-wrapper">${variableValue}</div>
      `, this.#shadow, {
      host: this,
    });
    // clang-format on
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-css-variable-value-view', CSSVariableValueView);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-css-variable-value-view': CSSVariableValueView;
  }
}
