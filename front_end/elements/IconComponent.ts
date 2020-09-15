// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';


export class IconComponent extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private iconPath: Readonly<string|null> = '';
  private color: Readonly<string|null> = '';
  private width: Readonly<number|null> = 0;
  ;
  private height: Readonly<number|null> = 0;
  ;
  private iconClass: Readonly<string> = 'icon-component icon-basic';

  set data(data: {iconPath: string|null, color: string|null, width: number|null, height: number|null}) {
    this.style.display = 'inline-block';
    this.iconPath = data.iconPath;
    this.color = data.color;
    if (this.color) {
      this.iconClass = 'icon-component-colored icon-basic';
    }
    this.width = data.width ? data.width : data.height;
    this.height = data.height ? data.height : data.width;
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        .icon-basic {
          display: inline-block;
          width: ${this.width}px;
          height: ${this.height}px;
        }

        .icon-component-colored {
          -webkit-mask-image: url(${this.iconPath});
          -webkit-mask-position: center;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-size: contain;
          background-color: ${this.color};
        }

        .icon-component {
          background-image: url(${this.iconPath});
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
        }
      </style>
      <span class="${this.iconClass}"></span>
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
