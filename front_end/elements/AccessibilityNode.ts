// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

export interface AccessibilityNodeData {
  axNode: SDK.AccessibilityModel.AccessibilityNode|null;
}

export class AccessibilityNode extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private axNode: SDK.AccessibilityModel.AccessibilityNode|null = null;

  set data(data: AccessibilityNodeData) {
    this.axNode = data.axNode;
    if (!this.axNode) {
      return;
    }
    this.render();
  }

  // TODO(annabelzhou): Track whether the children should be expanded and change arrow accordingly
  private renderChildren(node: SDK.AccessibilityModel.AccessibilityNode): LitHtml.TemplateResult {
    if (!node) {
      return LitHtml.html``;
    }

    const children = [];
    for (const child of node.children()) {
      const child_template = LitHtml.html`
        <devtools-accessibility-node .data=${{
        axNode: child,
      } as AccessibilityNodeData}>
        </devtools-accessibility-node>
      `;
      children.push(child_template);
    }
    return LitHtml.html`<ul role='group' class='children'>${children}</ul>`;
  }

  private appendRoleAndNameElement(): LitHtml.TemplateResult[]|null {
    const nodeContent: LitHtml.TemplateResult[] = [];
    if (!this.axNode) {
      return null;
    }

    const role = this.axNode.role();
    if (!role) {
      return null;
    }
    const roleElement = document.createElement('span');
    roleElement.innerText = role.value;
    roleElement.classList.add('monospace');
    roleElement.setTextContentTruncatedIfNeeded(role.value || '');
    nodeContent.push(LitHtml.html`${roleElement}`);

    nodeContent.push(LitHtml.html`<span class='separator'>\xA0</span>`);

    const name = this.axNode.name();
    if (name && name.value) {
      nodeContent.push(LitHtml.html`<span class='ax-readable-string'>"${name.value}"</span>`);
    }

    return nodeContent;
  }

  private render(): void {
    const parts: LitHtml.TemplateResult[] = [];
    if (!this.axNode) {
      return;
    }

    if (this.axNode.ignored()) {
      parts.push(LitHtml.html`<span class='monospace ignored-node'>${ls`Ignored`}</span>`);
    } else {
      const nodeContent = this.appendRoleAndNameElement();

      if (this.axNode.numChildren()) {
        parts.push(LitHtml.html`<span role='treeitem' class='ax-node parent expanded'><span class='wrapper'>${
            nodeContent}</span></span>`);
      } else {
        parts.push(LitHtml.html`<span role='treeitem' class='ax-node no-children'><span class='wrapper'>${
            nodeContent}</span></span>`);
      }
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
          font-size: var(--monospace-font-size) !important;
        }

        .ignored-node {
          font-style: italic;
          opacity: 70%;
        }

        .ax-node {
          align-items: center;
          margin: 0;
          min-height: 16px;
          overflow-x: hidden;
          padding-left: 4px;
          padding-right: 4px;
          position: relative;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ax-node span {
          flex-shrink: 0;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ax-node .wrapper {
          overflow-x: hidden;
        }

        .children {
          margin: 0px;
        }

        .no-children {
          margin-left: 12px;
        }

        li {
          list-style-type: none;
        }

        li.parent {
          margin-left: -13px;
        }

        ul {
          list-style-type: none;
          padding-inline-start: 12px;
          margin-block-start: auto;
        }

        span.parent.expanded::before {
          -webkit-mask-position: -16px 0;
        }

        span.parent::before {
          box-sizing: border-box;
          user-select: none;
          -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
          -webkit-mask-size: 32px 24px;
          content: '\A0';
          color: transparent;
          text-shadow: none;
          margin-right: -3px;
          -webkit-mask-position: 0 0;
          background-color: #727272;
        }
      </style>
      <li>${parts}</li>
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
