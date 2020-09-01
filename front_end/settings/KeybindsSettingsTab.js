// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

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
    const userShortcutsSetting = self.Common.settings.moduleSetting('userShortcuts');
    userShortcutsSetting.addChangeListener(this.update, this);
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
    UI.ARIAUtils.setAccessibleName(this._list.element, ls`Keyboard shortcuts list`);

    /** @type {?UI.Action.Action} */
    this._editingItem = null;

    this.update();
  }

  /**
   * @override
   * @param {!KeybindsItem} item
   * @return {!Element}
   */
  createElementForItem(item) {
    let itemElement = document.createElement('div');

    if (typeof item === 'string') {
      UI.ARIAUtils.setLevel(itemElement, 1);
      itemElement.classList.add('keybinds-category-header');
      itemElement.textContent = item;
    } else {
      const listItem = new ShortcutListItem(item, this, item === this._editingItem);
      itemElement = listItem.element;
      UI.ARIAUtils.setLevel(itemElement, 2);
    }

    itemElement.classList.add('keybinds-list-item');
    UI.ARIAUtils.markAsListitem(itemElement);
    itemElement.tabIndex = item === this._list.selectedItem() ? 0 : -1;
    return itemElement;
  }

  /**
   * @param {!UI.Action.Action} item
   * @param {!Map.<!UI.KeyboardShortcut.KeyboardShortcut, ?Array.<!UI.KeyboardShortcut.Descriptor>>} editedShortcuts
   */
  commitChanges(item, editedShortcuts) {
    for (const [originalShortcut, newDescriptors] of editedShortcuts) {
      self.UI.shortcutRegistry.removeShortcut(originalShortcut);
      if (newDescriptors) {
        self.UI.shortcutRegistry.registerUserShortcut(
            originalShortcut.changeKeys(/** @type !Array.<!UI.KeyboardShortcut.Descriptor> */ (newDescriptors))
                .changeType(UI.KeyboardShortcut.Type.UserShortcut));
      }
    }
    this.stopEditing(item);
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
  startEditing(action) {
    if (this._editingItem) {
      this.stopEditing(this._editingItem);
    }
    UI.UIUtils.markBeingEdited(this._list.element, true);
    this._editingItem = action;
    this._list.refreshItem(action);
  }

  /**
   * @param {!UI.Action.Action} action
   */
  stopEditing(action) {
    UI.UIUtils.markBeingEdited(this._list.element, false);
    this._editingItem = null;
    this._list.refreshItem(action);
  }

  /**
   * @returns {!Array.<!KeybindsItem>}
   */
  _createListItems() {
    const actions = UI.ActionRegistry.ActionRegistry.instance().actions().sort((actionA, actionB) => {
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

  /**
   * @override
   */
  willHide() {
    if (this._editingItem) {
      this.stopEditing(this._editingItem);
    }
  }
}

/**
 * This class creates and manages the keyboard shortcut editing UI for an
 * action--so if that action has multiple shortcuts, they will appear as
 * individual rows within the editor.
 */
export class ShortcutListItem {
  /**
   * @param {!UI.Action.Action} item
   * @param {!KeybindsSettingsTab} settingsTab
   * @param {boolean=} isEditing
   */
  constructor(item, settingsTab, isEditing) {
    this._isEditing = !!isEditing;
    this._settingsTab = settingsTab;
    this._item = item;
    this.element = document.createElement('div');
    this.element.classList.toggle('keybinds-editing', this._isEditing);
    this.element.createChild('div', 'keybinds-action-name keybinds-list-text').textContent = item.title();
    const shortcuts = self.UI.shortcutRegistry.shortcutsForAction(item.id());
    /** @type {!Map.<!UI.KeyboardShortcut.KeyboardShortcut, ?Array.<!UI.KeyboardShortcut.Descriptor>>} */
    this._editedShortcuts = new Map();
    /** @type {?Element} */
    this._shortcutInputToFocus = null;

    shortcuts.forEach(this._createShortcutRow, this);
    if (shortcuts.length === 0) {
      if (self.UI.shortcutRegistry.actionHasDefaultShortcut(item.id())) {
        const icon = UI.Icon.Icon.create('largeicon-shortcut-changed', 'keybinds-modified');
        UI.ARIAUtils.setAccessibleName(icon, ls`Shortcut modified`);
        this.element.appendChild(icon);
      }
      if (!this._isEditing) {
        const emptyElement = this.element.createChild('div', 'keybinds-shortcut keybinds-list-text');
        UI.ARIAUtils.setAccessibleName(emptyElement, ls`No shortcut for action`);
      }
    }

    if (this._isEditing) {
      const confirmButton = this.element.createChild('button', 'keybinds-confirm-button');
      confirmButton.appendChild(UI.Icon.Icon.create('largeicon-checkmark'));
      confirmButton.addEventListener('click', () => settingsTab.commitChanges(item, this._editedShortcuts));
      UI.ARIAUtils.setAccessibleName(confirmButton, ls`Confirm changes`);
      const cancelButton = this.element.createChild('button', 'keybinds-cancel-button');
      cancelButton.appendChild(UI.Icon.Icon.create('largeicon-delete'));
      cancelButton.addEventListener('click', () => settingsTab.stopEditing(item));
      UI.ARIAUtils.setAccessibleName(cancelButton, ls`Discard changes`);
      this.element.addEventListener('focus', () => {
        if (this._shortcutInputToFocus) {
          this._shortcutInputToFocus.focus();
        }
      });
    }
  }

  /**
   * @param {!UI.KeyboardShortcut.KeyboardShortcut} shortcut
   * @param {number} index
   */
  _createShortcutRow(shortcut, index) {
    if (!shortcut.isDefault()) {
      const icon = UI.Icon.Icon.create('largeicon-shortcut-changed', 'keybinds-modified');
      UI.ARIAUtils.setAccessibleName(icon, ls`Shortcut modified`);
      this.element.appendChild(icon);
    }
    const shortcutElement = this.element.createChild('div', 'keybinds-shortcut keybinds-list-text');
    if (this._isEditing) {
      const shortcutInput = shortcutElement.createChild('input');
      if (!this._shortcutInputToFocus) {
        this._shortcutInputToFocus = shortcutInput;
      }
      shortcutInput.value = shortcut.title();
      shortcutInput.addEventListener('keydown', this._shortcutInputKeyDown.bind(this, shortcut, shortcutInput));
      const deleteButton = this.element.createChild('button');
      deleteButton.classList.add('keybinds-delete-button');
      deleteButton.appendChild(UI.Icon.Icon.create('largeicon-trash-bin'));
      deleteButton.addEventListener('click', () => {
        this.element.removeChild(shortcutElement);
        this._editedShortcuts.set(shortcut, null);
      });
      UI.ARIAUtils.setAccessibleName(deleteButton, ls`Remove shortcut`);
      shortcutElement.appendChild(deleteButton);
    } else {
      const keys = shortcut.descriptors.flatMap(descriptor => descriptor.name.split(' + '));
      keys.forEach(key => {
        shortcutElement.createChild('span', 'keybinds-key').textContent = key;
      });
      if (Root.Runtime.experiments.isEnabled('keyboardShortcutEditor') && index === 0) {
        this.element.appendChild(this._createEditButton());
      }
    }
  }

  /**
    * @return {!Element}
    */
  _createEditButton() {
    const editButton = document.createElement('button');
    editButton.classList.add('keybinds-edit-button');
    editButton.appendChild(UI.Icon.Icon.create('largeicon-edit'));
    editButton.addEventListener('click', () => this._settingsTab.startEditing(this._item));
    UI.ARIAUtils.setAccessibleName(editButton, ls`Edit shortcut`);
    return editButton;
  }

  /**
   * @param {!UI.KeyboardShortcut.KeyboardShortcut} shortcut
   * @param {!Element} shortcutInput
   * @param {!Event} event
   */
  _shortcutInputKeyDown(shortcut, shortcutInput, event) {
    if (isEscKey(event)) {
      shortcutInput.value = '';
    } else if (event.key === 'Tab') {
      return;
    } else {
      const userKey = UI.KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent(/** @type {!KeyboardEvent} */ (event));
      const codeAndModifiers = UI.KeyboardShortcut.KeyboardShortcut.keyCodeAndModifiersFromKey(userKey);
      const userDescriptor = UI.KeyboardShortcut.KeyboardShortcut.makeDescriptor(
          {code: userKey, name: event.key}, codeAndModifiers.modifiers);
      shortcutInput.value = userDescriptor.name;
      this._editedShortcuts.set(shortcut, [userDescriptor]);
      if (UI.KeyboardShortcut.KeyboardShortcut.isModifier(codeAndModifiers.keyCode)) {
        shortcutInput.value = shortcutInput.value.slice(0, shortcutInput.value.lastIndexOf('+'));
      }
    }
    event.consume(true);
  }
}

/** @typedef {string|!UI.Action.Action} */
export let KeybindsItem;
