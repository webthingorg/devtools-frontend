// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars

import {ChildTargetManager, Events as ChildTargetManagerEvents} from './ChildTargetManager.js';
import {Capability, Observer, SDKModel, Target, TargetManager} from './SDKModel.js';  // eslint-disable-line no-unused-vars

/**
 * The OpenedWindowManager emits events regarding browser windows opened via
 * 'window.open()'. It bundles events emitted by multiple ChildTargetManagers,
 * so that they are emitted from the OpenedWindowManager singleton.
 * @implements {Observer}
 */
export class OpenedWindowManager extends SDKModel {
  /**
   * @param {!Target} parentTarget
   */
  constructor(parentTarget) {
    super(parentTarget);
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

    childTargetManager.addEventListener(ChildTargetManagerEvents.TargetCreated, this._targetCreated, this);
    childTargetManager.addEventListener(ChildTargetManagerEvents.TargetInfoChanged, this._targetInfoChanged, this);
    childTargetManager.addEventListener(ChildTargetManagerEvents.TargetDestroyed, this._targetDestroyed, this);
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

    childTargetManager.removeEventListener(ChildTargetManagerEvents.TargetCreated, this._targetCreated, this);
    childTargetManager.removeEventListener(ChildTargetManagerEvents.TargetInfoChanged, this._targetInfoChanged, this);
    childTargetManager.removeEventListener(ChildTargetManagerEvents.TargetDestroyed, this._targetDestroyed, this);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _targetCreated(event) {
    const targetInfo = /** @type {!Protocol.Target.TargetInfo} */ (event.data);
    if (targetInfo.type !== 'page' || targetInfo.url.startsWith('devtools://')) {
      return;
    }
    this.dispatchEventToListeners(Events.WindowOpened, {targetInfo});
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _targetDestroyed(event) {
    const targetId = /** @type {string} */ (event.data);
    this.dispatchEventToListeners(Events.WindowDestroyed, {targetId});
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _targetInfoChanged(event) {
    const targetInfo = /** @type {!Protocol.Target.TargetInfo} */ (event.data);
    if (targetInfo.type !== 'page' || !targetInfo.openerId || targetInfo.url.startsWith('devtools://')) {
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

SDKModel.register(OpenedWindowManager, Capability.Target, true);
