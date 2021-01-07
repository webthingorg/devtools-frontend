// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

// import {AccessibilityNode} from './AccessibilityTreeView.js';
// import {AccessibilityNode} from './AccessibilityNode.js';
import type {AccessibilityNodeData} from './AccessibilityNode.js';

export interface AccessibilityTreeData {
  rootNode: SDK.AccessibilityModel.AccessibilityNode|null;
}

export class AccessibilityTree extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null = null;

  set data(data: AccessibilityTreeData) {
    this.rootNode = data.rootNode;
    this.render();
  }

  appendNodeAndChildren(parent: HTMLUListElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    if (!node) {
      return;
    }
    // AccessibilityNode creates an HTMLElement for a new node.
    // const axNode = new AccessibilityNode(node);
    // parent.appendChild(axNode.getElement());

    // Base case
    if (node.numChildren() === 0) {
      return;
    }

    // Recursive case
    const ul = document.createElement('ul');
    UI.ARIAUtils.markAsGroup(ul);
    parent.appendChild(ul);
    for (const child of node.children()) {
      this.appendNodeAndChildren(ul, child);
    }
  }

  private render(): void {
    if (!this.rootNode) {
      return;
    }

    const root = document.createElement('ul');
    UI.ARIAUtils.markAsGroup(root);
    // this.appendNodeAndChildren(root, this.rootNode);

    // clang-format off
    const output = LitHtml.html`
    <devtools-accessibility-node .data=${{axNode: this.rootNode} as AccessibilityNodeData}></devtools-accessibility-node>
    `; // ${root}
    // clang-format on
    LitHtml.render(output, this.shadow);
  }
}

if (!customElements.get('devtools-accessibility-tree')) {
  customElements.define('devtools-accessibility-tree', AccessibilityTree);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-tree': AccessibilityTree;
  }
}
