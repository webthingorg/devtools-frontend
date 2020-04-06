// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../host/host.js';

import {Action} from './Action.js';                  // eslint-disable-line no-unused-vars
import {ActionRegistry} from './ActionRegistry.js';  // eslint-disable-line no-unused-vars
import {Context} from './Context.js';
import {Dialog} from './Dialog.js';
import {Descriptor, KeyboardShortcut, Modifiers, Type} from './KeyboardShortcut.js';  // eslint-disable-line no-unused-vars
import {isEditing} from './UIUtils.js';

/**
 * @unrestricted
 */
export class ShortcutRegistry {
  /**
   * @param {!ActionRegistry} actionRegistry
   */
  constructor(actionRegistry) {
    this._actionRegistry = actionRegistry;
    /** @type {!Platform.Multimap.<number, !KeyboardShortcut>} */
    this._keyToShortcut = new Platform.Multimap();
    /** @type {!Platform.Multimap.<string, !KeyboardShortcut>} */
    this._actionToShortcut = new Platform.Multimap();
    /** @type {!Set.<number>} */
    this._prefixKeys = new Set();
    /** @type {?number} */
    this._activePrefixKey = null;
    /** @type {?number} */
    this._activePrefixTimeout = null;
    this._registerBindings();
  }

  /**
   * @param {number} key
   * @return {!Array.<!Action>}
   */
  _applicableActions(key) {
    const shortcuts = [...this._keyToShortcut.get(key)].filter(
        shortcut => (!shortcut.prefixDescriptor && !this._activePrefixKey) ||
            (shortcut.prefixDescriptor && (shortcut.prefixDescriptor.key === this._activePrefixKey)));
    return this._actionRegistry.applicableActions(shortcuts.map(shortcut => shortcut.action), self.UI.context);
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
   * @param {string} action
   * @return {!Array.<!KeyboardShortcut>}
   */
  shortcutsForAction(action) {
    return [...this._actionToShortcut.get(action)];
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
   * TODO: update for chords
   * @param {!KeyboardEvent} event
   * @param {string} actionId
   * @return {boolean}
   */
  eventMatchesAction(event, actionId) {
    console.assert(this._actionToShortcut.has(actionId), 'Unknown action ' + actionId);
    const key = KeyboardShortcut.makeKeyFromEvent(event);
    return [...this._actionToShortcut.get(actionId)].some(shortcut => {
      if (!this._activePrefixKey && shortcut.descriptor.prefixKey) {
        return false;
      }
      if (this._activePrefixKey && this._activePrefixKey !== shortcut.descriptor.prefixKey) {
        return false;
      }
      return shortcut.descriptor.key === key;
    });
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
    if (isPossiblyInputKey()) {
      return;
    }
    if (Dialog.hasInstance() || KeyboardShortcut.isModifier(KeyboardShortcut.keyCodeAndModifiersFromKey(key).keyCode)) {
      return;
    }
    if (this._activePrefixTimeout) {
      clearTimeout(this._activePrefixTimeout);
      const handled = await this._maybeExecuteActionForKey(key);
      const prefixKey = /** @type {number} */ (this._activePrefixKey);
      this._activePrefixKey = null;
      if (handled) {
        if (event) {
          event.consume(true);
        }
        return;
      }
      await this._maybeExecuteActionForKey(prefixKey);
    }
    let handled;
    if (this._prefixKeys.has(key)) {
      handled = true;
      this._activePrefixKey = key;
      this._activePrefixTimeout = setTimeout(() => {
        this._activePrefixKey = null;
        this._activePrefixTimeout = null;
        this._maybeExecuteActionForKey(key);
      }, KeyTimeout);
    } else {
      handled = await this._maybeExecuteActionForKey(key);
    }
    if (handled && event) {
      event.consume(true);
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
   * @param {number} key
   * @return {!Promise.<boolean>};
   */
  async _maybeExecuteActionForKey(key) {
    const actions = this._applicableActions(key);
    if (!actions.length) {
      return false;
    }
    for (const action of actions) {
      try {
        const result = await action.execute();
        if (result) {
          Host.userMetrics.keyboardShortcutFired(action.id());
          return true;
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    return false;
  }

  /**
   * @param {!KeyboardShortcut} shortcut
   */
  _registerShortcut(shortcut) {
    this._actionToShortcut.set(shortcut.action, shortcut);
    this._keyToShortcut.set(shortcut.descriptor.key, shortcut);
    if (shortcut.prefixDescriptor) {
      this._prefixKeys.add(shortcut.prefixDescriptor.key);
    }
  }

  _registerBindings() {
    const extensions = self.runtime.extensions('action');
    extensions.forEach(registerExtension, this);

    /**
     * @param {!Root.Runtime.Extension} extension
     * @this {ShortcutRegistry}
     */
    function registerExtension(extension) {
      const descriptor = extension.descriptor();
      const bindings = descriptor.bindings;
      for (let i = 0; bindings && i < bindings.length; ++i) {
        if (!platformMatches(bindings[i].platform)) {
          continue;
        }
        const keys = bindings[i].shortcut.split(/\s+/);
        console.assert(keys.length <= 2, `Too many keys: ${bindings[i].shortcut}`);
        let prefixDescriptor;
        let shortcutDescriptor;
        if (keys.length === 2) {
          prefixDescriptor = KeyboardShortcut.makeDescriptorFromBindingShortcut(keys[0]);
          shortcutDescriptor = KeyboardShortcut.makeDescriptorFromBindingShortcut(keys[1]);
        } else {
          shortcutDescriptor = KeyboardShortcut.makeDescriptorFromBindingShortcut(keys[0]);
        }
        if (shortcutDescriptor) {
          this._registerShortcut(new KeyboardShortcut(
              shortcutDescriptor, /** @type {string} */ (descriptor.actionId), Type.DefaultShortcut, prefixDescriptor));
        }
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

export const KeyTimeout = 1000;
