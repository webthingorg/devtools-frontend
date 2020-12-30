// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {AccessibilityNode} from './AccessibilityTreeView.js';

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

  appendAxNode(parent: HTMLDetailsElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    // The constructor of AccessibilityNode appends the new node into the DOM tree
    const axNode = new AccessibilityNode(parent, node);
    if (!axNode) {
      return;
    }
  }

  traverse(parent: HTMLDetailsElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    if (node) {
      this.appendAxNode(parent, node);
    }

    // Base case
    if (node.numChildren() < 1) {
      return;
    }

    // Recursive case
    for (const child of node.children()) {
      const details = document.createElement('details');
      details.open = true;
      parent.appendChild(details);
      this.traverse(details, child);
    }
  }

  private render(): void {
    if (!this.rootNode) {
      return;
    }

    const parent = document.createElement('details');
    parent.open = true;
    this.traverse(parent, this.rootNode);

    // clang-format off
    const output = LitHtml.html`
    <style>
      .ax-readable-string {
        font-style: italic;
      }

      .monospace {
      font-family: var(--monospace-font-family);
      font-size: var(--monospace-font-size) !important;
      }

      .full-tree-ignored-node {
        font-style: italic;
        opacity: 70%;
      }

      .full-tree {
        padding-top: 1px;
        margin: 0;
        position: relative;
      }

      .full-tree .ax-node {
        align-items: center;
        margin-top: 1px;
        min-height: 16px;
        overflow-x: hidden;
        padding-left: 4px;
        padding-right: 4px;
        padding-top: 1px;
        position: relative;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .full-tree .ax-node span {
        flex-shrink: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .full-tree .ax-node .wrapper {
        padding-left: 12px;
        overflow-x: hidden;
      }

      summary.no-children::marker {
        color: transparent;
      }

      details>* {
        margin-left: 1em;
      }
    </style>
    ${parent}`;
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
