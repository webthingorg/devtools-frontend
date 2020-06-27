// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as UI from '../ui/ui.js';

/**
 * @implements {UI.ListControl.ListDelegate<!KeybindsItem>}
 */
export class KeybindsSettingsTab extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('settings/keybindsSettingsTab.css');

    const header = this.contentElement.createChild('header');
    header.createChild('h1').textContent = ls`Shortcuts`;
    const keybindsSetSetting = self.Common.settings.moduleSetting('activeKeybindSet');
    keybindsSetSetting.addChangeListener(this.update, this);
    const keybindsSetSelect =
        UI.SettingsUI.createControlForSetting(keybindsSetSetting, ls`Match shortcuts from preset`);
    keybindsSetSelect.classList.add('keybinds-set-select');
    this.contentElement.appendChild(keybindsSetSelect);

    /** @type {!UI.ListModel.ListModel<!KeybindsItem>} */
    this._items = new UI.ListModel.ListModel();
    this._list = new UI.ListControl.ListControl(this._items, this, UI.ListControl.ListMode.NonViewport);
    this._items.replaceAll(this._createListItems());
    UI.ARIAUtils.markAsList(this._list.element);
    this.registerRequiredCSS('settings/keybindsSettingsTab.css');
    this.contentElement.appendChild(this._list.element);

    /** @type {?UI.Action.Action} */
    this._editingItem = null;
    /** @type {!Map.<UI.KeyboardShortcut.KeyboardShortcut, UI.KeyboardShortcut.Descriptor>} */
    this._editedShortcuts = new Map();

    this.update();
  }

  /**
   * @override
   * @param {!KeybindsItem} item
   * @return {!Element}
   */
  createElementForItem(item) {
    const itemElement = document.createElement('div');
    itemElement.classList.add('keybinds-list-item');
    UI.ARIAUtils.markAsListitem(itemElement);
    itemElement.tabIndex = item === this._list.selectedItem() ? 0 : -1;
    const beingEdited = item === this._editingItem;

    if (typeof item === 'string') {
      itemElement.classList.add('keybinds-category-header');
      itemElement.textContent = item;
    } else {
      itemElement.createChild('div', 'keybinds-action-name keybinds-list-text').textContent = item.title();
      const shortcuts = self.UI.shortcutRegistry.shortcutsForAction(item.id());
      shortcuts.forEach(createShortcutRow, this);
      if (shortcuts.length === 0) {
        if (self.UI.shortcutRegistry.actionHasDefaultShortcut(item.id())) {
          const icon = UI.Icon.Icon.create('largeicon-shortcut-changed', 'keybinds-modified');
          UI.ARIAUtils.setAccessibleName(icon, ls`Shortcut provided by preset`);
          itemElement.appendChild(icon);
        }
        if (!beingEdited) {
          itemElement.appendChild(this._createEditButton(item));
        }
      }
      if (beingEdited) {
        itemElement.classList.add('keybinds-editing');
        const confirmButton = document.createElement('button');
        confirmButton.classList.add('keybinds-confirm-button');
        confirmButton.appendChild(UI.Icon.Icon.create('largeicon-checkmark'));
        itemElement.appendChild(confirmButton);
        confirmButton.addEventListener('click', () => this._stopEditing(item));
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('keybinds-cancel-button');
        cancelButton.appendChild(UI.Icon.Icon.create('largeicon-delete'));
        itemElement.appendChild(cancelButton);
      }
    }
    return itemElement;

    /**
      * @this {!Settings.KeybindsSettingsTab}
      * @param {!UI.KeyboardShortcut.KeyboardShortcut} shortcut
      * @param {number} index
      */
    function createShortcutRow(shortcut, index) {
      if (!shortcut.isDefault()) {
        const icon = UI.Icon.Icon.create('largeicon-shortcut-changed', 'keybinds-modified');
        UI.ARIAUtils.setAccessibleName(icon, ls`Shortcut provided by preset`);
        itemElement.appendChild(icon);
      }
      const shortcutElement = itemElement.createChild('div', 'keybinds-shortcut keybinds-list-text');
      const keys = shortcut.descriptors.flatMap(descriptor => descriptor.name.split(' + '));
      if (beingEdited) {
        const shortcutInput = shortcutElement.createChild('input');
        shortcutInput.addEventListener('keydown', event => {
          if (isEscKey(event)) {
            shortcutInput.value = '';
          } else if (event.key === 'Tab') {
            return;
          } else {
            const userKey =
                UI.KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent(/** @type {!KeyboardEvent} */ (event));
            const codeAndModifiers = UI.KeyboardShortcut.KeyboardShortcut.keyCodeAndModifiersFromKey(userKey);
            const userDescriptor = UI.KeyboardShortcut.KeyboardShortcut.makeDescriptor(
                {code: userKey, name: event.key}, codeAndModifiers.modifiers);
            shortcutInput.value = userDescriptor.name;
            this._editedShortcuts.set(shortcut, userDescriptor);
            if (UI.KeyboardShortcut.KeyboardShortcut.isModifier(codeAndModifiers.keyCode)) {
              shortcutInput.value = shortcutInput.value.slice(0, shortcutInput.value.lastIndexOf('+'));
            }
          }
          event.consume(true);
        });
      } else {
        keys.forEach(key => {
          shortcutElement.createChild('span', 'keybinds-key').textContent = key;
        });
      }
      if (beingEdited) {
        const deleteButton = itemElement.createChild('button');
        deleteButton.classList.add('keybinds-delete-button');
        deleteButton.appendChild(UI.Icon.Icon.create('largeicon-trash-bin'));
        itemElement.appendChild(deleteButton);
      } else if (index === 0) {
        itemElement.appendChild(this._createEditButton(item));
      }
    }
  }

  /**
    * @param {!UI.Action.Action} item
    * @return {!Element}
    */
  _createEditButton(item) {
    const editButton = document.createElement('button');
    editButton.classList.add('keybinds-edit-button');
    editButton.appendChild(UI.Icon.Icon.create('largeicon-edit'));
    editButton.addEventListener('click', () => this._startEditing(item));
    return editButton;
  }

  /**
   * This method will never be called.
   * @override
   * @param {!KeybindsItem} item
   * @return {number}
   */
  heightForItem(item) {
    return 0;
  }


  /**
   * @override
   * @param {!KeybindsItem} item
   * @returns {boolean}
   */
  isItemSelectable(item) {
    return true;
  }

  /**
   * @override
   * @param {?KeybindsItem} from
   * @param {?KeybindsItem} to
   * @param {?Element} fromElement
   * @param {?Element} toElement
   */
  selectedItemChanged(from, to, fromElement, toElement) {
    if (fromElement) {
      fromElement.tabIndex = -1;
    }
    if (toElement) {
      toElement.tabIndex = 0;
      if (this._list.element.hasFocus()) {
        toElement.focus();
      }
    }
  }

  /**
   * @override
   * @param {?Element} fromElement
   * @param {?Element} toElement
   * @return {boolean}
   */
  updateSelectedItemARIA(fromElement, toElement) {
    return true;
  }

  /**
   * @param {!UI.Action.Action} action
   */
  _startEditing(action) {
    if (this._editingItem) {
      this._stopEditing(this._editingItem);
    }
    UI.UIUtils.markBeingEdited(this._list.element, true);
    this._editingItem = action;
    this._list.refreshItem(action);
  }

  /**
   * @param {!UI.Action.Action} action
   */
  _stopEditing(action) {
    UI.UIUtils.markBeingEdited(this._list.element, false);
    this._editingItem = null;
    this._list.refreshItem(action);
  }

  /**
   * @returns {!Array.<!KeybindsItem>}
   */
  _createListItems() {
    const actions = self.UI.actionRegistry.actions().sort((actionA, actionB) => {
      if (actionA.category() < actionB.category()) {
        return -1;
      }
      if (actionA.category() > actionB.category()) {
        return 1;
      }
      if (actionA.id() < actionB.id()) {
        return -1;
      }
      if (actionA.id() > actionB.id()) {
        return 1;
      }
      return 0;
    });

    const items = [];
    let currentCategory;
    actions.forEach(action => {
      if (currentCategory !== action.category()) {
        items.push(action.category());
      }
      items.push(action);
      currentCategory = action.category();
    });
    return items;
  }

  update() {
    this._list.refreshAllItems();
    if (!this._list.selectedItem()) {
      this._list.selectItem(this._items.at(0));
    }
  }
}

/** @typedef {string|!UI.Action.Action} */
export let KeybindsItem;
