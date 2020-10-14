// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Root from '../root/root.js';  // eslint-disable-line no-unused-vars

import {LegacyActionRegistration} from './ActionRegistration.js';  // eslint-disable-line no-unused-vars
import {Context} from './Context.js';  // eslint-disable-line no-unused-vars

/** @type {!ActionRegistry} */
let actionRegistryInstance;

export class ActionRegistry {
  /**
   * @private
   */
  constructor() {
    /** @type {!Map.<string, !LegacyActionRegistration>} */
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
   * @return {!Array.<!LegacyActionRegistration>}
   */
  availableActions() {
    return this.applicableActions([...this._actionsById.keys()], Context.instance());
  }

  /**
   * @return {!Array.<!LegacyActionRegistration>}
   */
  actions() {
    return [...this._actionsById.values()];
  }

  /**
   * @param {!Array.<string>} actionIds
   * @param {!Context} context
   * @return {!Array.<!LegacyActionRegistration>}
   */
  applicableActions(actionIds, context) {
    const extensions = [];
    for (const actionId of actionIds) {
      const action = this._actionsById.get(actionId);
      if (action && action.enabled()) {
        extensions.push(action.extension());
      }
    }
    return [...context.applicableExtensions(extensions)].map(extensionToAction.bind(this));

    /**
     * @param {!Root.Runtime.Extension} extension
     * @return {!LegacyActionRegistration}
     * @this {ActionRegistry}
     */
    function extensionToAction(extension) {
      const actionId = /** @type {string} */ (extension.descriptor().actionId);
      return /** @type {!LegacyActionRegistration} */ (this.action(actionId));
    }
  }

  /**
   * @param {string} actionId
   * @return {?LegacyActionRegistration}
   */
  action(actionId) {
    return this._actionsById.get(actionId) || null;
  }
}
