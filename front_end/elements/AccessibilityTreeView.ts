// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// import {AccessibilitySidebarView} from '../accessibility/AccessibilitySidebarView.js';  // eslint-disable-line no-unused-vars
// import { AccessibilityNode } from 'front_end/sdk/AccessibilityModel.js';
// import {Accessibility} from 'front_end/third_party/puppeteer/package/lib/esm/puppeteer/api-docs-entry.js';
import * as SDK from '../sdk/sdk.js';
// import * as LitHtml from '../third_party/lit-html/lit-html.js'; // commented for cl upload check
import * as UI from '../ui/ui.js';

// interface AccessibilityNode {
//   node: Protocol.Accessibility.AXNode;
//   children: Protocol.Accessibility.AXNode[];
//   parent: Protocol.Accessibility.AXNode | null;
// }

export interface AccessibilityTreeData {
  rootNode: Protocol.Accessibility.AXNode|null;  // {nodes: Protocol.Accessibility.AXNode[];} | undefined;
  nodeMap: Map<string, Protocol.Accessibility.AXNode|null>|
      {};  // {nodeId: string, node: Protocol.Accessibility.AXNode | null};
  axNode: string;
}

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly treeView = new AccessibilityTree();
  private readonly toggleButton: HTMLButtonElement;
  private node: SDK.DOMModel.DOMNode|null = null;
  private nodeText: string;
  private rootNode: Protocol.Accessibility.AXNode|
      null;  // {nodes: Protocol.Accessibility.AXNode[];} | undefined = {nodes:[]};
  private nodeMap: Map<string, Protocol.Accessibility.AXNode|null>|{} = {};
  // {nodeId: string, node: Protocol.Accessibility.AXNode | null} = {nodeId: '-1', node: null};

  constructor(toggleButton: HTMLButtonElement) {
    super();
    this.toggleButton = toggleButton;
    this.nodeText = 'bread';
    this.rootNode = null;  // {nodes:[]};
    this.contentElement.appendChild(this.toggleButton);
    // this.contentElement.appendChild(this.nodeText);
    this.contentElement.appendChild(this.treeView);
  }

  setNode(node: SDK.DOMModel.DOMNode): void {
    this.node = node;
    this.refreshAccessibilityTree();
  }

  private async refreshAccessibilityTree(): Promise<void> {
    this.treeView.data = {
      // message: 'hello world',
      rootNode: this.rootNode,
      nodeMap: this.nodeMap,
      axNode: this.nodeText,
    };

    // AccessibilitySidebarView.doUpdate();
    if (!this.node) {
      return;
    }

    const accessibilityModel = this.node.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
    if (!accessibilityModel) {
      return;
    }

    // console.log("requesting Full AXTree...");
    const result = await accessibilityModel.requestFullAXTree();
    // console.log(result);
    if (!result) {
      return;
    }

    if (result.nodes) {
      this.rootNode = this.getRootNode(result.nodes);
    }

    // for (let i = 0; i < result.nodes.length; i++) {
    //   let nodeName = result.nodes[i].name;
    //   if (nodeName && nodeName.value) {
    //     // console.log(nodeName.value);
    //     this.nodeText = this.nodeText.concat(" " + nodeName.value);
    //   }
    // }

    // for inspecting single node
    // console.log("requesting callback...");
    // this.accessibilityNodeCallback(accessibilityModel.axNodeForDOMNode(this.node));
  }

  accessibilityNodeCallback(axNode: SDK.AccessibilityModel.AccessibilityNode|null): void {
    if (!axNode) {
      return;
    }

    if (axNode.isDOMNode()) {
      // display on panel
      const axNodeName = axNode._name;
      if (axNodeName && axNodeName.value) {
        // console.log(axNodeName.value);
        this.nodeText = axNodeName.value;
      }
    }
  }

  getRootNode(result: Protocol.Accessibility.AXNode[]): Protocol.Accessibility.AXNode|null {
    // const nodeMap = new Map<string, Protocol.Accessibility.AXNode | null>();
    const nodeMap = new Map();
    for (const node of result) {
      // const axNode: Protocol.Accessibility.AXNode = result[0]; //AccessibilityNode = {node: node, children:[], parent: null};
      // nodeMap.set(node.nodeId, axNode);
      nodeMap.set(node.nodeId, node);
    }

    // for (const childId of node.childIds || []) {
    for (const [, node] of nodeMap.entries()) {
      if (!node) {
        return null;
      }
      node.children = [];
      if (node.childIds) {
        for (const childId of node.childIds) {
          const child = nodeMap.get(childId);
          if (!child) {
            continue;
          }
          child.parent = node;
          node.children.push(child);
        }
      }
    }

    this.nodeMap = nodeMap;
    const rootNodeAxID = result[0].nodeId;
    const rootNode = nodeMap.get(rootNodeAxID);
    return rootNode;
  }

  wasShown(): void {
    this.refreshAccessibilityTree();
  }

  willHide(): void {
    // TODO (annabelzhou): register with a11y model
  }
}

