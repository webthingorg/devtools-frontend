// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../../../core/root/root.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

import sidebarStyles from './sidebar.css.js';

const {html, render} = LitHtml;

export class Sidebar extends UI.SplitWidget.SplitWidget {
  #sidebarExpanded: boolean = false;
  #toggleButton = IconButton.Icon.create('left-panel-open', 'toggle-sidebar-button');
  #sidebarUI = new SidebarUI(this.#toggleButton);

  constructor() {
    super(true, false, undefined, 40);

    if (Root.Runtime.experiments.isEnabled(Root.Runtime.ExperimentName.PERF_PANEL_ANNOTATIONS)) {
      this.sidebarElement().append(this.#sidebarUI);
    } else {
      this.hideSidebar();
    }

    this.#sidebarUI.render(this.#sidebarExpanded);

    this.#toggleButton.addEventListener('click', () => {
      this.#sidebarExpanded = !this.#sidebarExpanded;

      if (this.#sidebarExpanded) {
        this.setResizable(true);
        this.forceSetSidebarWidth(240);

      } else {
        this.setResizable(false);
        this.forceSetSidebarWidth(40);
      }

      this.#sidebarUI.render(this.#sidebarExpanded);
    });
  }
}

export class SidebarUI extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-rpp-sidebar-ui`;
  readonly #shadow = this.attachShadow({mode: 'open'});
  #toggleButton: IconButton.Icon.Icon;

  connectedCallback(): void {
    this.#shadow.adoptedStyleSheets = [sidebarStyles];
  }

  constructor(toggleButton: IconButton.Icon.Icon) {
    super();
    this.#toggleButton = toggleButton;
  }

  render(expanded: Boolean): void {
    if (expanded) {
      // TODO: List the annotations in the sidebar
      this.#toggleButton.name = 'left-panel-close';
    } else {
      this.#toggleButton.name = 'left-panel-open';
    }
    const output = html`<div class="sidebar">${this.#toggleButton}</div>`;
    render(output, this.#shadow, {host: this});
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'devtools-rpp-sidebar-ui': Sidebar;
  }
}

customElements.define('devtools-rpp-sidebar-ui', SidebarUI);
