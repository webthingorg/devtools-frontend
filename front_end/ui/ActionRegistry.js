// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars

import {ActionRegistration, ActionRegistrationInterface, LegacyActionRegistration, PreRegisteredAction} from './ActionRegistration.js';  // eslint-disable-line no-unused-vars
import {Context} from './Context.js';  // eslint-disable-line no-unused-vars
import {getRegisteredActionExtensions} from './RegisteredActionExtensions.js';  // eslint-disable-line no-unused-vars

/** @type {!ActionRegistry} */
let actionRegistryInstance;

export class ActionRegistry {
  /**
   * @private
   */
  constructor() {
    /** @type {!Map.<string, !ActionRegistrationInterface>} */
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
    const registeredActionExtensions = getRegisteredActionExtensions();
    for (let i = 0; i < registeredActionExtensions.length; ++i) {
      const action = registeredActionExtensions[i];
      this._actionsById.set(action.id(), action);
      if (!action.canInstantiate()) {
        action.setEnabled(false);
      }
    }
    // This call is done for the legacy Actions in module.json
    // TODO(crbug.com/X): Remove this call when all actions are migrated
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

      const action = new LegacyActionRegistration(extension);
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
   * @return {!Promise<!Array.<!ActionRegistrationInterface>>}
   */
  async availableActions() {
    return await this.applicableActions([...this._actionsById.keys()], Context.instance());
  }

  /**
   * @return {!Array.<!ActionRegistrationInterface>}
   */
  actions() {
    return [...this._actionsById.values()];
  }

  /**
   * @param {!Array.<string>} actionIds
   * @param {!Context} context
   * @return {!Promise<!Array.<!ActionRegistrationInterface>>}
   */
  async applicableActions(actionIds, context) {
    /** @type {!Array<!Root.Runtime.Extension>} */
    const extensions = [];
    /** @type {!Array<!PreRegisteredAction>} */
    const applicablePreRegisteredActions = [];
    for (const actionId of actionIds) {
      const action = this._actionsById.get(actionId);
      if (action && action.enabled()) {
        if (action instanceof LegacyActionRegistration) {
          // This call is done for the legacy Actions in module.json
          // TODO(crbug.com/X): Remove this call when all actions are migrated
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
     * @return {!LegacyActionRegistration}
     * @this {ActionRegistry}
     */
    function extensionToAction(extension) {
      const actionId = /** @type {string} */ (extension.descriptor().actionId);
      return /** @type {!LegacyActionRegistration} */ (this.action(actionId));
    }

    /**
     * @param {!PreRegisteredAction} action
     * @param {!Set.<function(new:Object, ...?):void>} currentContextTypes
     * @return {!Promise<boolean>}
     */
    async function isActionApplicableToContextTypes(action, currentContextTypes) {
      const contextTypes = await action.contextTypes();
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
   * @return {?ActionRegistrationInterface}
   */
  action(actionId) {
    return this._actionsById.get(actionId) || null;
  }
}
