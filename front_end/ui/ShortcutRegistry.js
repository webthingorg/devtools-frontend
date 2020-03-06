// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../host/host.js';

import {Action} from './Action.js';                  // eslint-disable-line no-unused-vars
import {ActionRegistry} from './ActionRegistry.js';  // eslint-disable-line no-unused-vars
import {Context} from './Context.js';
import {Dialog} from './Dialog.js';
import {Descriptor, EmptyShortcutDescriptor, KeyboardShortcut, Modifiers, Type} from './KeyboardShortcut.js';  // eslint-disable-line no-unused-vars
import {isEditing} from './UIUtils.js';

/**
 * @unrestricted
 */
export class ShortcutRegistry {
  /**
   * @param {!ActionRegistry} actionRegistry
   * @param {!Document} document
   */
  constructor(actionRegistry, document) {
    this._actionRegistry = actionRegistry;
    /** @type {!Platform.Multimap.<number, !KeyboardShortcut>} */
    this._keyToShortcut = new Platform.Multimap();
    /** @type {!Platform.Multimap.<string, !KeyboardShortcut>} */
    this._actionToShortcut = new Platform.Multimap();
    this._registerBindings(document);
  }

  /**
   * @return {boolean}
   */
  _customShortcutsEnabled() {
    if (!Root.Runtime.experiments.isEnabled('customKeyboardShortcuts')) {
      return false;
    }
    if (!this._userBindSetting) {
      /** @type {!Common.Setting<!Array.<!KeyboardShortcut>>} */
      this._userBindSetting = Common.settings.createSetting('keybinds.user-shortcuts', []);
    }
    return true;
  }

  /**
   * @param {number} key
   * @return {!Array.<!Action>}
   */
  _applicableActions(key) {
    return this._actionRegistry.applicableActions(this.actionsForKey(key), self.UI.context);
  }

  /**
   * @param {number} key
   * @return {!Array.<string>}
   */
  actionsForKey(key) {
    const shortcuts = [...this._keyToShortcut.get(key)];
    return shortcuts.map(shortcut => shortcut.action);
  }

  /**
   * @param {!KeyboardShortcut} shortcut
   */
  removeShortcut(shortcut) {
    if (this._actionToShortcut.has(shortcut.action)) {
      this._actionToShortcut.delete(shortcut.action, shortcut);
      this._keyToShortcut.delete(shortcut.descriptor.key, shortcut);

      if (shortcut.type === Type.UserShortcut) {
        this._removeBindingFromSetting(shortcut);
      } else if (shortcut.type === Type.DefaultShortcut) {
        this._addBindingToSetting(shortcut.changeType(Type.DisabledDefault));
      }
    }
  }

  /**
   * @param {!KeyboardShortcut} shortcut
   */
  _removeBindingFromSetting(shortcut) {
    const userBinds = this._userBindSetting.get();
    const bindIndex =
        userBinds.findIndex(bind => bind.descriptor === shortcut.descriptor && bind.action === shortcut.action);
    userBinds.splice(bindIndex, 1);
    this._userBindSetting.set(userBinds);
  }

  /**
   * @param {!UI.KeyboardShortcut} shortcut
   */
  _addBindingToSetting(shortcut) {
    const userBinds = this._userBindSetting.get();
    if (userBinds.findIndex(bind => bind.descriptor === shortcut.descriptor && bind.action === shortcut.action) ===
        -1) {
      userBinds.push(shortcut);
      this._userBindSetting.set(userBinds);
    }
  }

