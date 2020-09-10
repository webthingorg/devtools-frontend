// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';


export class IconComponent extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private iconPath: Readonly<string|null> = '';

  set data(data: {iconPath: string|null}) {
    this.iconPath = data.iconPath;
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        .icon-component {
          display: inline-block;
          width: 28px;
          height: 24px;
          webkit-mask-image: url('../Images/element_explore_icon.svg');
          background-color: rgb(110, 110, 110);
        }
      </style>
      <image src="${this.iconPath}">
    `, this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-icon-component', IconComponent);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-icon-component': IconComponent;
  }
}
