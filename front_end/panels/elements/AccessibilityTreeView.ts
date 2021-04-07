// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import * as Components from '../../ui/components/components.js';
import * as UI from '../../ui/ui.js';

import {accessibilityNodeRenderer, AXTreeNode, sdkNodeToAXTreeNode} from './AccessibilityTreeUtils.js';

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly accessibilityTreeComponent =
      new Components.TreeOutline.TreeOutline<SDK.AccessibilityModel.AccessibilityNode>();
  private treeData: AXTreeNode[] = [];
  private readonly toggleButton: HTMLButtonElement;
  private accessibilityModel: SDK.AccessibilityModel.AccessibilityModel|null = null;
  private sdkNodeToTreeNode = new Map<SDK.AccessibilityModel.AccessibilityNode, AXTreeNode>();
  private rootNode : SDK.AccessibilityModel.AccessibilityNode|null = null;
  private accessibilityModelNeedsUpdating: boolean = false;
  private selectedDOMNode: SDK.DOMModel.DOMNode|null = null;

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
      const evt = event as Components.TreeOutline.ItemSelectedEvent<SDK.AccessibilityModel.AccessibilityNode>;
      const axNode = evt.data.node.treeNodeData;
      if (!axNode.isDOMNode()) {
        return;
      }
      const deferredNode = axNode.deferredDOMNode();
      if (deferredNode) {
        deferredNode.resolve(domNode => {
          Common.Revealer.reveal(domNode, true /* omitFocus */);
        });
      }

      // Highlight the node as well, for keyboard navigation.
      evt.data.node.treeNodeData.highlightDOMNode();
    });

    this.accessibilityTreeComponent.addEventListener('itemmouseover', (event: Event) => {
      const evt = event as Components.TreeOutline.ItemMouseOverEvent<SDK.AccessibilityModel.AccessibilityNode>;
      evt.data.node.treeNodeData.highlightDOMNode();
    });

    this.accessibilityTreeComponent.addEventListener('itemmouseout', () => {
      SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    });
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

    this.rootNode = root;
    this.treeData = [sdkNodeToAXTreeNode(this.sdkNodeToTreeNode, this.rootNode)];

    this.accessibilityTreeComponent.data = {
      defaultRenderer: (node): LitHtml.TemplateResult => accessibilityNodeRenderer(node),
      tree: this.treeData,
    };

    this.accessibilityTreeComponent.expandRecursively(0);
  }

  async loadSubTreeIntoAccessibilityModel(selectedNode: SDK.DOMModel.DOMNode) : Promise<void> {
    if (!this.accessibilityModel) {
      return;
    }

    // We already have the root + 3 levels of tree loaded into the model (guaranteed, I think)
    // We just need to request the missing subtree from the existing part of the tree to the
    // currently inspected node.
    const inspectedAXNode = await this.accessibilityModel.requestAndLoadSubTreeToNode(selectedNode);

    if (!inspectedAXNode) {
      return;
    }

    // There is a chance we might have already loaded this node into the tree, if so there should
    // be an entry in this map, and we can just expand the tree to
    let treeNode = this.sdkNodeToTreeNode.get(inspectedAXNode) || null;
    if (treeNode) {
      this.accessibilityTreeComponent.expandToAndSelectTreeNode(treeNode);
    }

    // Build a tree node for this thing, make sure it's appended into the existing tree data.
    treeNode = sdkNodeToAXTreeNode(this.sdkNodeToTreeNode, inspectedAXNode);

    if (!treeNode) {
      // something went wrong.
      return;
    }

    this.accessibilityTreeComponent.expandToAndSelectTreeNode(treeNode);
  }

  async selectedNodeChanged(inspectedNode: SDK.DOMModel.DOMNode): Promise<void> {
    this.selectedDOMNode = inspectedNode;
    await this.loadSubTreeIntoAccessibilityModel(inspectedNode);
  }
}
