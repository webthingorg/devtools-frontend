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
    this._actions = self.UI.actionRegistry.actions().sort((actionA, actionB) => {
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

    /** @type {?Editor<!KeyboardShortcut>} */
    this._editor = null;
    /** @type {?Descriptor} */
    this._userShortcut = null;

    const header = this.contentElement.createChild('header');
    header.createChild('h1').textContent = ls`Custom keyboard shortcuts`;
    const keybindsSetSetting = self.Common.settings.moduleSetting('activeKeybindSet');
    keybindsSetSetting.addChangeListener(this.update, this);
    const keybindsSetSelect = UI.SettingsUI.createControlForSetting(keybindsSetSetting);
    keybindsSetSelect.classList.add('keybinds-set-select');
    keybindsSetSelect.insertBefore(createTextNode(ls`Import shortcuts from`), keybindsSetSelect.firstElementChild);
    this.contentElement.appendChild(keybindsSetSelect);

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
   * @param {!KeybindsItem} item
   * @return {!Element}
   */
  renderItem(item) {
    const itemElement = createElementWithClass('div', 'keybinds-list-item');

    if (typeof item === 'string') {
      itemElement.classList.add('keybinds-category-header');
      itemElement.textContent = item;
    } else {
      itemElement.createChild('div', 'keybinds-list-text').textContent = item.title();
      const keysElement = itemElement.createChild('div', 'keybinds-list-text');
      self.UI.shortcutRegistry.shortcutsForAction(item.id()).forEach(
          shortcut => keysElement.createChild('span', 'keybinds-key').textContent = shortcut.descriptor.name);
    }

    return itemElement;
  }

  /**
   * @override
   * @param {!KeybindsItem} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
    self.UI.shortcutRegistry.removeShortcut(item);
    this._keybinds.splice(index, 1);
    this.update();
  }

  /**
   * @override
   * @param {!KeybindsItem} item
   * @return {!UI.ListWidget.Editor<!KeybindsItem>}
   */
  beginEdit(item) {
    const editor = this._getOrCreateEditor();
    this._editRowElement.firstElementChild.replaceWith(this._createActionNameElement(item));
    return editor;
  }

  /**
   * @override
   * @param {!KeybindsItem} item
   * @param {!UI.ListWidget.Editor<!KeybindsItem>} editor
   * @param {boolean} isNew
   */
  commitEdit(item, editor, isNew) {
    // TODO: user-facing errors for modifier-only shortcuts or conflicts
    if (!!this._userShortcut) {
      const newShortcut = item.changeKeys(this._userShortcut);
      self.UI.shortcutRegistry.removeShortcut(item);
      self.UI.shortcutRegistry.registerUserShortcut(newShortcut);
      const index = this._keybinds.indexOf(item);
      this._keybinds.splice(index, 1, newShortcut);
      this.update();
    }
  }

  update() {
    this._list.clear();

    let currentCategory;
    this._actions.forEach(action => {
      if (currentCategory !== action.category()) {
        this._list.appendItem(action.category(), false);
      }
      this._list.appendItem(action, false);
      currentCategory = action.category();
    });
  }

  /**
   * @return {!Editor<!KeyboardShortcut>}
   */
  _getOrCreateEditor() {
    if (this._editor) {
      this._editor.control('shortcut').value = '';
      return this._editor;
    }

    /**
     * @param {!KeyboardShortcut} item
     * @param {number} index
     * @param {!HTMLInputElement|!HTMLSelectElement} input
     * @return {!ValidatorResult}
     */
    const shortcutValidator = (item, index, input) => {
      this._unbindConflictCheckbox.classList.add('hidden');
      if (!this._userShortcut) {
        return {valid: true};
      }

      let errorMessage;
      let valid = true;
      const {keyCode} = KeyboardShortcut.keyCodeAndModifiersFromKey(this._userShortcut.key);
      const onlyModifiers = keyCode === Keys.Shift.code || keyCode === Keys.Ctrl.code || keyCode === Keys.Alt.code ||
          keyCode === Keys.Meta.code;

      if (onlyModifiers) {
        valid = false;
        errorMessage = ls`Shortcuts must have a non-modifier key.`;
      } else {
        const conflicts = this._userShortcut ? self.UI.shortcutRegistry.actionsForKey(this._userShortcut.key) : null;
        if (conflicts.length > 0) {
          valid = false;
          const action = self.UI.actionRegistry.action(conflicts[0]);
          const actionTitle = action ? action.title() : ls`unknown action`;
          errorMessage = ls`Shortcut conflicts with ${actionTitle}`;
          this._unbindConflictCheckbox.classList.remove('hidden');
        }
      }
      return {valid, errorMessage};
    };

    this._editor = new UI.ListWidget.Editor();
    const editorElement = this._editor.contentElement();
    this._editRowElement = editorElement.createChild('div', 'keybinds-list-item');
    this._editRowElement.createChild('div');
    this._editRowElement.createChild('div', 'keybinds-list-separator');
    const shortcutInput = this._editor.createInput('shortcut', 'text', ls`Enter shortcut here`, shortcutValidator);
    shortcutInput.classList.add('keybinds-list-text');
    this._editRowElement.appendChild(shortcutInput);
    this._unbindConflictCheckbox = this._editor.createInput(
        'unbindConflictCheckbox', 'checkbox', ls`Unbind conflict`, input => ({valid: input.checked}));
    this._unbindConflictCheckbox.classList.add('hidden');
    editorElement.appendChild(this._unbindConflictCheckbox);
    shortcutInput.addEventListener('keydown', event => {
      if (isEscKey(event)) {
        shortcutInput.value = '';
      } else {
        const userKey = KeyboardShortcut.makeKeyFromEvent(/** @type {!KeyboardEvent} */ (event));
        const codeAndModifiers = KeyboardShortcut.keyCodeAndModifiersFromKey(userKey);
        this._userShortcut =
            KeyboardShortcut.makeDescriptor({code: userKey, name: event.key}, codeAndModifiers.modifiers);
        shortcutInput.value = this._userShortcut.name;
        if (KeyboardShortcut.isModifier(codeAndModifiers.keyCode)) {
          shortcutInput.value = shortcutInput.value.slice(0, shortcutInput.value.lastIndexOf('+'));
        }
      }
      this._editor.validateControls();
      event.consume(true);
    });

    return this._editor;
  }
}

/** @typedef {string|!UI.Action.Action} */
export let KeybindsItem;
