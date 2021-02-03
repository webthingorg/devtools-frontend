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
  private readonly shadow = this.attachShadow({mode: 'open', delegatesFocus: false});
  private node: SDK.DOMModel.DOMNode|null = null;
  private nodeMap: Map<string, AccessibilityNode> = new Map();
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

  set selectedAXNode(node: AccessibilityNode) {
    // deselect previous node
    if (this.selectedNode && this.selectedNode !== node) {
      this.selectedNode.selected = false;
    }

    // select and focus new node
    this.selectedNode = node;
    this.selectedNode.selected = true;
  }

  get nodesMap(): Map<string, AccessibilityNode> {
    return this.nodeMap;
  }

  wasShown(): void {
    if (this.rootNode) {
      const rootNode = this.nodeMap.get(this.rootNode.id);
      if (rootNode) {
        this.selectedNode = rootNode;
        this.selectedNode.selected = true;
      }
    }
  }

  appendToNodeMap(id: string, node: AccessibilityNode): void {
    this.nodeMap.set(id, node);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.selectedNode) {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        this.selectedNode.upArrowPress();
        break;
      case 'ArrowDown':
        this.selectedNode.downArrowPress();
        break;
      case 'ArrowLeft':
        this.selectedNode.leftArrowPress();
        break;
      case 'ArrowRight':
        this.selectedNode.rightArrowPress();
        break;
      case 'Home':
        if (this.rootNode) {
          const rootNode = this.nodeMap.get(this.rootNode.id);
          if (rootNode) {
            this.selectedNode = rootNode;
            this.selectedNode.selected = true;
          }
        }
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
