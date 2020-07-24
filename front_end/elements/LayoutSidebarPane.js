// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {createLayoutPane} from './LayoutPane_bridge.js';

/**
 * @unrestricted
 */
export class LayoutSidebarPane extends UI.ThrottledWidget.ThrottledWidget {
  constructor() {
    super(false /* isWebComponent */);
    this._layoutPane = createLayoutPane();
    this.contentElement.appendChild(this._layoutPane);
  }

  /**
   * @override
   * @protected
   * @return {!Promise<void>}
   */
  async doUpdate() {
    const node = self.UI.context.flavor(SDK.DOMModel.DOMNode);
    this._layoutPane.data = {selectedNode: node};
  }

  /**
   * @override
   */
  wasShown() {
    self.UI.context.addFlavorChangeListener(SDK.DOMModel.DOMNode, this.update, this);
    this.update();
  }

  /**
   * @override
   */
  willHide() {
    self.UI.context.removeFlavorChangeListener(SDK.DOMModel.DOMNode, this.update, this);
  }
}
