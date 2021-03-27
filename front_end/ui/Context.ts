// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';
import * as Root from '../root/root.js'; // eslint-disable-line no-unused-vars

import { ContextFlavorListener } from './ContextFlavorListener.js'; // eslint-disable-line no-unused-vars

let contextInstance: Context;

/** @typedef {(function(new:Object, ...*):void|function(new:Object, ...?):void)} */
let ConstructorFn; // eslint-disable-line no-unused-vars

export class Context {
  _flavors: Map<ConstructorFn, Object>;
  _eventDispatchers: Map<ConstructorFn, Common.ObjectWrapper.ObjectWrapper>;
  private constructor() {
    this._flavors = new Map();
    this._eventDispatchers = new Map();
  }

  static instance(opts: {
    forceNew: boolean | null;
  } = { forceNew: null }): Context {
    const { forceNew } = opts;
    if (!contextInstance || forceNew) {
      contextInstance = new Context();
    }

    return contextInstance;
  }

  /**
   * @template T
   */
  setFlavor(flavorType: new (...arg1: any[]) => T, flavorValue: T | null): void {
    const value = this._flavors.get(flavorType) || null;
    if (value === flavorValue) {
      return;
    }
    if (flavorValue) {
      this._flavors.set(flavorType, flavorValue);
    }
    else {
      this._flavors.delete(flavorType);
    }

    this._dispatchFlavorChange(flavorType, flavorValue);
  }

  /**
   * @template T
   */
  _dispatchFlavorChange(flavorType: new (...arg1: any[]) => T, flavorValue: T | null): void {
    for (const extension of getRegisteredListeners()) {
      if (extension.contextTypes().includes(flavorType)) {
        extension.loadListener().then(instance => instance.flavorChanged(flavorValue));
      }
    }
    const dispatcher = this._eventDispatchers.get(flavorType);
    if (!dispatcher) {
      return;
    }
    dispatcher.dispatchEventToListeners(Events.FlavorChanged, flavorValue);
  }

  addFlavorChangeListener(flavorType: ConstructorFn, listener: (arg0: Common.EventTarget.EventTargetEvent) => void, thisObject?: Object): void {
    let dispatcher = this._eventDispatchers.get(flavorType);
    if (!dispatcher) {
      dispatcher = new Common.ObjectWrapper.ObjectWrapper();
      this._eventDispatchers.set(flavorType, dispatcher);
    }
    dispatcher.addEventListener(Events.FlavorChanged, listener, thisObject);
  }

  removeFlavorChangeListener(flavorType: ConstructorFn, listener: (arg0: Common.EventTarget.EventTargetEvent) => void, thisObject?: Object): void {
    const dispatcher = this._eventDispatchers.get(flavorType);
    if (!dispatcher) {
      return;
    }
    dispatcher.removeEventListener(Events.FlavorChanged, listener, thisObject);
    if (!dispatcher.hasEventListeners(Events.FlavorChanged)) {
      this._eventDispatchers.delete(flavorType);
    }
  }

  /**
   * @template T
   */
  flavor(flavorType: new (...arg1: any[]) => T): T | null {
    return (this._flavors.get(flavorType) as T | null) || null;
  }

  flavors(): Set<new (...arg1: any[]) => Object> {
    return new Set(this._flavors.keys());
  }
}

const enum Events {
  FlavorChanged = 'FlavorChanged'
}
;

const registeredListeners: ContextFlavorListenerRegistration[] = [];

export function registerListener(registration: ContextFlavorListenerRegistration): void {
  registeredListeners.push(registration);
}

function getRegisteredListeners(): ContextFlavorListenerRegistration[] {
  return registeredListeners;
}
export interface ContextFlavorListenerRegistration {
  contextTypes: () => Array<unknown>;
  loadListener: () => Promise<ContextFlavorListener>;
}
