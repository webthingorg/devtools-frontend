// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

/**
 * This is a variation on TabbedPane. A single Widget is used for both the placeholder
 * element as well as all descendant views, giving the presenter of this pane
 * the responsibility to update the single shared Widget whenever the tabs update or
 * all tabs have been closed. Creation of TabbedPaneTabs should continue to pass in the
 * same Widget element as would be done with a normal TabbedPane. This specialization
 * does not verify that the tabs show the same view.
 *
 * @unrestricted
 */
export class TabbedPaneWithSharedView extends UI.TabbedPane.TabbedPane {
  /**
   * @param {!UI.Widget.Widget} sharedViewWidget
   */
  constructor(sharedViewWidget) {
    super();
    this._sharedViewWidget = sharedViewWidget;

    this.setPlaceholderElement(sharedViewWidget.element);
    sharedViewWidget.show(this.element);
  }

  /**
   * @override
   */
  _innerUpdateTabElements() {
    if (!this.isShowing()) {
      return;
    }

    if (!this._tabs.length) {
      this._contentElement.classList.add('has-no-tabs');
      this._sharedViewWidget.show(this.element);
    } else {
      this._contentElement.classList.remove('has-no-tabs');
    }

    this._measureDropDownButton();
    this._updateWidths();
    this._updateTabsDropDown();
    this._updateTabSlider();
  }
}
