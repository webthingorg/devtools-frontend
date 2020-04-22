// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

// TODO(changhaohan): investigate if it's necessary to use a more robust
// enum mechanism, e.g. class-based enum
/** @enum {string} */
export const AdornerCategories = {
  Security: 'Security',
  Layout: 'Layout',
  Default: 'Default',
};

const DefaultDisplay = 'inline-flex';
const DefaultTextColor = '#3c4043';
const DefaultBackgroundColor = '#e8eaed';
const DefaultBorderRadius = '6px';
const DefaultFontSize = '8.5px';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
    }

    slot[name=content] {
      display: ${DefaultDisplay};
      height: 13px;
      line-height: 13px;
      padding: 0 6px;
      color: var(--adorner-text-color, ${DefaultTextColor});
      background-color: var(--adorner-background-color, ${DefaultBackgroundColor});
      border-radius: var(--adorner-border-radius, ${DefaultBorderRadius});
      font-size: var(--adorner-font-size, ${DefaultFontSize});
      font-weight: 700;
    }
  </style>
  <slot name="content"></slot>
`;

export class Adorner extends HTMLElement {
  /**
   *
   * @param {!HTMLElement} content
   * @param {string} name
   * @param {?*} options
   * @return {!Adorner}
   */
  static create(content, name, options = {}) {
    const adorner = /** @type {!Adorner} */ (document.createElement('devtools-adorner'));
    content.setAttribute('slot', 'content');
    adorner.appendChild(content);

    adorner.name = name;

    const {category} = options;
    adorner.category = category || AdornerCategories.Default;
    return adorner;
  }

  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(template.content.cloneNode(true));

    this.name = '';
    this.category = AdornerCategories.Default;
  }

  /**
   * @override
   */
  connectedCallback() {
    UI.ARIAUtils.setAccessibleName(this, `${this.name}, adorner`);
  }

  // TODO(changhaohan): add active/inactive toggle with style and ARIA updates
  show() {
    this.style.display = DefaultDisplay;
  }

  hide() {
    this.style.display = 'none';
  }
}

self.customElements.define('devtools-adorner', Adorner);
