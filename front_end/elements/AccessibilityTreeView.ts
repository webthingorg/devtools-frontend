// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {AccessibilityTree} from './AccessibilityTree.js';

export class AccessibilityTreeView extends UI.Widget.VBox {
  private readonly treeView = new AccessibilityTree();
  private readonly toggleButton: HTMLButtonElement;
  private node: SDK.DOMModel.DOMNode|null = null;
  private rootNode: SDK.AccessibilityModel.AccessibilityNode|null;

  constructor(toggleButton: HTMLButtonElement) {
    super();
    // toggleButton is bound to a click handler on ElementsPanel to switch between the DOM tree
    // and accessibility tree views.
    this.toggleButton = toggleButton;
    this.contentElement.appendChild(this.toggleButton);
    this.contentElement.appendChild(this.treeView);
    this.rootNode = null;
  }

  setNode(node: SDK.DOMModel.DOMNode): void {
    this.node = node;
    this.refreshAccessibilityTree();
  }

  private async refreshAccessibilityTree(): Promise<void> {
    if (!this.node) {
      return;
    }

    const accessibilityModel = this.node.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
    if (!accessibilityModel) {
      return;
    }

    const result = await accessibilityModel.requestFullAXTree();
    if (!result) {
      return;
    }
    this.rootNode = result;

    this.treeView.data = {
      rootNode: this.rootNode,
    };
  }
}
