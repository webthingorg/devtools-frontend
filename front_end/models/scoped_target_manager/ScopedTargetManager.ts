// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../core/sdk/sdk.js';
import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import type * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import type * as Protocol from '../../generated/protocol.js';
import * as Root from '../../core/root/root.js';
import * as Host from '../../core/host/host.js';

let targetManagerInstance: ScopedTargetManager|undefined;


export class ScopedTargetManager {
  readonly #targetManager: SDK.TargetManager.TargetManager;
  #outermostTarget: SDK.Target.Target|null;
  readonly #observers: Set<SDK.TargetManager.Observer>;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #modelObservers: Platform.MapUtilities
      .Multimap<new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel, SDK.TargetManager.SDKModelObserver<any>>;

  readonly #wrapped: Map<any, any>;

  private constructor() {
    this.#targetManager = SDK.TargetManager.TargetManager.instance();
    this.#outermostTarget = null;
    this.#observers = new Set();
    this.#modelObservers = new Platform.MapUtilities.Multimap();
    this.#wrapped = new Map();
  }

  static instance({forceNew}: {
    forceNew: boolean,
  } = {forceNew: false}): ScopedTargetManager {
    if (!targetManagerInstance || forceNew) {
      targetManagerInstance = new ScopedTargetManager();
    }

    return targetManagerInstance;
  }

  observeModels<T extends SDK.SDKModel.SDKModel>(modelClass: new(arg1: SDK.Target.Target) => T, observer: SDK.TargetManager.SDKModelObserver<T>): void {
    const wrappedObserver = this.wrap(observer);
    this.#modelObservers.set(modelClass, wrappedObserver);
    this.#targetManager.observeModels(modelClass, wrappedObserver);
  }

  unobserveModels<T extends SDK.SDKModel.SDKModel>(modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel, observer: SDK.TargetManager.SDKModelObserver<T>): void {
    const wrappedObserver = this.wrap(observer);
    this.#modelObservers.delete(modelClass, wrappedObserver);
    this.#targetManager.unobserveModels(modelClass, wrappedObserver);
  }

  addModelListener<Events, T extends keyof Events>(
      modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<Events>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object): void {
    this.#targetManager.addModelListener(modelClass, eventType, this.wrap(listener, thisObject), thisObject);
  }

  removeModelListener<Events, T extends keyof Events>(
      modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<Events>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object): void {
    this.#targetManager.removeModelListener(modelClass, eventType, this.wrap(listener, thisObject), thisObject);
  }

  observeTargets(targetObserver: SDK.TargetManager.Observer): void {
    const wrappedObserver = this.wrap(targetObserver);
    this.#observers.add(wrappedObserver);
    this.#targetManager.observeTargets(wrappedObserver);
  }

  unobserveTargets(targetObserver: SDK.TargetManager.Observer): void {
    const wrappedObserver = this.wrap(targetObserver);
    this.#observers.delete(wrappedObserver);
    this.#targetManager.unobserveTargets(wrappedObserver);
  }

  targets(): SDK.Target.Target[] {
    return this.#targetManager.targets().filter((t) => !this.shouldIgnore(t));
  }

  models<T extends SDK.SDKModel.SDKModel>(modelClass: new(arg1: SDK.Target.Target) => T): T[] {
    return this.#targetManager.models(modelClass).filter(m => !this.shouldIgnore(m));
  }

  outermostTarget(): SDK.Target.Target|null {
    return this.#outermostTarget;
  }

  shouldIgnore(arg: SDK.ResourceTreeModel.ResourceTreeFrame|SDK.SDKModel.SDKModel|SDK.Target.Target|Common.EventTarget.EventTargetEvent<any, any>): boolean {
    if (arg instanceof SDK.ResourceTreeModel.ResourceTreeFrame) {
      arg = arg.resourceTreeModel();
    }
    if (isEvent(arg)) {
      arg = arg.source as SDK.SDKModel.SDKModel;
    }
    if (arg instanceof SDK.SDKModel.SDKModel) {
      arg = arg.target();
    }
    return arg.outermostTarget() !== this.#outermostTarget;
  }

  setOutermostTarget(target: SDK.Target.Target|null): void {
    for (const target of this.#targetManager.targets()) {
      if (this.shouldIgnore(target)) {
        continue;
      }
      for (const modelClass of this.#modelObservers.keysArray()) {
        const model = (target.models().get(modelClass) as SDK.SDKModel.SDKModel);
        if (!model) continue;
        for (const observer of this.#modelObservers.get(modelClass).values()) {
          observer.modelRemoved(model);
        }
      }

      // Iterate over a copy. #observers might be modified during iteration.
      for (const observer of [...this.#observers]) {
        observer.targetRemoved(target);
      }
    }
    this.#outermostTarget = target;
    for (const target of this.#targetManager.targets()) {
      if (this.shouldIgnore(target)) {
        continue;
      }

      for (const observer of [...this.#observers]) {
        observer.targetAdded(target);
      }

      for (const [modelClass, model] of target.models().entries()) {
        for (const observer of this.#modelObservers.get(modelClass).values()) {
          observer.modelAdded(model);
        }
      }
    }
  }

  wrapFunction(wrapable: Function, thisObject?:Object) {
    return (event:any)=>  {
      if (!this.shouldIgnore(event)) wrapable.call(thisObject, event)
    };
  }

  wrap( wrapable: SDK.TargetManager.Observer): SDK.TargetManager.Observer;
  wrap<T>( wrapable: SDK.TargetManager.SDKModelObserver<T>): SDK.TargetManager.SDKModelObserver<T>;
  wrap<Events, T extends keyof Events>( wrapable: Common.EventTarget.EventListener<Events, T>, thisObject?: Object): Common.EventTarget.EventListener<Events, T>;
  wrap(
      wrapable: SDK.TargetManager.Observer|SDK.TargetManager.SDKModelObserver<any>|
      Common.EventTarget.EventListener<any, any>,
      thisObject?: Object) {
    let wrapped = this.#wrapped.get(wrapable);
    if (wrapped) {
      return wrapped;
    }
    if (wrapable instanceof Function) {
      wrapped = this.wrapFunction(wrapable, thisObject);
    } else {
      wrapped = {};
    }
    if ('targetAdded' in wrapable && wrapable.targetAdded instanceof Function) {
      wrapped.targetAdded = this.wrapFunction(wrapable.targetAdded, wrapable);
    }
    if ('targetRemoved' in wrapable && wrapable.targetRemoved instanceof Function) {
      wrapped.targetRemoved = this.wrapFunction(wrapable.targetRemoved, wrapable);
    }
    if ('modelAdded' in wrapable && wrapable.modelAdded instanceof Function) {
      wrapped.modelAdded = this.wrapFunction(wrapable.modelAdded, wrapable);
    }
    if ('modelRemoved' in wrapable && wrapable.modelRemoved instanceof Function) {
      wrapped.modelRemoved = this.wrapFunction(wrapable.modelRemoved, wrapable);
    }
    this.#wrapped.set(wrapable, wrapped);
    return wrapped;
  }
}

function isEvent(arg: any): arg is Common.EventTarget.EventTargetEvent<any, any> {
  return 'source' in arg && arg.source instanceof SDK.SDKModel.SDKModel;
}
