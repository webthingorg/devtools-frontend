// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';
import type * as SDK from '../../../core/sdk/sdk.js';
import type * as TreeOutline from '../../../ui/components/tree_outline/tree_outline.js';

import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Coordinator from '../../../ui/components/render_coordinator/render_coordinator.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

export type TreeNodeData = {
  sdkNode: SDK.AccessibilityModel.AccessibilityNode,
  htmlElement: AccessibilityTreeNode,
};

export type AXTreeNode = TreeOutline.TreeOutlineUtils.TreeNode<TreeNodeData>;


const UIStrings = {
  /**
  *@description Ignored node element text content in Accessibility Tree View of the Elements panel
  */
  ignored: 'Ignored',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/components/AccessibilityTreeUtils.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);

export function sdkNodeToAXTreeNode(sdkNode: SDK.AccessibilityModel.AccessibilityNode): AXTreeNode {
  const htmlElement = new AccessibilityTreeNode();
  htmlElement.data = sdkNode;
  const treeNodeData = {sdkNode, htmlElement};
  if (!sdkNode.numChildren()) {
    return {
      treeNodeData,
      id: sdkNode.id(),
    };
  }

  return {
    treeNodeData,
    children: async(): Promise<AXTreeNode[]> => {
      if (sdkNode.numChildren() === sdkNode.children().length) {
        return Promise.resolve(sdkNode.children().map(child => sdkNodeToAXTreeNode(child)));
      }
      // numChildren returns the number of children that this node has, whereas node.children()
      // returns only children that have been loaded. If these two don't match, that means that
      // there are backend children that need to be loaded into the model, so request them now.
      await sdkNode.accessibilityModel().requestAXChildren(sdkNode.id());

      if (sdkNode.numChildren() !== sdkNode.children().length) {
        throw new Error('Once loaded, number of children and length of children must match.');
      }

      const treeNodeChildren: AXTreeNode[] = [];

      for (const child of sdkNode.children()) {
        treeNodeChildren.push(sdkNodeToAXTreeNode(child));
      }

      return Promise.resolve(treeNodeChildren);
    },
    id: sdkNode.id(),
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
  return LitHtml.html`${node.treeNodeData.htmlElement}`;
}

export class AccessibilityTreeNode extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-accessibility-tree-node`;
  private readonly shadow = this.attachShadow({mode: 'open'});

  private accessibilityNode: SDK.AccessibilityModel.AccessibilityNode|null = null;

  set data(node: SDK.AccessibilityModel.AccessibilityNode) {
    this.accessibilityNode = node;
    this.update();
  }

  private async update(): Promise<void> {
    await this.render();
  }

  private async render(): Promise<void> {
    if (!this.accessibilityNode) {
      return;
    }
    let nodeContent: LitHtml.TemplateResult[];

    if (this.accessibilityNode.ignored()) {
      nodeContent = ignoredNodeTemplate();
    } else {
      nodeContent = unignoredNodeTemplate(this.accessibilityNode);
    }
    await Coordinator.RenderCoordinator.RenderCoordinator.instance().write('Accessibility node render', () => {
      // clang-format off
      // eslint-disable-next-line rulesdir/ban_style_tags_in_lit_html
      LitHtml.render(LitHtml.html`
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
     `, this.shadow, {
        host: this,
      });
      // clang-format on
    });
  }
}

ComponentHelpers.CustomElements.defineComponent('devtools-accessibility-tree-node', AccessibilityTreeNode);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-tree-node': AccessibilityTreeNode;
  }
}