export class AccessibilityTree extends HTMLElement {
  // create shadow root
  private readonly shadow = this.attachShadow({mode: 'open'});
  // private message: string = '';
  private axNode: string = '';
  private rootNode: Protocol.Accessibility.AXNode|null =
      null;  // {nodes: Protocol.Accessibility.AXNode[];} | undefined = {nodes:[]};
  // private nodeMap: {nodeId: string, node: Protocol.Accessibility.AXNode | null} = {nodeId: '-1', node: null};
  private nodeMap: Map<string, Protocol.Accessibility.AXNode|null>|{} = {};

  set data(data: AccessibilityTreeData) {
    // this.message = data.message;
    this.rootNode = data.rootNode;
    this.axNode = data.axNode;
    this.nodeMap = data.nodeMap;
    this.render();
  }

  traverse(parent: HTMLUListElement, node: Protocol.Accessibility.AXNode): void {
    const li = document.createElement('li');
    if (node && node.role) {
      li.innerText = node.role.value;
      // console.log(node.role.value); // commented for cl upload check
    }
    parent.appendChild(li);
    this.shadow.appendChild(parent);

    if (!node.children) {
      return;
    }

    // base case
    if (node.children.length < 1) {
      // console.log('returning!');
      return;
    }

    // recursive case
    const ul = document.createElement('ul');
    // console.log(node.children);

    for (const child of node.children.values()) {
      // console.log('child', child);
      this.traverse(ul, child);
    }

    // for (let childID in node.childIds) {
    // let child = this.nodeMap.get(childID); // don't need map anymore?
    // this.traverse(ul, child);
    // }
  }

  private render(): void {
    // console.log('nodeMap', this.nodeMap); // commented for cl upload check
    // console.log('rootnode', this.rootNode);
    if (!this.rootNode) {
      return;
    }

    const parent = document.createElement('ul');
    this.traverse(parent, this.rootNode);
    this.shadow.appendChild(parent);

    // prints each node into the panel as a new div
    // for (let i = 0; i < this.rootNode.length; i++) {
    //   let nodeRole = this.axNodes[i].role;
    //   if (nodeName && nodeName.value) {
    //     console.log(nodeName.value);
    //     let div = document.createElement('div');
    //     div.innerText = nodeName.value;
    //     this.shadow.appendChild(div);
    //   }
    // }
    //   let hasChild = this.axNodes[i].childIds;
    //   let ul = document.createElement('ul');
    //   if (hasChild) {
    //     console.log(hasChild);
    //     if (nodeRole) {
    //       let li = document.createElement('li');
    //       li.innerText = nodeRole.value;
    //       ul.appendChild(li);
    //     }
    //   }
    //   this.shadow.appendChild(ul);
    // }

    // console.log(this.axNodes);

    // clang-format off
    // const output = LitHtml.html`<p>${this.axNode}</p>`;
    // // clang-format on
    // LitHtml.render(output, this.shadow);
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
