// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {AXNode, SDKNodeToAXNode} from './AccessibilityTreeUtils.js';
import type {AccessibilityNode, AccessibilityNodeData} from './AccessibilityNode.js';

export interface AccessibilityTreeData {
  node: SDK.DOMModel.DOMNode|null;
}

export class AccessibilityTree extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private node: SDK.DOMModel.DOMNode|null = null;
  private nodeMap: Map<string, HTMLElement> = new Map();
  private selectedNode: AccessibilityNode|null = null;
  private rootNode: AXNode|null = null;

  constructor() {
    super();
    this.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  set data(data: AccessibilityTreeData) {
    this.node = data.node;
    this.shadow.host.setAttribute('role', 'tree');
    this.render();
  }

  wasShown(): void {
    if (this.rootNode) {
      const rootNode = this.nodeMap.get(this.rootNode.id);
      if (rootNode) {
        rootNode.focus();
      }
    }
  }

  set selectedAXNode(node: AccessibilityNode) {
    this.selectedNode = node;
  }

  get nodesMap(): Map<string, HTMLElement> {
    return this.nodeMap;
  }

  appendToNodeMap(id: string, node: AccessibilityNode): void {
    this.nodeMap.set(id, node);
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp':
        break;
      case 'ArrowDown':
        break;
      case 'ArrowLeft':
        this.selectedNode?.leftArrowPress();
        break;
      case 'ArrowRight':
        this.selectedNode?.rightArrowPress();
        break;
      case 'Home':
        break;
      case 'End':
        break;
      case 'Enter':
        break;
      default:
        return;
    }
  }

  async refreshAccessibilityTree(): Promise<SDK.AccessibilityModel.AccessibilityNode|null> {
    if (!this.node) {
      return null;
    }

    const accessibilityModel = this.node.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
    if (!accessibilityModel) {
      return null;
    }

    const result = await accessibilityModel.requestRootNode();
    return result || null;
  }

  private render(): void {
    this.refreshAccessibilityTree().then(rootNode => {
      if (!rootNode) {
        return;
      }

      this.rootNode = SDKNodeToAXNode(null, rootNode);

      // clang-format off
      const output = LitHtml.html`
        <devtools-accessibility-node .data=${{
          axNode: this.rootNode,
          axTree: this,
          isSelected: true,
          } as AccessibilityNodeData}>
        </devtools-accessibility-node>
        `;
      // clang-format on
      LitHtml.render(output, this.shadow);
    });
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
