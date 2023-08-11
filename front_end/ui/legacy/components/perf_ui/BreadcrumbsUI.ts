// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ComponentHelpers from '../../../components/helpers/helpers.js';
import * as LitHtml from '../../../lit-html/lit-html.js';

const {render, html} = LitHtml;

export interface BreadcrumbsUIData {}

export class BreadcrumbsUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-breadcrumbs-ui`;
  private readonly shadow = this.attachShadow({mode: 'open'});

  private render(): void {
    const output = html`
        <div>
            HEY I'M BREADCRUMB
        </div>
        `;
    render(output, this.shadow, {host: this});
  }

  set data(data: BreadcrumbsUIData) {
    this.render();
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-breadcrumbs-ui', BreadcrumbsUI);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-breadcrumbs-ui': BreadcrumbsUI;
  }
}
