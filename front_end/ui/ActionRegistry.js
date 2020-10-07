// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars

import {Action, ActionInterface, Events} from './Action.js';  // eslint-disable-line no-unused-vars
import {ActionDelegate} from './ActionDelegate.js';           // eslint-disable-line no-unused-vars
import {Context} from './Context.js';                         // eslint-disable-line no-unused-vars
import {registerShorcutActionExtension} from './ShortcutRegistry.js';

/** @type {!ActionRegistry} */
let actionRegistryInstance;


/** @enum {string} */
export const ActionId = {
  ELEMENTS_HIDE_ELEMENT: 'elements.hide-element',
  ELEMENTS_EDIT_AS_HTML: 'elements.edit-as-html',
  ELEMENTS_UNDO: 'elements.undo',
  ELEMENTS_REDO: 'elements.redo',
  ELEMENTS_TOGGLE_ELEMENT_SEARCH: 'elements.toggle-element-search',
  ELEMENTS_CAPTURE_AREA_SCREENSHOT: 'elements.capture-area-screenshot',
};

/** @enum {string} */
export const ActionCategory = {
  ELEMENTS: 'Elements',
};

/**
 * @typedef {{
  *  value: boolean,
  *  title: string,
  *  text: (string|undefined),
  * }}
  */
// @ts-ignore typedef
export let ExtensionOption;

/**
 * @typedef {{
  *  platform: (string|undefined),
  *  shortcut: string,
  *  keybindSets: (!Array<string>|undefined),
  * }}
  */
// @ts-ignore typedef
export let Binding;

/**
 * @typedef {{
  *  actionId: !ActionId,
  *  category: (string|undefined),
  *  title: (string|undefined),
  *  iconClass: (string|undefined),
  *  toggledIconClass: (string|undefined),
  *  toggleWithRedColor: (boolean|undefined),
  *  tags: (string|undefined),
  *  toggleable: (boolean|undefined),
  *  loadActionDelegate: (undefined|function():!Promise<ActionDelegate>),
  *  options: (undefined|!Array<!ExtensionOption>),
  *  loadContextTypes: (undefined|function():!Promise<!Array<function(new:Object, ...*):void>>),
  *  bindings: (!Array<!Binding>|undefined)
  * }}
  */
// @ts-ignore typedef
export let ActionRegistration;

/**
 * @implements {ActionInterface}
 */
export class PreRegisteredAction extends Common.ObjectWrapper.ObjectWrapper {
  /**
   * @param {!ActionRegistration} actionRegistration
   */
  constructor(actionRegistration) {
    super();
    this._actionRegistration = actionRegistration;
    /** @type {boolean} */
    this._enabled = true;
    /** @type {boolean} */
    this._toggled = false;
  }

  /**
   * @override
   * @return {string}
   */
  id() {
    return this._actionRegistration.actionId;
  }

  /**
   * @override
   * @return {!Promise<boolean>}
   */
  async execute() {
    if (!this._actionRegistration.loadActionDelegate) {
      return false;
    }
    const delegate = /** @type {!ActionDelegate} */ (await this._actionRegistration.loadActionDelegate());
    const actionId = this.id();
    return delegate.handleAction(Context.instance(), actionId);
  }

  /**
   * @override
   * @return {string|undefined}
   */
  icon() {
    return this._actionRegistration.iconClass;
  }

  /**
   * @override
   * @return {string|undefined}
   */
  toggledIcon() {
    return this._actionRegistration.toggledIconClass;
  }

  /**
   * @override
   * @return {boolean}
   */
  toggleWithRedColor() {
    return !!this._actionRegistration.toggleWithRedColor;
  }

  /**
   * @override
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    if (this._enabled === enabled) {
      return;
    }

    this._enabled = enabled;
    this.dispatchEventToListeners(Events.Enabled, enabled);
  }

  /**
   * @override
   * @return {boolean}
   */
  enabled() {
    return this._enabled;
  }

  /**
   * @override
   * @return {string|undefined}
   */
  category() {
    if (!this._actionRegistration.category) {
      return;
    }
    return ls`${this._actionRegistration.category}`;
  }

  /**
   * @override
   * @return {string|undefined}
   */
  tags() {
    return this._actionRegistration.tags;
  }

  /**
   * @override
   * @return {boolean}
   */
  toggleable() {
    return !!this._actionRegistration.toggleable;
  }

  /**
   * @override
   * @return {string|undefined}
   */
  title() {
    let title = this._actionRegistration.title;
    if (!title) {
      return;
    }
    const options = this._actionRegistration.options;
    if (options) {
      for (const pair of options) {
        if (pair.value !== this._toggled) {
          title = ls`${pair.title}`;
        }
      }
    }
    return title;
  }

  /**
   * @override
   * @return {boolean}
   */
  toggled() {
    return this._toggled;
  }

  /**
   * @override
   * @param {boolean} toggled
   */
  setToggled(toggled) {
    console.assert(this.toggleable(), 'Shouldn\'t be toggling an untoggleable action', this.id());
    if (this._toggled === toggled) {
      return;
    }

    this._toggled = toggled;
    this.dispatchEventToListeners(Events.Toggled, toggled);
  }

