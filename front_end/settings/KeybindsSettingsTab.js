// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {Descriptor, KeyboardShortcut, Keys} from '../ui/KeyboardShortcut.js';  // eslint-disable-line no-unused-vars
import {Delegate, Editor, ListWidget, ValidatorResult} from '../ui/ListWidget.js';  // eslint-disable-line no-unused-vars
import {VBox} from '../ui/Widget.js';

/**
 * @implements {Delegate}
 */
export class KeybindsSettingsTab extends VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/keybindsSettingsTab.css');
    /** @type {!Array<!KeyboardShortcut>} */
    this._keybinds = self.UI.shortcutRegistry.getAllBindableShortcuts();

    const header = this.contentElement.createChild('header');
    header.createChild('h1').textContent = ls`Custom keyboard shortcuts`;
    const listHeader = this.contentElement.createChild('div', 'keybinds-list-item keybinds-header');
    listHeader.createChild('div', 'keybinds-list-text').textContent = ls`Action`;
    listHeader.createChild('div', 'keybinds-list-separator');
    listHeader.createChild('div', 'keybinds-list-text').textContent = ls`Keyboard input`;
    this._list = new ListWidget(this);
    this._list.registerRequiredCSS('settings/keybindsSettingsTab.css');
    this._list.show(this.contentElement);
    this.update();
  }

  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @return {!Element}
   */
  renderItem(item) {
    const itemElement = createElementWithClass('div', 'keybinds-list-item');
    itemElement.appendChild(this._createActionNameElement(item));
    itemElement.createChild('div', 'keybinds-list-separator');
    itemElement.createChild('div', 'keybinds-list-text').createChild('span', 'keybinds-key').textContent =
        item.descriptor.name;

    return itemElement;
  }

  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
  }
  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @return {!Editor<!KeyboardShortcut>}
   */
  beginEdit(item) {
    return new Editor();
  }
  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @param {!Editor<!KeyboardShortcut>} editor
   * @param {boolean} isNew
   */
  commitEdit(item, editor, isNew) {
  }

  /**
   * @param {!KeyboardShortcut} item
   */
  _createActionNameElement(item) {
    const actionElement = createElementWithClass('div', 'keybinds-list-text');
    const actionCategory = item.actionCategory();
    if (actionCategory) {
      actionElement.createChild('b').textContent = `${actionCategory}: `;
    }
    actionElement.createTextChild(item.actionName());
    return actionElement;
  }

  update() {
    this._list.clear();
    for (const keybind of this._keybinds) {
      this._list.appendItem(keybind, false);
    }
  }
}
