// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LitHtml from '../../third_party/lit-html/lit-html.js';

import {findNextNodeForTreeOutlineKeyboardNavigation, isExpandableNode, trackDOMNodeToTreeNode, TreeNode} from './TreeOutlineUtils.js';


export interface TreeOutlineData {
  tree: TreeNode[],
}


export class TreeOutline extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private treeData: readonly TreeNode[] = [];
  private nodeExpandedMap: WeakMap<TreeNode, boolean> = new WeakMap();
  private domNodeToTreeNodeMap: WeakMap<HTMLLIElement, TreeNode> = new WeakMap();
  private hasRenderedAtLeastOnce: boolean = false;

  private focusableTreeNode: TreeNode|null = null;

  get data(): TreeOutlineData {
    return {
      tree: this.treeData as TreeNode[],
    };
  }

  set data(data: TreeOutlineData) {
    this.treeData = data.tree;
    if (!this.hasRenderedAtLeastOnce) {
      this.focusableTreeNode = this.treeData[0];
    }
    this.render();
  }

  private getFocusableTreeNode(): TreeNode {
    if (!this.focusableTreeNode) {
      throw new Error('getFocusableNode was called but focusableNode is null');
    }

    return this.focusableTreeNode;
  }

  expandRecursively(maxDepth: number = 2): void {
    for (const rootNode of this.treeData) {
      this.expandAndRecurse(rootNode, 0, maxDepth);
    }
    this.render();
  }

  private setNodeExpandedState(node: TreeNode, newExpandedState: boolean): void {
    this.nodeExpandedMap.set(node, newExpandedState);
  }

  private nodeIsExpanded(node: TreeNode): boolean {
    return this.nodeExpandedMap.get(node) || false;
  }

  private expandAndRecurse(node: TreeNode, currentDepth: number, maxDepth: number): void {
    if (!isExpandableNode(node)) {
      return;
    }
    this.setNodeExpandedState(node, true);
    if (currentDepth === maxDepth || !isExpandableNode(node)) {
      return;
    }
    for (const childNode of node.children) {
      this.expandAndRecurse(childNode, currentDepth + 1, maxDepth);
    }
  }


  private onArrowClick(node: TreeNode): ((e: Event) => void) {
    return (event: Event): void => {
      event.stopPropagation();
      if (isExpandableNode(node)) {
        this.setNodeExpandedState(node, !this.nodeIsExpanded(node));
        this.render();
      }
    };
  }

  private onNodeClick(event: Event): void {
    // Avoid it bubbling up to parent tree elements, else clicking a node deep in the tree will toggle it + all its ancestor's visibility.
    event.stopPropagation();
    this.focusTreeNode(event.target as HTMLLIElement);
    this.render();
  }

  private focusTreeNode(domNode: HTMLLIElement): void {
    const treeNode = this.domNodeToTreeNodeMap.get(domNode);
    if (!treeNode) {
      return;
    }
    this.focusableTreeNode = treeNode;
    domNode.focus();
    this.render();
  }

  private onTreeKeyDown(event: KeyboardEvent): void {
    if (!new Set(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']).has(event.key)) {
      return;
    }

    if (!(event.target instanceof HTMLLIElement)) {
      throw new Error('event.target w was not an <li> element');
    }
    const currentDOMNode = event.target;
    const currentTreeNode = this.domNodeToTreeNodeMap.get(currentDOMNode);
    if (!currentTreeNode) {
      return;
    }

    const domNode = findNextNodeForTreeOutlineKeyboardNavigation({
      currentDOMNode,
      currentTreeNode,
      currentTreeNodeIsExpanded: this.nodeIsExpanded(currentTreeNode),
      direction: event.key as 'ArrowLeft' | 'ArrowUp' | 'ArrowDown' | 'ArrowRight',
      setNodeExpandedState: (node, expanded) => this.setNodeExpandedState(node, expanded),
    });
    this.focusTreeNode(domNode);
  }

  private renderNode(
      node: TreeNode, {depth, setSize, positionInSet}: {depth: number, setSize: number, positionInSet: number}):
      LitHtml.TemplateResult {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    let childrenToRender;
    const nodeIsExpanded = this.nodeIsExpanded(node);
    if (!isExpandableNode(node) || !nodeIsExpanded) {
      childrenToRender = LitHtml.nothing;
    } else {
      childrenToRender = LitHtml.html`<ul role="group">${node.children.map((childNode, index) => this.renderNode(childNode, {depth: depth + 1, setSize: node.children.length, positionInSet: index}))}`;
    }


    const nodeIsFocusable = this.getFocusableTreeNode() === node;
    const tabIndex = nodeIsFocusable ? 0 : -1;
    const listItemClasses = LitHtml.Directives.classMap({
      expanded: isExpandableNode(node) && nodeIsExpanded,
      parent: isExpandableNode(node),
    });


    const ariaExpandedAttribute = LitHtml.Directives.ifDefined(isExpandableNode(node) ? String(nodeIsExpanded) : undefined);

    return LitHtml.html`
      <li role="treeitem"
        tabindex=${tabIndex}
        aria-setsize=${setSize}
        aria-expanded=${ariaExpandedAttribute}
        aria-level=${depth + 1}
        aria-posinset=${positionInSet + 1}
        class=${listItemClasses}
        @click=${this.onNodeClick}
        ref=${trackDOMNodeToTreeNode(this.domNodeToTreeNodeMap, node)}
      >
        <span class="arrow-and-key-wrapper">
          <span class="arrow-icon" @click=${this.onArrowClick(node)}>
          </span>
          <span class="tree-node-key" data-node-key>${node.key}</span>
        </span>
        ${childrenToRender}
      </li>
    `;
    // clang-format on
  }
  private render(): void {
    // Disabled until https://crbug.com/1079231 is fixed.
    // clang-format off
    LitHtml.render(LitHtml.html`
    <style>
      li {
        list-style: none;
      }

      .arrow-icon {
        display: inline-block;
        user-select: none;
        -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
        -webkit-mask-size: 32px 24px;
        -webkit-mask-position: 0 0;
        background-color: #727272;
        content: "";
        text-shadow: none;
        margin-right: -2px;
        height: 12px;
        width: 13px;
        display: inline-block;
        overflow: hidden;
      }
      li:not(.parent) > .arrow-and-key-wrapper > .arrow-icon {
        -webkit-mask-size: 0;
      }
      li.parent.expanded > .arrow-and-key-wrapper > .arrow-icon {
        -webkit-mask-position: -16px 0;
      }

      .arrow-and-key-wrapper {
        border: 2px solid transparent;
      }
      [role="treeitem"]:focus {
        outline: 0;
      }
      [role="treeitem"]:focus>.arrow-and-key-wrapper {
       border-color: black;
      }
    </style>
    <div class="wrapping-container">
     <ul role="tree" @keydown=${this.onTreeKeyDown}>
       ${this.treeData.map((topLevelNode, index) => this.renderNode(topLevelNode, {depth: 0, setSize: this.treeData.length, positionInSet: index}))}
     </ul>
    </div>
    `, this.shadow, {
      eventContext: this,
    });
    // clang-format on

    this.hasRenderedAtLeastOnce = true;
  }
}

customElements.define('devtools-tree-outline', TreeOutline);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-tree-outline': TreeOutline;
  }
}
