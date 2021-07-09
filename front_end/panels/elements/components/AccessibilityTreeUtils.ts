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

export type AXTreeNodeData = {
  sdkNode: SDK.AccessibilityModel.AccessibilityNode,
  htmlElement: AccessibilityTreeNode,
};
export type AXTreeNode = TreeOutline.TreeOutlineUtils.TreeNode<AXTreeNodeData>;

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
  htmlElement.data = {name: sdkNode.name()?.value || '', role: sdkNode.role()?.value || '', ignored: sdkNode.ignored()};
  const treeNodeData = {htmlElement, sdkNode};
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


export function accessibilityNodeRenderer(node: AXTreeNode): LitHtml.TemplateResult {
  return LitHtml.html`${node.treeNodeData.htmlElement}`;
}

export interface AccessibilityTreeNodeData {
  ignored: boolean;
  name: string;
  role: string;
}

export class AccessibilityTreeNode extends HTMLElement {
  static readonly litTagName = LitHtml.literal`devtools-accessibility-tree-node`;
  private readonly shadow = this.attachShadow({mode: 'open'});

  private ignored: boolean = true;
  private name: string = '';
  private role: string = '';

  set data(data: AccessibilityTreeNodeData) {
    this.ignored = data.ignored;
    this.name = data.name;
    this.role = data.role;
    this.update();
  }

  private async update(): Promise<void> {
    await this.render();
  }

  private async render(): Promise<void> {
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
      ${this.ignored?
          LitHtml.html`<span class='monospace ignored-node'>${i18nString(UIStrings.ignored)}</span>`:
          LitHtml.html`
             <span class='monospace'>${truncateTextIfNeeded(this.role)}</span>
             <span class='separator'>\xA0</span>
             <span class='ax-readable-string'>"${this.name}"</span>
          `}
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
