// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';

export interface AccessibilityTreeData {
  rootNode: SDK.AccessibilityModel.AccessibilityNode|null;
}

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly treeView = new AccessibilityTree();
  private readonly toggleButton: HTMLButtonElement;
  private node: SDK.DOMModel.DOMNode|null = null;
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null;

  constructor(toggleButton: HTMLButtonElement) {
    super();
    this.toggleButton = toggleButton;
    this.contentElement.appendChild(this.toggleButton);
    this.contentElement.appendChild(this.treeView);
    this.rootNode = null;
  }

  setNode(node: SDK.DOMModel.DOMNode): void {
    this.node = node;
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

  wasShown(): void {
    this.refreshAccessibilityTree();
  }

  willHide(): void {
  }
}

export class AccessibilityTree extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null = null;

  set data(data: AccessibilityTreeData) {
    this.rootNode = data.rootNode;
    this.render();
  }

  appendNodeElement(parent: HTMLDetailsElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    const nodeElement = new AccessibilityNode(parent, node);
    if (!nodeElement) {
      return;
    }
  }

  traverse(parent: HTMLDetailsElement, node: SDK.AccessibilityModel.AccessibilityNode): void {
    if (node) {
      this.appendNodeElement(parent, node);
    }

    // base case
    if (node.numChildren() < 1) {
      return;
    }

    // recursive case
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

      .ax-breadcrumbs-ignored-node {
        font-style: italic;
        opacity: 70%;
      }

      .ax-breadcrumbs {
        padding-top: 1px;
        margin: 0;
        position: relative;
      }

      .ax-breadcrumbs .ax-node {
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

      .ax-breadcrumbs .ax-node span {
        flex-shrink: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ax-breadcrumbs .ax-node .wrapper {
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

export class AccessibilityNode {
  private parent: HTMLDetailsElement;
  private axNode: SDK.AccessibilityModel.AccessibilityNode|null = null;
  private role: Protocol.Accessibility.AXValue|null = null;
  private name: string = '';
  private element: HTMLElement;
  private wrapper: HTMLSpanElement;

  constructor(parent: HTMLDetailsElement, node: SDK.AccessibilityModel.AccessibilityNode) {
    this.parent = parent;
    this.axNode = node;
    this.role = this.axNode.role();
    const name = this.axNode.name();
    if (name) {
      this.name = name.value;
    }
    this.element = document.createElement('summary');
    this.element.classList.add('ax-breadcrumbs');
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
    }

    if (!this.axNode.isDOMNode) {
      this.wrapper.classList.add('no-dom-node');
    }
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
    this.parent.appendChild(this.element);
  }

  appendIgnoredElement(): void {
    const ignoredNodeElement = document.createElement('span');
    ignoredNodeElement.classList.add('monospace');
    ignoredNodeElement.textContent = ls`Ignored`;
    ignoredNodeElement.classList.add('ax-breadcrumbs-ignored-node');
    this.wrapper.appendChild(ignoredNodeElement);
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
