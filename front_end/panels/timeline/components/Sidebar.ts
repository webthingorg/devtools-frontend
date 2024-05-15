// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';

const {html, render} = LitHtml;

export class Sidebar extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-rpp-sidebar`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #sidebarExpanded: boolean = false;
  #toggleButton = IconButton.Icon.create('left-panel-open', 'toggle-sidebar-button');

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  constructor() {
    super();
    this.#toggleButton.addEventListener('click', () => {
      this.#sidebarExpanded = !this.#sidebarExpanded;
      this.#render();
    });
    this.#render();
  }

  #render(): void {
    let output;
    if (this.#sidebarExpanded) {
      this.#toggleButton.name = 'left-panel-close';
      // TODO: List all annotations
      output = html`<div class="sidebar sidebar-open">${this.#toggleButton}</div>`;
    } else {
      this.#toggleButton.name = 'left-panel-open';
      output = html`<div class="sidebar sidebar-closed">${this.#toggleButton}</div>`;
    }
    render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-rpp-sidebar': Sidebar;
  }
}

customElements.define('devtools-rpp-sidebar', Sidebar);
