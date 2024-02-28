// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../lit-html/lit-html.js';

export const enum Type {
  Primary = 'primary',
  Outlined = 'outlined',
  Text = 'text',
  Micro = 'micro',
  Icon = 'icon',
}

export const createButton = (type: Type, iconName?: string, label?: string): LitHtml.LitTemplate => {
  switch (type) {
    case Type.Primary:
    case Type.Outlined:
    case Type.Text:
    case Type.Micro:
      if (label) {
        return LitHtml.html`<button class=${type}>
                              <div class='hover-layer'></div>
                              <div class='ripple-layer'></div>
                              ${
            iconName ? LitHtml.html`<span class='icon' style='mask-image: url('${pathFromName(iconName)})></span>` :
                       LitHtml.nothing}
                              <div>${label}</div>
                            </button>`;
      }
      break;
    case Type.Icon:
      if (iconName) {
        return LitHtml.html`<button class=${type} style='mask-image: url('${pathFromName(iconName)})></button>`;
      }
  }
  return LitHtml.nothing;
};

const pathFromName = (name: string): string => {
  return new URL(`../../../Images/${name}.svg`, import.meta.url).toString();
};
