// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {AccessibilityTree} from './AccessibilityTree.js';

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly treeView = new AccessibilityTree();
  private readonly toggleButton: HTMLButtonElement;
  private node: SDK.DOMModel.DOMNode|null = null;
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null;

  constructor(toggleButton: HTMLButtonElement) {
    super();
    // toggleButton is bound to a click handler on ElementsPanel to switch between the DOM tree
    // and accessibility tree views.
    this.toggleButton = toggleButton;
    this.contentElement.appendChild(this.toggleButton);
    this.contentElement.appendChild(this.treeView);
    this.rootNode = null;
  }

  setNode(node: SDK.DOMModel.DOMNode): void {
    this.node = node;
    this.refreshAccessibilityTree();
  }

  private async refreshAccessibilityTree(): Promise<void> {
    if (!this.node) {
      return;
    }

    const accessibilityModel = this.node.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
    if (!accessibilityModel) {
      return;
    }

    const result = await accessibilityModel.requestFullAXTree();
    if (!result) {
      return;
    }
    this.rootNode = result;

    this.treeView.data = {
      rootNode: this.rootNode,
    };
  }
}

/* This class acts as a logical wrapping of behaviours around the presentation of an accessibility
 * node in the tree to show the correct display information and styling.
 * TODO(annabelzhou): Consider converting this to a Web Component.
 */
export class AccessibilityNode {
  private axNode: SDK.AccessibilityModel.AccessibilityNode|null = null;
  private role: Protocol.Accessibility.AXValue|null = null;
  private name: string = '';
  private element: HTMLElement;
  private wrapper: HTMLSpanElement;

  constructor(node: SDK.AccessibilityModel.AccessibilityNode) {
    this.axNode = node;
    this.role = this.axNode.role();
    const name = this.axNode.name();
    if (name) {
      this.name = name.value;
    }
    this.element = document.createElement('summary');
    this.element.classList.add('full-tree-node');
    this.element.classList.add('ax-node');
    this.wrapper = document.createElement('span');
    this.wrapper.classList.add('wrapper');
    this.element.appendChild(this.wrapper);

    if (this.axNode.ignored()) {
      this.appendIgnoredElement();
    } else {
      this.appendRoleElement();
      const axNodeName = this.axNode.name();
      if (axNodeName) {
        this.wrapper.createChild('span', 'separator').textContent = '\xA0';
        this.appendNameElement();
      }
    }

    if (this.axNode.numChildren() < 1) {
      this.element.classList.add('no-children');
    }

    if (this.axNode.hasOnlyUnloadedChildren()) {
      this.wrapper.classList.add('children-unloaded');
      this.getChildAXNodes();
    }

    if (!this.axNode.isDOMNode) {
      this.wrapper.classList.add('no-dom-node');
    }
  }

  async getChildAXNodes(): Promise<void> {
    if (this.axNode) {
      const children = await this.axNode.accessibilityModel().requestAXChildren(this.axNode._id);
      if (!children) {
        return;  // always true while getChildAXNodes only returning null
      }
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  appendRoleElement(): void {
    if (!this.role) {
      return;
    }

    const roleElement = document.createElement('span');
    roleElement.innerText = this.role.value;
    roleElement.classList.add('monospace');
    roleElement.setTextContentTruncatedIfNeeded(this.role.value || '');
    this.wrapper.appendChild(roleElement);
  }

  appendNameElement(): void {
    const nameElement = document.createElement('span');
    if (this.name) {
      nameElement.textContent = '"' + this.name + '"';
    }
    nameElement.classList.add('ax-readable-string');
    this.wrapper.appendChild(nameElement);
  }

  appendIgnoredElement(): void {
    const ignoredNodeElement = document.createElement('span');
    ignoredNodeElement.classList.add('monospace');
    ignoredNodeElement.textContent = ls`Ignored`;
    ignoredNodeElement.classList.add('full-tree-node-ignored-node');
    this.wrapper.appendChild(ignoredNodeElement);
  }
}