  /**
   * @return {!Array<number>}
   */
  globalShortcutKeys() {
    const keys = [];
    for (const key of this._keyToShortcut.keysArray()) {
      const actions = [...this._keyToShortcut.get(key)];
      const applicableActions = this._actionRegistry.applicableActions(actions, new Context());
      if (applicableActions.length) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * @param {string} actionId
   * @return {!Array.<!Descriptor>}
   */
  shortcutDescriptorsForAction(actionId) {
    return [...this._actionToShortcut.get(actionId)].map(shortcut => shortcut.descriptor);
  }

  /**
   * @return {!Array.<!UI.KeyboardShortcut>}
   */
  getAllBindableShortcuts() {
    const shortcuts = [];
    for (const action of this._actionRegistry.allActionIds()) {
      const actionShortcuts = this._actionToShortcut.get(action);
      if (actionShortcuts.size === 0) {
        shortcuts.push(new UI.KeyboardShortcut(EmptyShortcutDescriptor, action, Type.UnsetShortcut));
      }
      shortcuts.push(...actionShortcuts);
    }
    return shortcuts;
  }

  /**
   * @param {!Array.<string>} actionIds
   * @return {!Array.<number>}
   */
  keysForActions(actionIds) {
    const result = [];
    for (let i = 0; i < actionIds.length; ++i) {
      const descriptors = this.shortcutDescriptorsForAction(actionIds[i]);
      for (let j = 0; j < descriptors.length; ++j) {
        result.push(descriptors[j].key);
      }
    }
    return result;
  }

  /**
   * @param {string} actionId
   * @return {string|undefined}
   */
  shortcutTitleForAction(actionId) {
    const descriptors = this.shortcutDescriptorsForAction(actionId);
    if (descriptors.length) {
      return descriptors[0].name;
    }
  }

  /**
   * @param {!KeyboardEvent} event
   */
  handleShortcut(event) {
    this.handleKey(KeyboardShortcut.makeKeyFromEvent(event), event.key, event);
  }

  /**
   * @param {!KeyboardEvent} event
   * @param {string} actionId
   * @return {boolean}
   */
  eventMatchesAction(event, actionId) {
    console.assert(this._actionToShortcut.has(actionId), 'Unknown action ' + actionId);
    const key = KeyboardShortcut.makeKeyFromEvent(event);
    return [...this._actionToShortcut.get(actionId)].some(descriptor => descriptor.key === key);
  }

  /**
   * @param {!Element} element
   * @param {string} actionId
   * @param {function():boolean} listener
   * @param {boolean=} capture
   */
  addShortcutListener(element, actionId, listener, capture) {
    console.assert(this._actionToShortcut.has(actionId), 'Unknown action ' + actionId);
    element.addEventListener('keydown', event => {
      if (!this.eventMatchesAction(/** @type {!KeyboardEvent} */ (event), actionId) || !listener.call(null)) {
        return;
      }
      event.consume(true);
    }, capture);
  }

  /**
   * @param {number} key
   * @param {string} domKey
   * @param {!KeyboardEvent=} event
   */
  async handleKey(key, domKey, event) {
    const keyModifiers = key >> 8;
    const actions = this._applicableActions(key);
    if (!actions.length || isPossiblyInputKey()) {
      return;
    }
    if (event) {
      event.consume(true);
    }
    if (Dialog.hasInstance()) {
      return;
    }
    for (const action of actions) {
      try {
        const result = await action.execute();
        if (result) {
          Host.userMetrics.keyboardShortcutFired(action.id());
          return;
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    }

    /**
     * @return {boolean}
     */
    function isPossiblyInputKey() {
      if (!event || !isEditing() || /^F\d+|Control|Shift|Alt|Meta|Escape|Win|U\+001B$/.test(domKey)) {
        return false;
      }

      if (!keyModifiers) {
        return true;
      }

      const modifiers = Modifiers;
      // Undo/Redo will also cause input, so textual undo should take precedence over DevTools undo when editing.
      if (Host.Platform.isMac()) {
        if (KeyboardShortcut.makeKey('z', modifiers.Meta) === key) {
          return true;
        }
        if (KeyboardShortcut.makeKey('z', modifiers.Meta | modifiers.Shift) === key) {
          return true;
        }
      } else {
        if (KeyboardShortcut.makeKey('z', modifiers.Ctrl) === key) {
          return true;
        }
        if (KeyboardShortcut.makeKey('y', modifiers.Ctrl) === key) {
          return true;
        }
        if (!Host.Platform.isWin() && KeyboardShortcut.makeKey('z', modifiers.Ctrl | modifiers.Shift) === key) {
          return true;
        }
      }

      if ((keyModifiers & (modifiers.Ctrl | modifiers.Alt)) === (modifiers.Ctrl | modifiers.Alt)) {
        return Host.Platform.isWin();
      }

      return !hasModifier(modifiers.Ctrl) && !hasModifier(modifiers.Alt) && !hasModifier(modifiers.Meta);
    }

    /**
     * @param {number} mod
     * @return {boolean}
     */
    function hasModifier(mod) {
      return !!(keyModifiers & mod);
    }
  }

  /**
   * @param {!KeyboardShortcut} shortcut
   */
  registerUserShortcut(shortcut) {
    this._registerShortcut(shortcut);
    this._addBindingToSetting(shortcut);
  }

  /**
   * @param {!KeyboardShortcut} shortcut
   */
  _registerShortcut(shortcut) {
    const otherShortcuts = this._actionToShortcut.get(shortcut.action);
    for (const otherShortcut of otherShortcuts) {
      if (otherShortcut.descriptor.key === shortcut.descriptor.key) {
        if (otherShortcut.type === Type.DefaultShortcut && shortcut.type === Type.DisabledDefault) {
          this._actionToShortcut.delete(otherShortcut.action, otherShortcut);
          this._keyToShortcut.delete(otherShortcut.descriptor.key, otherShortcut);
        }
        return;
      }
    }

    this._actionToShortcut.set(shortcut.action, shortcut);
    this._keyToShortcut.set(shortcut.descriptor.key, shortcut);
  }

  /**
   * @param {!Document} document
   */
  _registerBindings(document) {
    const extensions = self.runtime.extensions('action');
    extensions.forEach(registerExtension, this);

    if (this._customShortcutsEnabled()) {
      const userBinds = this._userBindSetting.get();
      for (const bind of userBinds) {
        const shortcut = KeyboardShortcut.createShortcutFromSettingObject(bind);
        this._registerShortcut(shortcut);
      }
    }

    /**
     * @param {!Root.Runtime.Extension} extension
     * @this {ShortcutRegistry}
     */
    function registerExtension(extension) {
      const descriptor = extension.descriptor();
      const bindings = descriptor['bindings'];
      for (let i = 0; bindings && i < bindings.length; ++i) {
        if (!platformMatches(bindings[i].platform)) {
          continue;
        }
        const shortcuts = bindings[i]['shortcut'].split(/\s+/);
        shortcuts.forEach(shortcut => {
          const shortcutDescriptor = KeyboardShortcut.makeDescriptorFromBindingShortcut(shortcut);
          if (shortcutDescriptor) {
            this._registerShortcut(
                new KeyboardShortcut(shortcutDescriptor, descriptor['actionId'], Type.DefaultShortcut));
          }
        });
      }
    }

    /**
     * @param {string=} platformsString
     * @return {boolean}
     */
    function platformMatches(platformsString) {
      if (!platformsString) {
        return true;
      }
      const platforms = platformsString.split(',');
      let isMatch = false;
      const currentPlatform = Host.Platform.platform();
      for (let i = 0; !isMatch && i < platforms.length; ++i) {
        isMatch = platforms[i] === currentPlatform;
      }
      return isMatch;
    }
  }
}

/**
 * @unrestricted
 */
export class ForwardedShortcut {}

ForwardedShortcut.instance = new ForwardedShortcut();
