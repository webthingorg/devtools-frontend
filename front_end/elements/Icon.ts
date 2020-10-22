// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';

export interface IconWithPath {
  iconPath: string;
  color: string;
  width?: string;
  height?: string;
}

export interface IconWithName {
  iconName: string;
  color: string;
  width?: string;
  height?: string;
}

type IconData = IconWithPath|IconWithName;

const isString = (value: string|undefined): value is string => value !== undefined;

export class Icon extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});

  private _data: Readonly<IconData> = {
    color: '',
    iconName: '',
  };

  get data(): IconData {
    return {
      ...this._data,
    };
  }

  set data(data: IconData) {
    this._data = data;
    this.render();
  }

  private getStyles() {
    const data = this._data;
    const url = 'iconPath' in data ? data.iconPath : `Images/${data.iconName}.svg`;
    const useMask = !!data.color;
    const {width, height} = data;
    const commonStyles = {
      width: isString(width) ? width : (isString(height) ? height : '100%'),
      height: isString(height) ? height : (isString(width) ? width : '100%'),
      display: 'inline-block',
    };
    if (useMask) {
      return {
        ...commonStyles,
        webkitMaskImage: `url(${url})`,
        webkitMaskPosition: 'center',
        webkitMaskRepeat: 'no-repeat',
        webkitMaskSize: '100%',
        backgroundColor: `var(--icon-color, ${data.color})`,
      };
    }
    return {
      ...commonStyles,
      backgroundImage: `url(${url})`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100%',
    };
  }

  private render() {
    // clang-format off
    LitHtml.render(LitHtml.html`
      <style>
        :host {
          display: inline-block;
          white-space: nowrap;
        }
      </style>
      <span class="icon-basic" style=${LitHtml.Directives.styleMap(this.getStyles())}></span>
    `, this.shadow);
    // clang-format on
  }
}

customElements.define('devtools-icon', Icon);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-icon': Icon;
  }
}
