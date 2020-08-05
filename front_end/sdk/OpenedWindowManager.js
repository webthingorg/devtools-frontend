// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';

import {ChildTargetManager, Events as ChildTargetManagerEvents} from './ChildTargetManager.js';
import {Observer, Target, TargetManager} from './SDKModel.js';  // eslint-disable-line no-unused-vars

/** @type {?OpenedWindowManager} */
let openedWindowManagerInstance = null;

/**
 * The OpenedWindowManager emits events regarding browser windows opened via
 * 'window.open()'. It bundles events emitted by multiple ChildTargetManagers,
 * so that they are emitted from the OpenedWindowManager singleton.
 * @implements {Observer}
 */
export class OpenedWindowManager extends Common.ObjectWrapper.ObjectWrapper {
  constructor() {
    super();
    TargetManager.instance().observeTargets(this);

    /** @type {?Array<!Common.EventTarget.EventDescriptor>} */
    this._registeredListeners = null;
  }

  /**
   * @override
   * @param {!Target} target
   */
  targetAdded(target) {
    /** @type {?ChildTargetManager} */
    const childTargetManager = target.model(ChildTargetManager);
    if (!childTargetManager) {
      return;
    }
    this._registeredListeners = [
      childTargetManager.addEventListener(
          ChildTargetManagerEvents.TargetCreated,
          event => this._targetCreated(/** @type {!Protocol.Target.TargetInfo} */ (event.data))),
      childTargetManager.addEventListener(
          ChildTargetManagerEvents.TargetInfoChanged,
          event => this._targetInfoChanged(/** @type {!Protocol.Target.TargetInfo} */ (event.data))),
      childTargetManager.addEventListener(
          ChildTargetManagerEvents.TargetDestroyed, event => this._targetDestroyed(/** @type {string} */ (event.data))),
    ];
  }

  /**
   * @override
   * @param {!Target} target
   */
  targetRemoved(target) {
    const childTargetManager = target.model(ChildTargetManager);
    if (!childTargetManager) {
      return;
    }
    if (this._registeredListeners) {
      Common.EventTarget.EventTarget.removeEventListeners(this._registeredListeners);
    }
  }

  /**
   * @param {{forceNew: boolean}} opts
   * @return {!OpenedWindowManager}
   */
  static instance({forceNew} = {forceNew: false}) {
    if (!openedWindowManagerInstance || forceNew) {
      openedWindowManagerInstance = new OpenedWindowManager();
    }
    return openedWindowManagerInstance;
  }

  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   */
  _targetCreated(targetInfo) {
    if (!targetInfo.openerId || targetInfo.url.startsWith('devtools://')) {
      return;
    }
    this.dispatchEventToListeners(Events.WindowOpened, {targetInfo});
  }

  /**
   * @param {string} targetId
   */
  _targetDestroyed(targetId) {
    this.dispatchEventToListeners(Events.WindowDestroyed, {targetId});
  }

  /**
   * @param {!Protocol.Target.TargetInfo} targetInfo
   */
  _targetInfoChanged(targetInfo) {
    if (!targetInfo.openerId || targetInfo.url.startsWith('devtools://')) {
      return;
    }
    this.dispatchEventToListeners(Events.WindowChanged, {targetInfo});
  }
}

/** @enum {symbol} */
export const Events = {
  WindowChanged: Symbol('WindowChanged'),
  WindowDestroyed: Symbol('WindowDestroyed'),
  WindowOpened: Symbol('WindowOpened'),
};
