// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../../ui/components/tree_outline/tree_outline.js';

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import * as TreeOutline from '../../ui/components/tree_outline/tree_outline.js';
import * as UI from '../../ui/legacy/legacy.js';

import {accessibilityNodeRenderer, AXTreeNode, sdkNodeToAXTreeNode} from './AccessibilityTreeUtils.js';

function shouldInspectRootWebArea(node: SDK.DOMModel.DOMNode): boolean {
  switch (node.nodeName()) {
    case 'BODY':
    case 'HEAD':
    case 'HTML':
      return true;
    default:
      return false;
  }
}

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly accessibilityTreeComponent =
      new TreeOutline.TreeOutline.TreeOutline<SDK.AccessibilityModel.AccessibilityNode>();
  private treeData: AXTreeNode[] = [];
  private readonly toggleButton: HTMLButtonElement;
  private accessibilityModel: SDK.AccessibilityModel.AccessibilityModel|null = null;
  private selectedTreeNode: AXTreeNode|null = null;
  private inspectedDOMNode: SDK.DOMModel.DOMNode|null = null;

  // Ignored nodes appear only when inspected, when another node is selected, it needs to be removed.
  // This variable keeps track of the last inspected node that needs to be removed.
  private ignoredNodePendingRemoval: SDK.AccessibilityModel.AccessibilityNode|null = null;
  private axNodeToTreeNode: Map<SDK.AccessibilityModel.AccessibilityNode, AXTreeNode> = new Map();

  constructor(toggleButton: HTMLButtonElement) {
    super();
    // toggleButton is bound to a click handler on ElementsPanel to switch between the DOM tree
    // and accessibility tree views.
    this.toggleButton = toggleButton;
    this.contentElement.appendChild(this.toggleButton);
    this.contentElement.appendChild(this.accessibilityTreeComponent);

    // The DOM tree and accessibility are kept in sync as much as possible, so
    // on node selection, update the currently inspected node and reveal in the
    // DOM tree.
    this.accessibilityTreeComponent.addEventListener('itemselected', (event: Event) => {
      const evt = event as TreeOutline.TreeOutline.ItemSelectedEvent<SDK.AccessibilityModel.AccessibilityNode>;
      const axNode = evt.data.node.treeNodeData;
      if (!axNode.isDOMNode()) {
        return;
      }

      const deferredNode = axNode.deferredDOMNode();
      if (deferredNode) {
        deferredNode.resolve(domNode => {
          if (!domNode) {
            return;
          }
          if (domNode.nodeName() === '#document') {
            return;
          }

          while (domNode.nodeType() !== Node.ELEMENT_NODE && domNode.parentNode) {
            domNode = domNode.parentNode;
          }

          this.inspectedDOMNode = domNode;
          if (this.ignoredNodePendingRemoval) {
            this.removeIgnoredNode();
            this.accessibilityTreeComponent.data = {
              defaultRenderer: (node): LitHtml.TemplateResult => accessibilityNodeRenderer(node),
              tree: this.treeData,
            };
          }

          if (axNode.ignored()) {
            this.ignoredNodePendingRemoval = axNode;
          }
          Common.Revealer.reveal(domNode, true /* omitFocus */);
        });
      }

      // Highlight the node as well, for keyboard navigation.
      evt.data.node.treeNodeData.highlightDOMNode();
    });

    this.accessibilityTreeComponent.addEventListener('itemmouseover', (event: Event) => {
      const evt = event as TreeOutline.TreeOutline.ItemMouseOverEvent<SDK.AccessibilityModel.AccessibilityNode>;
      evt.data.node.treeNodeData.highlightDOMNode();
    });

    this.accessibilityTreeComponent.addEventListener('itemmouseout', () => {
      SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    });
  }

  wasShown(): void {
    // We don't want to clear the ignored node when swapping between the DOM tree and a11y tree,
    // as when we expand to the selected node, the ItemSelectedEvent will fire and it will
    // immediately remove the currently inspected and ignored node.
    if (this.ignoredNodePendingRemoval) {
      this.ignoredNodePendingRemoval = null;
    }
    if (this.selectedTreeNode) {
      this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.selectedTreeNode);
    }
  }

  setAccessibilityModel(model: SDK.AccessibilityModel.AccessibilityModel|null): void {
    this.accessibilityModel = model;
    this.refreshAccessibilityTree();
  }

  async refreshAccessibilityTree(): Promise<void> {
    if (!this.accessibilityModel) {
      return;
    }

    const root = await this.accessibilityModel.requestRootNode();
    if (!root) {
      return;
    }

    this.treeData = [sdkNodeToAXTreeNode(root, this.axNodeToTreeNode)];

    this.accessibilityTreeComponent.data = {
      defaultRenderer: (node): LitHtml.TemplateResult => accessibilityNodeRenderer(node),
      tree: this.treeData,
    };

    this.accessibilityTreeComponent.expandRecursively(2);
    this.selectedTreeNode = this.treeData[0];
  }

  private async inspectRootNode(): Promise<void> {
    this.selectedTreeNode = this.treeData[0];
    const deferredDOMNode = this.selectedTreeNode.treeNodeData.deferredDOMNode();
    if (deferredDOMNode) {
      deferredDOMNode.resolvePromise().then(node => {
        this.inspectedDOMNode = node;
      });
    }

    this.accessibilityTreeComponent.data = {
      defaultRenderer: (node): LitHtml.TemplateResult => accessibilityNodeRenderer(node),
      tree: this.treeData,
    };

    this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.selectedTreeNode);
  }

  // Given a selected DOM node, asks the model to load the missing subtree from the root to the
  // selected node and then re-renders the tree.
  private async loadSubTreeIntoAccessibilityModel(selectedNode: SDK.DOMModel.DOMNode): Promise<void> {
    if (!this.accessibilityModel) {
      return;
    }

    this.inspectedDOMNode = selectedNode;
    if (!this.inspectedDOMNode) {
      return;
    }

    // If this node has been loaded previously, the accessibility tree will return it's cached node.
    // Eventually we'll need some mechanism for forcing it to fetch a new node when we are subscribing
    // for updates, but TBD later.
    // EG for a backend tree like:
    //
    // A*
    //   B
    //     C
    //   D
    //     E
    // Where only A is already loaded into the model, calling requestAndLoadSubTreeToNode(C) will
    // load [A, B, D, C] into the model, and return C.
    const inspectedAXNode = await this.accessibilityModel.requestAndLoadSubTreeToNode(this.inspectedDOMNode);
    if (!inspectedAXNode) {
      return;
    }

    const cachedTreeNode = this.axNodeToTreeNode.get(inspectedAXNode);
    if (cachedTreeNode) {
      this.selectedTreeNode = cachedTreeNode;
    } else {
      this.selectedTreeNode = sdkNodeToAXTreeNode(inspectedAXNode, this.axNodeToTreeNode);
    }

    this.accessibilityTreeComponent.data = {
      defaultRenderer: (node): LitHtml.TemplateResult => accessibilityNodeRenderer(node),
      tree: this.treeData,
    };

    this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.selectedTreeNode);
  }

  // If the last inspected node was ignored, we need to remove it from both the AccessibilityModel
  // and from the AXTreeOutline, making sure it's parent chain is maintained and has the correct
  // children.
  private removeIgnoredNode(): void {
    if (!this.ignoredNodePendingRemoval) {
      return;
    }

    if (!this.accessibilityModel) {
      return;
    }

    this.accessibilityModel.removeIgnoredNode(this.ignoredNodePendingRemoval);

    // TODO(meredithl): Notify the tree outline component that children have changed for this
    // parent node.
    const axNodeParent = this.ignoredNodePendingRemoval.parentNode();
    if (axNodeParent) {
      axNodeParent.removeIgnoredChildId(this.ignoredNodePendingRemoval.id());
    }

    this.axNodeToTreeNode.delete(this.ignoredNodePendingRemoval);
    this.ignoredNodePendingRemoval = null;
  }

  // Selected node in the DOM has changed, and the corresponding accessibility node may be
  // unloaded. We probably only want to do this when the AccessibilityTree is visible.
  async selectedNodeChanged(inspectedNode: SDK.DOMModel.DOMNode): Promise<void> {
    // These nodes require a special case, as they don't have an unignored node in the
    // accessibility tree. Someone inspecting these in the DOM is probably expecting to
    // be focused on the root WebArea of the accessibility tree.
    if (shouldInspectRootWebArea(inspectedNode)) {
      this.inspectRootNode();
      return;
    }

    // No-op.
    if (this.inspectedDOMNode === inspectedNode) {
      return;
    }

    await this.loadSubTreeIntoAccessibilityModel(inspectedNode);
  }
}
