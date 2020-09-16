// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

const IMAGES = 'Images/';
const SVG = '.svg';

export interface IconComponentData {
  iconPath: string|null;
  iconName: string|null;
  color: string|null;
  width: number|null;
  height: number|null;
}

export class IconComponent extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private iconPath: Readonly<string|null> = '';
  private iconName: Readonly<string|null> = '';
  private color: Readonly<string|null> = '';
  private width: Readonly<number|null> = 0;
  private height: Readonly<number|null> = 0;
  private iconClass: Readonly<string> = '';

  /**
   *
   */
  get data(): IconComponentData {
    return {
      iconPath: this.iconPath,
      iconName: this.iconName,
      color: this.color,
      width: this.width,
      height: this.height,
    };
  }

  set data(data: IconComponentData) {
    this.style.display = 'inline-block';
    this.iconPath = data.iconPath ? data.iconPath : IMAGES + data.iconName + SVG;
    this.iconName = data.iconName;
    this.color = data.color;
    this.iconClass = this.color ? 'icon-component-colored icon-basic' : 'icon-component icon-basic';
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
