// Copyright (c) 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';

import iconStyles from './newIcon.css.js';

/**
 * A simple icon component to display SVG icons from the `front_end/Images/` folder.
 *
 * Usage is simple:
 *
 * ```js
 * // Instantiate directly:
 * const icon = new IconButton.NewIcon.NewIcon();
 * icon.name = 'bin';
 * container.appendChild(icon);
 *
 * // Use within a template:
 * LitHtml.html`
 *   <${IconButton.NewIcon.NewIcon.litTagName} name="bin">
 *   </${IconButton.NewIcon.NewIcon.litTagName}>
 * `;
 * ```
 *
 * The color for the icon defaults to `var(--icon-default)`, while the dimensions
 * default to 20px times 20px. You can change both color and size via CSS:
 *
 * ```css
 * devtools-new-icon.my-icon {
 *   color: red;
 *   width: 14px;
 *   height: 14px;
 * }
 * ```
 *
 * If you don't override the `color` property, and use the icon within a `<button>`,
 * it'll automatically change color to `var(--icon-default-hover)` upon hovering
 * with the mouse over the surrounding `<button>` element.
 *
 * @attr name - The basename of the icon file (not including the `.svg` suffix).
 * @prop {String} name - The `"name"` attribute is reflected as property.
 */
export class NewIcon extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-new-icon`;
  static readonly observedAttributes = ['name'];

  readonly #shadowRoot;
  readonly #icon;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({mode: 'open'});
    this.#icon = document.createElement('span');
    this.#shadowRoot.appendChild(this.#icon);
  }

  get name(): string|null {
    return this.getAttribute('name');
  }

  set name(name: string) {
    this.setAttribute('name', name);
  }

  connectedCallback(): void {
    this.#shadowRoot.adoptedStyleSheets = [iconStyles];
  }

  attributeChangedCallback(_name: string, _oldValue: string, newValue: string): void {
    const url = new URL(`../../../Images/${newValue}.svg`, import.meta.url);
    this.#icon.style.setProperty('--icon-url', `url(${url})`);
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-new-icon', NewIcon);

declare global {
  interface HTMLElementTagNameMap {
    'devtools-new-icon': NewIcon;
  }
}
