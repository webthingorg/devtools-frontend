// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';

type AXTreeNode = UIComponents.TreeOutlineUtils.TreeNode<AXNode>;

export interface AXNode {
  id: string;
  role: string|null;
  name: string|null;
  ignored: boolean;
  parent: AXNode|null;
  hasChildren: () => boolean;
  children: () => Promise<AXNode[]>;
  axTree: UIComponents.TreeOutline.TreeOutline<AXNode>|null;
  highlightNode: () => void;
  clearHighlight: () => void;
}

export function sdkNodeToAXNode(
    parent: AXNode|null, sdkNode: SDK.AccessibilityModel.AccessibilityNode,
    tree: UIComponents.TreeOutline.TreeOutline<AXNode>): AXNode {
  let axChildren: AXNode[] = [];
  const axNode = {
    id: sdkNode.id(),
    role: sdkNode.role()?.value,
    name: sdkNode.name()?.value,
    ignored: sdkNode.ignored(),
    parent: parent,
    axTree: tree,
    hasChildren: (): boolean => Boolean(sdkNode.numChildren()),
    // TODO: Remove next line once crbug.com/1177242 is solved.
    // eslint-disable-next-line @typescript-eslint/space-before-function-paren
    children: async(): Promise<AXNode[]> => {
      // sdkNode.numChildren() returns the true number of children that exist in the
      // backend whereas axChildren contains only nodes that have been fetched by the frontend.
      // If the number of local children is different from the number of children known
      // to the backend, we load the children and expect the numbers to match.
      if (sdkNode.numChildren() !== axChildren.length) {
        const children = await sdkNode.accessibilityModel().requestAXChildren(sdkNode.id());
        axChildren = (children || []).map(child => sdkNodeToAXNode(axNode, child, tree));
        if (axChildren.length !== sdkNode.numChildren()) {
          throw new Error('Unexpected: actual and expected number of child nodes is different');
        }
      }
      return axChildren;
    },
    highlightNode: (): void => sdkNode.highlightDOMNode(),
    clearHighlight: (): void => SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight(),
  };
  return axNode;
}

export function axNodeToAXTreeNode(node: AXNode): AXTreeNode {
  if (!node.hasChildren()) {
    return {
      treeNodeData: node,
    };
  }

  return {
    treeNodeData: node,
    children: async(): Promise<AXTreeNode[]> => {
      const children = await node.children();
      const treeNodeChildren = (children || []).map(child => axNodeToAXTreeNode(child));
      return Promise.resolve(treeNodeChildren);
    },
  };
}

// This function is a variant of setTextContentTruncatedIfNeeded found in DOMExtension.
function truncateTextIfNeeded(text: string): string {
  const maxTextContentLength = 10000;

  if (text.length > maxTextContentLength) {
    return Platform.StringUtilities.trimMiddle(text, maxTextContentLength);
  }
  return text;
}

export function accessibilityNodeRenderer(node: UIComponents.TreeOutlineUtils.TreeNode<AXNode>):
    LitHtml.TemplateResult {
  // Left in for ease of reaching this file when doing DT on DT debugging
  console.log('whut');
  const nodeContent: LitHtml.TemplateResult[] = [];
  const axNode = node.treeNodeData;

  const role = axNode.role;
  if (!role) {
    return LitHtml.html``;
  }

  const roleElement = LitHtml.html`<span class='monospace'>${truncateTextIfNeeded(role || '')}</span>`;
  nodeContent.push(LitHtml.html`${roleElement}`);

  const name = axNode.name;
  if (name) {
    nodeContent.push(LitHtml.html`<span class='separator'>\xA0</span>`);
    nodeContent.push(LitHtml.html`<span class='ax-readable-string'>"${name}"</span>`);
  }

  return LitHtml.html`
      <style>
          .ax-readable-string {
            font-style: italic;
          }

          .monospace {
            font-family: var(--monospace-font-family);
            font-size: var(--monospace-font-size);
          }
      </style>
      ${nodeContent}
      `;
}
