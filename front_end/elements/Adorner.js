// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const template = document.createElement('template');
template.innerHTML = `
  <style>
    slot[name=content] {
      display: inline-block;
      padding: 0 6px;
      color: var(--adorner-text-color, #ffffff);
      background-color: var(--adorner-background-color, #666666);
      border-radius: var(--adorner-border-radius, 3px);
    }
  </style>
  <slot name="content"></slot>
`;

export class Adorner extends HTMLElement {
  /**
   *
   * @param {!HTMLElement} content
   * @param {?*} options
   */
  static create(content, options = {}) {
    const adorner = document.createElement('devtools-adorner');
    content.setAttribute('slot', 'content');

    const {ariaLabel} = options;
    adorner.setAttribute('aria-label', `${ariaLabel || HTMLElement}, adorner`);

    adorner.appendChild(content);
    return adorner;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  show() {
    this.style.display = 'inline-flex';
  }

  hide() {
    this.style.display = 'none';
  }
}

self.customElements.define('devtools-adorner', Adorner);
