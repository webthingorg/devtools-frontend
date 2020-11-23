// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

export class ComboBoxOfCheckBoxes extends UI.Toolbar.ToolbarButton {
  /**
     * @param {string} title
     */
  constructor(title) {
    super(title);
    this.turnIntoSelect();
    this.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._showLevelContextMenu.bind(this));
    UI.ARIAUtils.markAsMenuButton(this.element);

    /** @type {!Array<!{title: string, value: string, default: boolean, enabled: boolean}>} */
    this.options = [];
    /** @type {!Array<!{title: string, callback: () => void}>} */
    this.headers = [];
    /** @type {() => void} */
    this.onOptionClicked = () => {};
  }

  /**
     *
     * @param {string} option
     * @param {string} value
     * @param {boolean} defaultEnabled
     */
  addOption(option, value, defaultEnabled) {
    this.options.push({'title': option, 'value': value, default: defaultEnabled, 'enabled': defaultEnabled});
  }

  /**
     *
     * @param {number} index
     * @param {boolean} enabled
     */
  setOptionEnabled(index, enabled) {
    const option = this.options[index];
    if (!option) {
      return;
    }
    option.enabled = enabled;
    this.onOptionClicked();
  }

  /**
     *
     * @param {string} headerName
     * @param {() => void} callback
     */
  addHeader(headerName, callback) {
    this.headers.push({title: headerName, callback: callback});
  }

  /**
     *
     * @param {() => void} onOptionClicked
     */
  setOnOptionClicked(onOptionClicked) {
    this.onOptionClicked = onOptionClicked;
  }

  /**
     * @return {!Array<{title: string, value:string, default:boolean, enabled: boolean}>}
     */
  getOptions() {
    return this.options;
  }

  /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
  _showLevelContextMenu(event) {
    const mouseEvent = /** @type {!Event} */ (event.data);
    this._contextMenu = new UI.ContextMenu.ContextMenu(
        mouseEvent, true, this.element.totalOffsetLeft(),
        this.element.totalOffsetTop() +
            /** @type {!HTMLElement} */ (this.element).offsetHeight);

    for (const {title, callback} of this.headers) {
      this._contextMenu.headerSection().appendCheckboxItem(title, () => callback());
    }
    for (const [index, {title, enabled}] of this.options.entries()) {
      this._contextMenu.defaultSection().appendCheckboxItem(title, () => {
        this.setOptionEnabled(index, !enabled);
      }, enabled);
    }
    this._contextMenu.show();
  }
}
