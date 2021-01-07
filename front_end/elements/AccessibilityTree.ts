// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';

import type {AccessibilityNodeData} from './AccessibilityNode.js';

export interface AccessibilityTreeData {
  rootNode: SDK.AccessibilityModel.AccessibilityNode|null;
}

export class AccessibilityTree extends HTMLElement {
  private readonly shadow = this.attachShadow({mode: 'open'});
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null = null;

  set data(data: AccessibilityTreeData) {
    this.rootNode = data.rootNode;
    this.render();
  }

  private render(): void {
    if (!this.rootNode) {
      return;
    }

    // clang-format off
    const output = LitHtml.html`
      <devtools-accessibility-node .data=${{
        axNode: this.rootNode,
        } as AccessibilityNodeData}>
      </devtools-accessibility-node>
    `;
    // clang-format on
    LitHtml.render(output, this.shadow);
  }
}

if (!customElements.get('devtools-accessibility-tree')) {
  customElements.define('devtools-accessibility-tree', AccessibilityTree);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLElementTagNameMap {
    'devtools-accessibility-tree': AccessibilityTree;
  }
}
