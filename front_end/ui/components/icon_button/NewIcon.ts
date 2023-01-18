// Copyright (c) 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';

export class NewIcon extends LitHtml.LitElement {
  @LitHtml
      .Decorators.property({
        type: String,
      }) name = '';
  static styles = LitHtml.css`
    :host {
      display: inline-block;
      width: 18px;
      height: 18px;
    }

    span {
      display: block;
      width: 100%;
      height: 100%;
      white-space: nowrap;
      background-color: currentcolor;
      -webkit-mask-position: center;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: 99%;
    }
  `;

  render(): LitHtml.LitTemplate {
    const path = this.pathFromName(this.name);
    const styles = {webkitMaskImage: `url(${path})`};
    return LitHtml.html`<span style=${LitHtml.Directives.styleMap(styles)}></span>`;
  }

  pathFromName(name: string|null): string {
    return new URL(`../../../Images/${name}.svg`, import.meta.url).toString();
  }
}

ComponentHelpers.CustomElements.defineComponent('new-devtools-icon', NewIcon);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'new-devtools-icon': NewIcon;
  }
}
