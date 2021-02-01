// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {SDKNodeToAXNode} from './AccessibilityTreeUtils.js';
import type {AccessibilityNode, AccessibilityNodeData} from './AccessibilityNode.js';

export interface AccessibilityTreeData {
  node: SDK.DOMModel.DOMNode|null;
}

export class AccessibilityTree extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private node: SDK.DOMModel.DOMNode|null = null;
  private nodeList: AccessibilityNode[] = [];
  private nodeMap: Map<string, HTMLElement> = new Map();
  private selectedNode: AccessibilityNode|null = null;

  constructor() {
    super();
    this.addEventListener('keydown', this.onKeyDown.bind(this));
    this.addEventListener('focus', this.onFocus.bind(this));
  }

  set data(data: AccessibilityTreeData) {
    this.node = data.node;
    this.shadow.host.setAttribute('role', 'tree');
    this.render();
  }

  set selectedAXNode(node: AccessibilityNode) {
    this.selectedNode = node;
  }

  private onFocus(): void {
    const axNode = this.shadow.querySelector('devtools-accessibility-node');
    if (axNode && axNode.shadowRoot) {
      const wrapper = axNode.shadowRoot.querySelector('.wrapper') as HTMLElement;
      if (wrapper) {
        // console.log(wrapper);
        // // this.setFocus(wrapper);
        // wrapper.focus();
        // console.log(wrapper.hasFocus());
      }
    }
  }

  setFocus(node: HTMLElement) {
    node.focus();
  }

  appendToNodeList(node: AccessibilityNode): void {
    this.nodeList.push(node);
  }

  appendToNodeMap(id: string, node: AccessibilityNode): void {
    this.nodeMap.set(id, node);
  }

  private onKeyDown(e: KeyboardEvent): void {
    // this.focus();
    switch(e.key) {
      case 'ArrowUp':
        console.log('arrow up');
        break;
      case 'ArrowDown':
        console.log('arrow down');
        break;

      case 'ArrowLeft':
        this.leftArrowPress();
        break;
      case 'ArrowRight':
        this.rightArrowPress();
        break;

      case 'Home':
        console.log('home');
        break;
      case 'End':
        console.log('end');
        break;
      case 'Enter':
        console.log('enter');
        break;
      default:
        return;
    }
  }

  private leftArrowPress(): void {
    console.log('arrow left');
    if (!this.selectedNode || !this.selectedNode.axID) {
      return;
    }

    const nodeElement = this.nodeMap.get(this.selectedNode.axID);
    if (!nodeElement) {
      return;
    }

    nodeElement.focus();
    if (nodeElement.classList.contains('expanded')) {
      nodeElement.classList.remove('expanded');
    } else {
      // move focus to parent node
    }
  }

  private rightArrowPress(): void {
    console.log('arrow right');
    if (!this.selectedNode || !this.selectedNode.axID) {
      return;
    }

    const nodeElement = this.nodeMap.get(this.selectedNode.axID);
    if (!nodeElement) {
      return;
    }

    nodeElement.focus();
    if (!nodeElement.classList.contains('expanded')) {
      nodeElement.classList.add('expanded');
    } else {
      // move focus to first child 
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

      // clang-format off
      const output = LitHtml.html`
        <devtools-accessibility-node .data=${{
          axNode: SDKNodeToAXNode(null, rootNode),
          axTree: this,
          } as AccessibilityNodeData}>
        </devtools-accessibility-node>
        `;
      // clang-format on
      LitHtml.render(output, this.shadow);

      console.log(this.nodeMap);
      const root = this.nodeMap.values().next().value; // first AccessibilityNode in map 
      const wrapper = root.shadow.querySelector('.wrapper');
      console.log(wrapper);
      wrapper.focus();

      // this.onFocus();
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
