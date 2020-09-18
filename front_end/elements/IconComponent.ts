// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

/**
   * @type {({iconPath: string, iconName?: undefined}) | ({iconPath?: undefined, iconName: string}) | {color: string} | {width: string} | {height: string}}
   */
export interface IconComponentData {
  iconPath: string;
  iconName: string|null;
  color: string;
  width: string;
  height: string;
}


export class IconComponent extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private iconPath: Readonly<string> = '';
  private color: Readonly<string> = 'rgb(110, 110, 110)';
  private width: Readonly<string> = '100%';
  private height: Readonly<string> = '100%';
  private iconClass: Readonly<string> = 'icon-basic ';


  get data(): IconComponentData {
    return {
      iconPath: this.iconPath,
      iconName: null,
      color: this.color,
      width: this.width,
      height: this.height,
    };
  }

  set data(data: IconComponentData) {
    this.iconPath = data.iconPath ? data.iconPath : 'Images/' + data.iconName + '.svg';
    this.color = data.color;
    this.iconClass = data.color ? 'icon-colored icon-basic' : 'icon icon-basic';
    this.width = data.width ? data.width : (data.height ? data.height : this.width);
    this.height = data.height ? data.height : (data.width ? data.width : this.height);
    this.update();
  }

  private update() {
    this.render();
  }

  private render() {
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          display: inline-block;
          white-space: nowrap;
          margin: 5px 7px 0px 7px;
        }

        .icon-basic {
          display: inline-block;
          width: ${this.width};
          height: ${this.height};
        }

        .icon-colored {
          -webkit-mask-image: url(${this.iconPath});
          -webkit-mask-position: center;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-size: contain;
          background-color: ${this.color};
        }

        .icon {
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