  /**
   * @return {undefined|!Array<!ExtensionOption>}
   */
  options() {
    return this._actionRegistration.options;
  }

  /**
   * @return {!Promise<!Array<function(new:Object, ...*):void>|undefined>}
   */
  async contextTypes() {
    if (!this._actionRegistration.loadContextTypes) {
      return;
    }
    return await this._actionRegistration.loadContextTypes();
  }

  /**
   * @return {boolean}
   */
  canInstantiate() {
    return !!this._actionRegistration.loadActionDelegate;
  }

  /**
   * @return {!Array<!Binding>|undefined}
   */
  bindings() {
    return this._actionRegistration.bindings;
  }
}

/** @type {!Array<!PreRegisteredAction>} */
const registeredActionExtensions = [];

/**
 * @param {!ActionRegistration} registration
 */
export function registerActionExtension(registration) {
  registeredActionExtensions.push(new PreRegisteredAction(registration));
  registerShorcutActionExtension(registration);
}

export class ActionRegistry {
  /**
   * @private
   */
  constructor() {
    /** @type {!Map.<string, !ActionInterface>} */
    this._actionsById = new Map();
    this._registerActions();
  }

  /**
   * @param {{forceNew: ?boolean}} opts
   */
  static instance(opts = {forceNew: null}) {
    const {forceNew} = opts;
    if (!actionRegistryInstance || forceNew) {
      actionRegistryInstance = new ActionRegistry();
    }

    return actionRegistryInstance;
  }

  _registerActions() {
    for (let i = 0; i < registeredActionExtensions.length; ++i) {
      const action = registeredActionExtensions[i];
      if (!action.category() || action.title()) {
        this._actionsById.set(action.id(), action);
      } else {
        console.error(`Category actions require a title for command menu: ${action.id()}`);
      }
      if (!action.canInstantiate()) {
        action.setEnabled(false);
      }
    }
    Root.Runtime.Runtime.instance().extensions('action').forEach(registerExtension, this);

    /**
     * @param {!Root.Runtime.Extension} extension
     * @this {ActionRegistry}
     */
    function registerExtension(extension) {
      const actionId = extension.descriptor().actionId;
      if (!actionId) {
        console.error(`No actionId provided for extension ${extension.descriptor().name}`);
        return;
      }
      console.assert(!this._actionsById.get(actionId));

      const action = new Action(extension);
      if (!action.category() || action.title()) {
        this._actionsById.set(actionId, action);
      } else {
        console.error(`Category actions require a title for command menu: ${actionId}`);
      }
      if (!extension.canInstantiate()) {
        action.setEnabled(false);
      }
    }
  }

  /**
   * @return {!Promise<!Array.<!ActionInterface>>}
   */
  async availableActions() {
    return await this.applicableActions([...this._actionsById.keys()], Context.instance());
  }

  /**
   * @return {!Array.<!ActionInterface>}
   */
  actions() {
    return [...this._actionsById.values()];
  }

  /**
   * @param {!Array.<string>} actionIds
   * @param {!Context} context
   * @return {!Promise<!Array.<!ActionInterface>>}
   */
  async applicableActions(actionIds, context) {
    /** @type {!Array<!Root.Runtime.Extension>} */
    const extensions = [];
    /** @type {!Array<!PreRegisteredAction>} */
    const applicablePreRegisteredActions = [];
    for (const actionId of actionIds) {
      const action = this._actionsById.get(actionId);
      if (action && action.enabled()) {
        if (action instanceof Action) {
          extensions.push(action.extension());
        } else if (await isActionApplicableToContextTypes(
                       /** @type {!PreRegisteredAction} */ (action), context.flavors())) {
          applicablePreRegisteredActions.push(/** @type {!PreRegisteredAction} */ (action));
        }
      }
    }
    const applicableActionExtensions = [...context.applicableExtensions(extensions)].map(extensionToAction.bind(this));

    return [...applicableActionExtensions, ...applicablePreRegisteredActions];

    /**
     * @param {!Root.Runtime.Extension} extension
     * @return {!Action}
     * @this {ActionRegistry}
     */
    function extensionToAction(extension) {
      const actionId = /** @type {string} */ (extension.descriptor().actionId);
      return /** @type {!Action} */ (this.action(actionId));
    }

    /**
     * @param {!PreRegisteredAction} action
     * @param {!Set.<function(new:Object, ...?):void>} currentContextTypes
     * @return {!Promise<boolean>}
     */
    async function isActionApplicableToContextTypes(action, currentContextTypes) {
      const contextTypes = await action.contextTypes();
      if (!contextTypes) {
        return true;
      }
      for (let i = 0; i < contextTypes.length; ++i) {
        const contextType = contextTypes[i];
        const isMatching = !!contextType && currentContextTypes.has(contextType);
        if (isMatching) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * @param {string} actionId
   * @return {?ActionInterface}
   */
  action(actionId) {
    return this._actionsById.get(actionId) || null;
  }
}
