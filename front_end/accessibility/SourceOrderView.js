// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import {AccessibilitySubPane} from './AccessibilitySubPane.js';

export class SourceOrderPane extends AccessibilitySubPane {
  constructor() {
    super(ls`Source Order Viewer`);

    this._noNodeInfo = this.createInfo(ls`No source order info`);
    this._checked = false;
    this._checkboxLabel = UI.UIUtils.CheckboxLabel.create(/* title */ ls`Show source order`, /* enabled */ false);
    this._checkboxElement = this._checkboxLabel.checkboxElement;

    this._checkboxLabel.style.margin = '5px';
    this._checkboxElement.addEventListener('click', this._checkboxClicked.bind(this), false);
    this.element.appendChild(this._checkboxLabel);
  }

  /**
     * @override
     * @param {?SDK.DOMModel.DOMNode} node
     */
  setNode(node) {
    super.setNode(node);
    if (!this._node) {
      return;
    }

    let foundSourceOrder = false;
    const children = this._node.children();
    if (children === null) {
      foundSourceOrder = this._node.childNodeCount() > 0;
    } else {
      foundSourceOrder = children.some(child => child.nodeType() === Node.ELEMENT_NODE);
    }

    this._noNodeInfo.classList.toggle('hidden', foundSourceOrder);
    this._checkboxLabel.classList.toggle('hidden', !foundSourceOrder);
    if (foundSourceOrder) {
      this._checkboxClicked();
    }
  }

  _checkboxClicked() {
    if (this._checkboxElement.checked && this._node) {
      this._node.highlightSourceOrder();
    } else if (this._node) {
      this._node.domModel().overlayModel().clearHighlight();
    }
  }
}
