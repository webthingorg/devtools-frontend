// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ARIAUtils from '../ui/ARIAUtils.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as SDK from '../sdk/sdk.js';

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
  
  traverse(parent: HTMLUListElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    if (node) {
      // AccessibilityNode creates an HTMLElement for a new node.
      const axNode = new AccessibilityNode(node);
      parent.appendChild(axNode.getElement());
    }

    // Base case
    if (node.numChildren() < 1) {
      return;
    }

    // Recursive case
    const ul = document.createElement('ul');
    ARIAUtils.markAsGroup(ul);
    parent.appendChild(ul);
    for (const child of node.children()) {
      this.traverse(ul, child);
    }
  }

  private render(): void {
    if (!this.rootNode) {
      return;
    }

    const root = document.createElement('ul');
    ARIAUtils.markAsGroup(root);
    this.traverse(root, this.rootNode);

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

      .ignored-node {
        font-style: italic;
        opacity: 70%;
      }
      
      .ax-node {
        align-items: center;
        margin: 0;
        min-height: 16px;
        overflow-x: hidden;
        padding-left: 4px;
        padding-right: 4px;
        position: relative;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ax-node span {
        flex-shrink: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ax-node .wrapper {
        overflow-x: hidden;
      }

      li.parent {
        margin-left: -13px;
      }

      ul {
        list-style-type: none;
        padding-inline-start: 12px;
      }

      li.parent.expanded::before {
        -webkit-mask-position: -16px 0;
      }

      li.parent::before {
        box-sizing: border-box;
        user-select: none;
        -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
        -webkit-mask-size: 32px 24px;
        content: '\A0';
        color: transparent;
        text-shadow: none;
        margin-right: -3px;
        -webkit-mask-position: 0 0;
        background-color: #727272;
      }
    </style>
    ${root}`;
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
