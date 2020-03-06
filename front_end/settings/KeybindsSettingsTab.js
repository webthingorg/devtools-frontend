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
    this._actions = self.UI.actionRegistry.allActionIds().sort();

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

    if (item.isCategory) {
      itemElement.classList.add('keybinds-category-header');
      itemElement.textContent = item.name;
    } else {
      const action = UI.actionRegistry.action(item.name);
      itemElement.createChild('div', 'keybinds-list-text').textContent = action.title();
      itemElement.createChild('div', 'keybinds-list-separator');
      const keysElement = itemElement.createChild('div', 'keybinds-list-text');
      item.shortcuts.forEach(
          shortcut => keysElement.createChild('span', 'keybinds-key').textContent = shortcut.descriptor.name);
    }

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
   * None of the items are editable, so this method will never be called
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
    let currentCategory;
    for (const action of this._actions) {
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

/** @typedef {{name: string, shortcuts: (!Array<KeyboardShortcut>|undefined), isCategory: (boolean|undefined)}} */
let KeybindItem;
