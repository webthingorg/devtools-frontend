// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

interface IconWithPath {
  iconPath: string;
  color: string;
  width?: string;
  height?: string;
}

interface IconWithName {
  iconName: string;
  color: string;
  width?: string;
  height?: string;
}

type IconComponentData = IconWithPath|IconWithName;

interface ColouredIconStyles {
  webkitMaskImage: string;
  webkitMaskPosition: string;
  webkitMaskRepeat: string;
  webkitMaskSize: string;
  backgroundColor: string;
}

interface IconStyles {
  backgroundImage: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundSize: string;
}

type Styles = ColouredIconStyles|IconStyles;

export class IconComponent extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private iconPath: Readonly<string> = '';
  private color: Readonly<string> = 'rgb(110 110 110)';
  private width: Readonly<string> = '100%';
  private height: Readonly<string> = '100%';
  private styles: Readonly<Styles> = {
    webkitMaskImage: 'url(' + this.iconPath + ')',
    webkitMaskPosition: 'center',
    webkitMaskRepeat: 'no-repeat',
    webkitMaskSize: 'contain',
    backgroundColor: this.color,
  };


  get data(): IconComponentData {
    return {
      iconPath: this.iconPath,
      color: this.color,
      width: this.width,
      height: this.height,
    };
  }

  set data(data: IconComponentData) {
    this.iconPath =
        'iconPath' in data ? data.iconPath : 'Images/' + ('iconName' in data ? data.iconName : 'some_icon') + '.svg';
    this.color = data.color;
    this.width = data.width ? data.width : (data.height ? data.height : this.width);
    this.height = data.height ? data.height : (data.width ? data.width : this.height);
    this.styles = data.color ? {
      webkitMaskImage: 'url(' + this.iconPath + ')',
      webkitMaskPosition: 'center',
      webkitMaskRepeat: 'no-repeat',
      webkitMaskSize: 'contain',
      backgroundColor: this.color,
    } :
                               {
                                 backgroundImage: 'url(' + this.iconPath + ')',
                                 backgroundPosition: 'center',
                                 backgroundRepeat: 'no-repeat',
                                 backgroundSize: 'contain',
                               };
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
      </style>
      <span class="icon-basic" style=${LitHtml.Directives.styleMap(this.styles)}></span>
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
