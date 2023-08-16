// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import {type Breadcrumb} from './Breadcrumbs.js';

const {render, html} = LitHtml;

export interface BreadcrumbsUIData {
  breadcrumb: Breadcrumb;
}

export class BreadcrumbsUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-breadcrumbs-ui`;
  #shadow = this.attachShadow({mode: 'open'});
  #sliceLengthMs: TraceEngine.Types.Timing.MicroSeconds = TraceEngine.Types.Timing.MicroSeconds(0);

  set data(data: BreadcrumbsUIData) {
    this.#sliceLengthMs = data.breadcrumb.window.range;
    this.#render();
  }

  #render(): void {
    const output = html`
        <div style="display: flex; align-items: center;">
            <span>${this.#sliceLengthMs} ms</span>
            <${IconButton.Icon.Icon.litTagName} .data=${
        {iconName: 'chevron-right', color: 'var(--icon-default)', width: '14px', height: '14px'} as
        IconButton.Icon.IconWithName}>
        </div>
        `;
    render(output, this.#shadow, {host: this});
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-breadcrumbs-ui', BreadcrumbsUI);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-breadcrumbs-ui': BreadcrumbsUI;
  }
}
