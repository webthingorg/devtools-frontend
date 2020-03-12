// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

/**
 * @implements {UI.ListWidget.Delegate}
 */
export class KeybindsSettingsTab extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/keybindsSettingsTab.css');
    this._actions = new Map();
    for (const extension of self.runtime.extensions('action')) {
      const descriptor = extension.descriptor();
      this._actions.set(descriptor.actionId, descriptor);
    }

    const header = this.contentElement.createChild('header');
    header.createChild('h1').textContent = ls`Custom keyboard shortcuts`;

    const listHeader = this.contentElement.createChild('div', 'keybinds-list-item keybinds-header');
    listHeader.createChild('div', 'keybinds-list-text').textContent = ls`Action`;
    listHeader.createChild('div', 'keybinds-list-text').textContent = ls`Keyboard input`;
    this._list = new UI.ListWidget.ListWidget(this);
    this._list.registerRequiredCSS('settings/keybindsSettingsTab.css');
    this._list.show(this.contentElement);
    this.update();
  }

  /**
   * @override
   * @param {!KeybindItem} item
   * @return {!Element}
   */
  renderItem(item) {
    const itemElement = createElementWithClass('div', 'keybinds-list-item');

    if (item.isCategory) {
      itemElement.classList.add('keybinds-category-header');
      itemElement.textContent = item.name;
    } else {
      const descriptor = this._actions.get(item.name);
      const options = descriptor.options;
      let title;
      if (options) {
        title = options.map(option => option.title).join('/');
      } else {
        title = descriptor.title;
      }
      itemElement.createChild('div', 'keybinds-list-text').textContent = title;
      const keysElement = itemElement.createChild('div', 'keybinds-list-text');
      item.shortcuts.forEach(
          shortcut => keysElement.createChild('span', 'keybinds-key').textContent = shortcut.descriptor.name);
    }

    return itemElement;
  }

  /**
   * @override
   * @param {!KeybindItem} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
  }

  /**
   * None of the items are editable, so this method will never be called
   * @override
   * @param {!KeybindItem} item
   * @return {!UI.ListWidget.Editor<!KeybindItem>}
   */
  beginEdit(item) {
    return new UI.ListWidget.Editor();
  }

  /**
   * @override
   * @param {!KeybindItem} item
   * @param {!UI.ListWidget.Editor<!KeybindItem>} editor
   * @param {boolean} isNew
   */
  commitEdit(item, editor, isNew) {
  }

  update() {
    this._list.clear();
    let currentCategory;
    for (const action of [...this._actions.keys()].sort()) {
      const category = action.split('.')[0];
      if (category !== currentCategory) {
        this._list.appendItem(
            {name: `${category[0].toUpperCase()}${category.substr(1).replace(/[-_]/g, ' ')}`, isCategory: true}, false);
      }
      this._list.appendItem({name: action, shortcuts: self.UI.shortcutRegistry.shortcutsForAction(action)}, false);
      currentCategory = category;
    }
  }
}

/** @typedef {{name: string, shortcuts: (!Array<!UI.KeyboardShortcut.KeyboardShortcut>|undefined), isCategory: (boolean|undefined)}} */
export let KeybindItem;
