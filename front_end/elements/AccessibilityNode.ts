// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../platform/platform.js';
import {ls} from '../platform/platform.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import {AccessibilityTree} from './AccessibilityTree.js';
import {AXNode} from './AccessibilityTreeUtils.js';

export interface AccessibilityNodeData {
  axNode: AXNode, axTree: AccessibilityTree|null, isSelected: boolean,
}

export class AccessibilityNode extends HTMLElement {
  private readonly shadow = this.attachShadow({
    mode: 'open',
    delegatesFocus: false,
  });
  private axNode: AXNode|null = null;
  private axTree: AccessibilityTree|null = null;
  private expanded: boolean = true;
  private loadedChildren: boolean = false;
  private hovered: boolean = false;
  private isSelected: boolean = false;

  constructor() {
    super();
    this.addEventListener('click', this.onClick.bind(this));
    this.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.tabIndex = -1;
  }

  set data(data: AccessibilityNodeData) {
    this.axNode = data.axNode;
    this.axTree = data.axTree;
    this.isSelected = data.isSelected;
    this.shadow.host.setAttribute('role', 'treeitem');
    this.render();
  }

  get axID(): string {
    if (!this.axNode) {
      return '';
    }
    return this.axNode.id;
  }

  set selected(selected: boolean) {
    this.isSelected = selected;
    if (this.isSelected) {
      this.focus();
    }

    this.render();
  }

  upArrowPress(): void {
    // move focus to previous focusable node
  }

  downArrowPress(): void {
    // move focus to next focusable node
  }

  leftArrowPress(): void {
    if (this.expanded) {
      this.toggleChildren();
    } else {
      // move focus to parent node
      if (this.axNode && this.axNode.parent && this.axTree) {
        const parent = this.axTree.nodesMap.get(this.axNode.parent.id);
        if (parent) {
          parent.selected = true;
          this.axTree.selectedAXNode = parent;
        }
      }
    }
  }

  rightArrowPress(): void {
    if (!this.expanded) {
      this.toggleChildren();
    } else {
      // move focus to first child
      if (this.axNode && this.axNode.children && this.axTree) {
        const firstChild = this.axTree.nodesMap.get(this.axNode.children[0].id);
        if (firstChild) {
          firstChild.selected = true;
          this.axTree.selectedAXNode = firstChild;
        }
      }
    }
  }

  private onClick(e: MouseEvent): void {
    if (this.axTree) {
      this.axTree.selectedAXNode = this;
    }

    e.stopPropagation();
    this.toggleChildren();
  }

  private onMouseMove(): void {
    this.setHovered(true);
  }

  private onMouseLeave(): void {
    this.setHovered(false);
  }

  private setHovered(hovered: boolean): void {
    if (this.hovered === hovered || !this.axNode) {
      return;
    }

    this.hovered = hovered;
    if (this.hovered) {
      this.axNode.highlightNode();
    } else {
      this.axNode.clearHighlight();
    }
  }

  private toggleChildren(): void {
    if (!this.axNode || !this.axNode.children) {
      return;
    }

    this.expanded = !this.expanded;
    this.classList.toggle('expanded', this.expanded);

    if (this.axNode.hasOnlyUnloadedChildren && !this.loadedChildren) {
      this.getChildAXNodes();
    }
  }

  private async getChildAXNodes(): Promise<void> {
    if (!this.axNode) {
      return;
    }

    await this.axNode.loadChildren();
    this.loadedChildren = true;
    this.render();
  }

  private renderChildren(node: AXNode): LitHtml.TemplateResult {
    if (!node) {
      return LitHtml.html``;
    }

    const children = [];
    for (const child of node.children) {
      const childTemplate = LitHtml.html`
        <devtools-accessibility-node .data=${{
        axNode: child,
        axTree: this.axTree,
        isSelected: false,
      } as AccessibilityNodeData}>
        </devtools-accessibility-node>
      `;
      children.push(childTemplate);
    }

    return LitHtml.html`<div role='group' class='children'>${children}</div>`;
  }

