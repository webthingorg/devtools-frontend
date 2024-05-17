// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import * as UI from '../../../ui/legacy/legacy.js';

import sidebarStyles from './sidebar.css.js';

const {html, render} = LitHtml;

export class Sidebar extends UI.SplitWidget.SplitWidget {
  #sidebarExpanded: boolean = false;
  #toggleButton = IconButton.Icon.create('left-panel-open', 'toggle-sidebar-button');
  private emptyWidget: UI.EmptyWidget.EmptyWidget;


  constructor() {
    super(true, false, undefined, 40);

    this.element.classList.add('left-panel-close');
    this.element.textContent = "text"
    this.emptyWidget = new UI.EmptyWidget.EmptyWidget('');
    this.emptyWidget.show(this.element);

    this.#toggleButton.addEventListener('click', () => {
      this.#sidebarExpanded = !this.#sidebarExpanded;

      this.sidebarElement().removeChildren()
      
      if(this.#sidebarExpanded) {
        this.sidebarElement().append(new SidebarCollapsed(this.#toggleButton))    
      } else {
        this.sidebarElement().append(new SidebarExpanded(this.#toggleButton))
      }
    });
  
    this.sidebarElement().append(new SidebarCollapsed(this.#toggleButton))

  }
}

export class SidebarCollapsed extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-rpp-sidebar-collapsed`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #toggleButton: IconButton.Icon.Icon;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  constructor(toggleButton: IconButton.Icon.Icon) {
    super();
    this.#toggleButton = toggleButton;
    this.#render();
  }

  #render(): void {
    let output;
    this.#toggleButton.name = 'left-panel-open';
    output = html`<div class="sidebar sidebar-closed">${this.#toggleButton}</div>`;
    render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-rpp-sidebar-collapsed': Sidebar;
  }
}

customElements.define('devtools-rpp-sidebar-collapsed', SidebarCollapsed);


export class SidebarExpanded extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-rpp-sidebar-expanded`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #toggleButton: IconButton.Icon.Icon;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  constructor(toggleButton: IconButton.Icon.Icon) {
    super();
    this.#toggleButton = toggleButton;
    this.#render();
  }

  #render(): void {
    let output;
    this.#toggleButton.name = 'left-panel-close';
    output = html`<div class="sidebar sidebar-closed">${this.#toggleButton}</div>`;
    render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-rpp-sidebar-expanded': Sidebar;
  }
}

customElements.define('devtools-rpp-sidebar-expanded', SidebarExpanded);