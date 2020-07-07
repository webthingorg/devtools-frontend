// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import {AccessibilitySubPane} from './AccessibilitySubPane.js';

export class SourceOrderPane extends AccessibilitySubPane {
  constructor() {
    super(ls`Source Order Viewer`);

    this._noNodeInfo = this.createInfo(ls`No source order information avaiable`);
    this._checked = false;
    this._checkboxLabel = UI.UIUtils.CheckboxLabel.create(/* title */ ls`Show source order`, /* checked */ false);
    this._checkboxElement = this._checkboxLabel.checkboxElement;

    this._checkboxLabel.style.margin = '5px';
    this._checkboxElement.addEventListener('click', this._checkboxClicked.bind(this), false);
    this.element.appendChild(this._checkboxLabel);
  }

  /**
     * @override
     * @param {?SDK.DOMModel.DOMNode} node
     */
  async setNode(node) {
    super.setNode(node);
    if (!this._node) {
      this._overlayModel = null;
      return;
    }

    let foundSourceOrder = false;
    if (this._node.childNodeCount() > 0) {
      if (!this._node.children()) {
        await this._node.getSubtree(1, false);
      }
      // @ts-ignore
      foundSourceOrder = this._node.children().some(child => child.nodeType() === Node.ELEMENT_NODE);
    }

    this._noNodeInfo.classList.toggle('hidden', foundSourceOrder);
    this._checkboxLabel.classList.toggle('hidden', !foundSourceOrder);
    if (foundSourceOrder) {
      this._overlayModel = this._node.domModel().overlayModel();
      this._checkboxElement.checked = this._overlayModel.sourceOrderModeActive();
    } else {
      this._overlayModel = null;
    }
  }

  _checkboxClicked() {
    if (!this._node || !this._overlayModel) {
      return;
    }

    if (this._checkboxElement.checked) {
      this._overlayModel.highlightSourceOrderInOverlay(this._node);
    } else {
      this._overlayModel.hideSourceOrderInOverlay();
    }
  }
}
