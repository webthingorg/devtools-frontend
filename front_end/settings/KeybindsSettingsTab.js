// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ListWidget, Editor, ValidatorResult, Delegate} from '../ui/ListWidget.js';  // eslint-disable-line no-unused-vars
import {KeyboardShortcut, Descriptor, Keys} from '../ui/KeyboardShortcut.js';  // eslint-disable-line no-unused-vars
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
    /** @type {?Editor<!KeyboardShortcut>} */
    this._editor = null;
    /** @type {?Descriptor} */
    this._userShortcut = null;
    const header = this.contentElement.createChild('div', 'keybinds-list-item keybinds-header');
    header.createChild('div', 'keybinds-list-text').textContent = ls`Action`;
    header.createChild('div', 'keybinds-list-separator');
    header.createChild('div', 'keybinds-list-text').textContent = ls`Binding`;
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
    itemElement.createChild('div', 'keybinds-list-text').createChild('span', 'keybinds-key').textContent = item.descriptor.name;

    return itemElement;
  }

  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @param {number} index
   */
  removeItemRequested(item, index) {
    self.UI.shortcutRegistry.removeShortcut(item);
    this._keybinds.splice(index, 1);
    this.update();
  }

  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @return {!Editor<!KeyboardShortcut>}
   */
  beginEdit(item) {
    const editor = this._getOrCreateEditor();
    this._editRowElement.firstElementChild.replaceWith(this._createActionNameElement(item));
    return editor;
  }

  /**
   * @override
   * @param {!KeyboardShortcut} item
   * @param {!Editor<!KeyboardShortcut>} editor
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
      this._list.appendItem(keybind, true);
    }
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
      if (!this._userShortcut) {
        return {valid: true};
      }

      let errorMessage;
      let valid = true;
      const {keyCode} = KeyboardShortcut.keyCodeAndModifiersFromKey(this._userShortcut.key);
      const onlyModifiers = keyCode === Keys.Shift.code || keyCode === Keys.Ctrl.code || keyCode === Keys.Alt.code || keyCode === Keys.Meta.code;

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
        }
      }
      return {valid, errorMessage};
    };

    this._editor = new Editor();
    const editorElement = this._editor.contentElement();
    this._editRowElement = editorElement.createChild('div', 'keybinds-list-item');
    this._editRowElement.createChild('div');
    this._editRowElement.createChild('div', 'keybinds-list-separator');
    const shortcutInput = this._editor.createInput('shortcut', 'text', ls`Enter shortcut here`, shortcutValidator);
    shortcutInput.classList.add('keybinds-list-text');
    this._editRowElement.appendChild(shortcutInput);
    shortcutInput.addEventListener('keydown', event => {
      if (isEscKey(event)) {
        shortcutInput.value = '';
      } else {
        const userKey = KeyboardShortcut.makeKeyFromEvent(/** @type {!KeyboardEvent} */ (event));
        const codeAndModifiers = KeyboardShortcut.keyCodeAndModifiersFromKey(userKey);
        this._userShortcut = KeyboardShortcut.makeDescriptor({code: userKey, name: event.key}, codeAndModifiers.modifiers);
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
