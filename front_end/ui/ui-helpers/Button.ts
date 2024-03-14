// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../lit-html/lit-html.js';

import buttonStyles from './button.css.js';

export const enum Type {
  Primary = 'primary',
  Outlined = 'outlined',
  Text = 'text',
  Micro = 'micro',
  Icon = 'icon',
}

export const createButton = (type: Type, iconName?: string, label?: string): LitHtml.LitTemplate => {
  const css = [...buttonStyles.cssRules].map(rule => rule.cssText).join(' ');
  if (!iconName && !label) {
    return LitHtml.nothing;
  }
  return LitHtml.html`<style>${css}</style>
                      <button class=${type === Type.Icon ? `icon-button ${iconName}` : type}>
                        <div class='hover-layer'></div>
                        <div class='ripple-layer'></div>
                          ${iconName ? createIcon(iconName) : LitHtml.nothing}
                          ${label ? LitHtml.html`<span class="label">${label}</span>` : LitHtml.nothing}
                      </button>`;
};

const createIcon = (iconName: string): LitHtml.LitTemplate => {
  return LitHtml.html`<span class='icon' style='--icon-url: ${urlFromName(iconName)};'></span>`;
};

const urlFromName = (iconName: string): string => {
  return `var(--image-file-${iconName})`;
};