  // This function is a variant of setTextContentTruncatedIfNeeded found in DOMExtension.
  private truncateTextIfNeeded(text: string): string {
    const maxTextContentLength = 10000;

    if (text.length > maxTextContentLength) {
      return Platform.StringUtilities.trimMiddle(text, maxTextContentLength);
    }
    return text;
  }

  private renderNodeContent(): LitHtml.TemplateResult[] {
    const nodeContent: LitHtml.TemplateResult[] = [];
    if (!this.axNode) {
      return nodeContent;
    }

    const role = this.axNode.role;
    if (!role) {
      return nodeContent;
    }

    const roleElement = LitHtml.html`<span class='monospace'>${this.truncateTextIfNeeded(role || '')}</span>`;
    nodeContent.push(LitHtml.html`${roleElement}`);

    const name = this.axNode.name;
    if (name) {
      nodeContent.push(LitHtml.html`<span class='separator'>\xA0</span>`);
      nodeContent.push(LitHtml.html`<span class='ax-readable-string'>"${name}"</span>`);
    }

    return nodeContent;
  }

  private render(): void {
    if (!this.axNode) {
      return;
    }

    const parts: LitHtml.TemplateResult[] = [];
    // TODO(annabelzhou): Ignored nodes (and their potential children) to be handled in the future.
    if (this.axNode.ignored) {
      parts.push(LitHtml.html`<span class='monospace ignored-node'>${ls`Ignored`}</span>`);
    } else {
      const nodeContent = this.renderNodeContent();

      if (this.axNode.hasOnlyUnloadedChildren) {
        this.shadow.host.classList.add('parent');
        if (!this.loadedChildren) {
          this.expanded = false;
        }
      } else if (this.axNode.numChildren) {
        this.shadow.host.classList.add('parent', 'expanded');
      } else {
        this.shadow.host.classList.add('no-children');
      }

      const classes = LitHtml.Directives.classMap({
        'wrapper': true,
        'selected': this.isSelected,
      });
      parts.push(LitHtml.html`<div class=${classes}>${nodeContent}</div>`);
    }

    if (this.axTree) {
      this.axTree.appendToNodeMap(this.axNode.id, this);
    }

    const children = this.renderChildren(this.axNode);
    parts.push(children);

    // clang-format off
    const output = LitHtml.html`
      <style>
          .ax-readable-string {
            font-style: italic;
          }

          .monospace {
            font-family: var(--monospace-font-family);
            font-size: var(--monospace-font-size);
          }

          .ignored-node {
            font-style: italic;
            opacity: 70%;
          }

          :host {
            align-items: center;
            display: block;
            margin: 0;
            min-height: 16px;
            overflow-x: hidden;
            padding-left: 4px;
            padding-right: 4px;
            position: relative;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          span {
            flex-shrink: 0;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .children {
            padding-inline-start: 12px;
          }

          :host(:not(.expanded)) .children {
            display: none;
          }

          :host(.no-children) {
            margin-left: 16px;
          }

          :host(.parent)::before {
            box-sizing: border-box;
            user-select: none;
            -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
            -webkit-mask-size: 32px 24px;
            content: '\A0';
            color: transparent;
            text-shadow: none;
            margin-right: -3px;
            -webkit-mask-position: 0 0;
            background-color: var(--color-syntax-7);
          }

          :host(.parent.expanded)::before {
            -webkit-mask-position: -16px 0;
          }

          .wrapper {
            display: inline-block;
            width: 96%;
          }

          .wrapper:hover {
            background: var(--color-background-elevation-2);
          }

          .wrapper.selected {
            outline: none;
            background: var(--selection-bg-color);
          }

          :focus {
            outline: none;
          }
      </style>
      ${parts}
      `;
    // clang-format on
    LitHtml.render(output, this.shadow);
  }
}

if (!customElements.get('devtools-accessibility-node')) {
  customElements.define('devtools-accessibility-node', AccessibilityNode);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-node': AccessibilityNode;
  }
}
