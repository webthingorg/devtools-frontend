// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../../ui/components/tree_outline/tree_outline.js';

import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
import * as TreeOutline from '../../ui/components/tree_outline/tree_outline.js';

export type AXTreeNode = TreeOutline.TreeOutlineUtils.TreeNode<SDK.AccessibilityModel.AccessibilityNode>;


const UIStrings = {
  /**
  *@description Ignored node element text content in Accessibility Tree View of the Elements panel
  */
  ignored: 'Ignored',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/AccessibilityTreeUtils.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export function sdkNodeToAXTreeNode(
    node: SDK.AccessibilityModel.AccessibilityNode,
    nodeMap: Map<SDK.AccessibilityModel.AccessibilityNode, AXTreeNode>): AXTreeNode {
  if (!node.numChildren()) {
    const leafTreeNode = {
      treeNodeData: node,
      id: node.id(),
    };

    nodeMap.set(node, leafTreeNode);
    return leafTreeNode;
  }

  const treeNode = {
    treeNodeData: node,
    children: async(): Promise<AXTreeNode[]> => {
      if (node.numChildren() === node.children().length) {
        return Promise.resolve(node.children().map(child => {
          const cachedChild = nodeMap.get(child);
          if (cachedChild) {
            return cachedChild;
          }
          const axTreeChild = sdkNodeToAXTreeNode(child, nodeMap);
          return axTreeChild;
        }));
      }
      // numChildren returns the number of children that this node has, whereas node.children()
      // returns only children that have been loaded. If these two don't match, that means that
      // there are backend children that need to be loaded into the model, so request them now.
      await node.accessibilityModel().requestAXChildren(node.id());

      const treeNodeChildren: AXTreeNode[] = [];

      for (const child of node.children()) {
        treeNodeChildren.push(sdkNodeToAXTreeNode(child, nodeMap));
      }

      return Promise.resolve(treeNodeChildren);
    },
    id: node.id(),
  };
  nodeMap.set(node, treeNode);
  return treeNode;
}

// This function is a variant of setTextContentTruncatedIfNeeded found in DOMExtension.
function truncateTextIfNeeded(text: string): string {
  const maxTextContentLength = 10000;

  if (text.length > maxTextContentLength) {
    return Platform.StringUtilities.trimMiddle(text, maxTextContentLength);
  }
  return text;
}

function ignoredNodeTemplate(): LitHtml.TemplateResult[] {
  const nodeContent: LitHtml.TemplateResult[] = [];
  nodeContent.push(LitHtml.html`<span class='monospace ignored-node'>${i18nString(UIStrings.ignored)}</span>`);
  return nodeContent;
}

function unignoredNodeTemplate(node: SDK.AccessibilityModel.AccessibilityNode): LitHtml.TemplateResult[] {
  const nodeContent: LitHtml.TemplateResult[] = [];

  // All unignored nodes must have a role.
  const role = node.role();
  if (!role) {
    nodeContent.push(LitHtml.html``);
    return nodeContent;
  }

  const roleElement = LitHtml.html`<span class='monospace'>${truncateTextIfNeeded(role.value || '')}</span>`;
  nodeContent.push(LitHtml.html`${roleElement}`);

  // Not all nodes have a name, however.
  const name = node.name();
  if (name) {
    nodeContent.push(LitHtml.html`<span class='separator'>\xA0</span>`);
    nodeContent.push(LitHtml.html`<span class='ax-readable-string'>"${name.value}"</span>`);
  }
  return nodeContent;
}

export function accessibilityNodeRenderer(node: AXTreeNode): LitHtml.TemplateResult {
  let nodeContent: LitHtml.TemplateResult[];
  const axNode = node.treeNodeData;

  if (axNode.ignored()) {
    nodeContent = ignoredNodeTemplate();
  } else {
    nodeContent = unignoredNodeTemplate(axNode);
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
