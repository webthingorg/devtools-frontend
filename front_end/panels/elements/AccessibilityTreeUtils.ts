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
      // numChildren stores the number of child nodes that the backend node has, i.e the
      // "real" number of children. The children array contains only nodes that have been
      // loaded into the model. If these two numbers match, the children are already loaded.
      // and we either create the AXTreeData struct for each child node, or return the cached
      // AXTreeData from the last time the children method was called.
      if (node.numChildren() === node.children().length) {
        return Promise.resolve(node.children().map(child => {
          // If we have already requested this child, don't re-request.
          // TODO(meredithl): allow for subtrees to be updated once the tree has
          // been made live.
          const cachedChild = nodeMap.get(child);
          if (cachedChild) {
            return cachedChild;
          }
          const axTreeChild = sdkNodeToAXTreeNode(child, nodeMap);
          return axTreeChild;
        }));
      }

      // This nodes children have not been loaded into the model, so we first request
      // them from the backend.
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
