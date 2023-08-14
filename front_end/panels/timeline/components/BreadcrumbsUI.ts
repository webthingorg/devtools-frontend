// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Timeline from '../timeline.js';
import * as Types from '../../../models/trace/types/types.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

const {render, html} = LitHtml;

export interface BreadcrumbsUIData {
  breadcrumb: Timeline.Breadcrumbs.Breadcrumb;
}

export class BreadcrumbsUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-breadcrumbs-ui`;
  private readonly shadow = this.attachShadow({mode: 'open'});
  private sliceLengthMs: Types.Timing.MicroSeconds = Types.Timing.MicroSeconds(0);

  set data(data: BreadcrumbsUIData) {

    
    console.log(JSON.stringify(data));    
    
    this.sliceLengthMs = data.breadcrumb.window.range;
    // this.sliceLengthMs = Types.Timing.MicroSeconds(10);
    this.render();
  }

  private render(): void {
    const output = html`
        <div style="align-items: center; display: flex">
            <span>${this.sliceLengthMs} ms</span>
            <${IconButton.Icon.Icon.litTagName} .data=${
        {iconName: 'chevron-right', color: 'var(--icon-default)', width: '20px', height: '20px'} as
        IconButton.Icon.IconWithName}>
        </div>
        `;
    render(output, this.shadow, {host: this});
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-breadcrumbs-ui', BreadcrumbsUI);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-breadcrumbs-ui': BreadcrumbsUI;
  }
}
