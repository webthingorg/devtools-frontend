// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../i18n/i18n.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';

type AXTreeNode = UIComponents.TreeOutlineUtils.TreeNode<SDK.AccessibilityModel.AccessibilityNode>;

const UIStrings = {
  /**
  *@description Ignored node element text content in Accessibility tree outline of the Elements panel
  */
  ignored: 'Ignored',
};
const str_ = i18n.i18n.registerUIStrings('elements/AccessibilityTreeUtils.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);


export function sdkNodeToAXTreeNode(node: SDK.AccessibilityModel.AccessibilityNode): AXTreeNode {
  if (!node.numChildren()) {
    return {
      treeNodeData: node,
    };
  }

  return {
    treeNodeData: node,
    children: async(): Promise<AXTreeNode[]> => {
      let children: SDK.AccessibilityModel.AccessibilityNode[] = node.children() || [];
      if (node.numChildren() !== children.length) {
        children = await node.accessibilityModel().requestAXChildren(node.id());
      }
      const treeNodeChildren = (children || []).map(child => sdkNodeToAXTreeNode(child));
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

export function accessibilityNodeRenderer(
    node: UIComponents.TreeOutlineUtils.TreeNode<SDK.AccessibilityModel.AccessibilityNode>): LitHtml.TemplateResult {
  const templateResult: LitHtml.TemplateResult[] = [];
  const axNode = node.treeNodeData;

  // TODO(meredithl): Ignored nodes (and their potential children) to be handled in the future.
  if (axNode.ignored()) {
    templateResult.push(LitHtml.html`<span class='monospace ignored-node'>${i18nString(UIStrings.ignored)}</span>`);
  } else {
    const role = axNode.role();
    if (!role) {
      return LitHtml.html``;
    }

    const roleElement = LitHtml.html`<span class='monospace'>${truncateTextIfNeeded(role.value || '')}</span>`;
    templateResult.push(LitHtml.html`${roleElement}`);

    const name = axNode.name();
    if (name) {
      templateResult.push(LitHtml.html`<span class='separator'>\xA0</span>`);
      templateResult.push(LitHtml.html`<span class='ax-readable-string'>"${name.value}"</span>`);
    }
  }

  return LitHtml.html`
      <style>
      .ignored-node {
        font-style: italic;
        opacity: 70%;
      }

      .ax-readable-string {
        font-style: italic;
      }

      .monospace {
        font-family: var(--monospace-font-family);
        font-size: var(--monospace-font-size);
      }
      </style>
      ${templateResult}
      `;
}
