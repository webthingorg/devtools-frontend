// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

export interface AccessibilityTreeData {
  message: string;
}

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly treeView = new AccessibilityTree();
  private readonly toggleButton: HTMLButtonElement;

  constructor(toggleButton: HTMLButtonElement) {
    super();
    this.toggleButton = toggleButton;
    this.contentElement.appendChild(this.toggleButton);
    this.contentElement.appendChild(this.treeView);
  }

  private refreshAccessibilityTree() {
    this.treeView.data = {
      message: 'hello world',
    };
  }

  wasShown() {
    this.refreshAccessibilityTree();
  }

  willHide() {
    // TODO (annabelzhou): register with a11y model
  }
}

export class AccessibilityTree extends HTMLElement {
  constructor() {
    super();
  }

  // create shadow root
  private readonly shadow = this.attachShadow({mode: 'open'});
  private message: string = '';

  set data(data: AccessibilityTreeData) {
    this.message = data.message;
    this.render();
  }

  private render() {
    // clang-format off
        const output = LitHtml.html`<p>${this.message}</p>`;
    // clang-format on
    LitHtml.render(output, this.shadow);
  }
}

// register component as a custom element
if (!customElements.get('devtools-accessibility-tree')) {
  customElements.define('devtools-accessibility-tree', AccessibilityTree);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-tree': AccessibilityTree;
  }
}
