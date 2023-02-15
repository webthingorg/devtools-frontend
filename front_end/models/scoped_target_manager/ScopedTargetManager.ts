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
  #modelListeners: Platform.MapUtilities.Multimap<string|symbol|number, {
    modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel,
    thisObject: (Object|undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: Common.EventTarget.EventListener<any, any>,
  }>;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #modelObservers: Platform.MapUtilities
      .Multimap<new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel, SDK.TargetManager.SDKModelObserver<any>>;
  readonly #wrappedModelObservers: Map<SDK.TargetManager.SDKModelObserver<any>, SDK.TargetManager.SDKModelObserver<any>>;
  readonly #wrappedTargetObservers: Map<SDK.TargetManager.Observer, SDK.TargetManager.Observer>;
  readonly #wrappedModelListeners: Map<Common.EventTarget.EventListener<any, any>, Common.EventTarget.EventListener<any, any>>;

  private constructor() {
    this.#targetManager = SDK.TargetManager.TargetManager.instance();
    this.#outermostTarget = null;
    this.#observers = new Set();
    this.#modelListeners = new Platform.MapUtilities.Multimap();
    this.#modelObservers = new Platform.MapUtilities.Multimap();
    this.#wrappedModelObservers = new Map();
    this.#wrappedTargetObservers = new Map();
    this.#wrappedModelListeners = new Map();
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
    const wrappedObserver = this.wrapModelObserver(observer);
    this.#modelObservers.set(modelClass, wrappedObserver);
    this.#targetManager.observeModels(modelClass, wrappedObserver);
  }

  unobserveModels<T extends SDK.SDKModel.SDKModel>(modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel, observer: SDK.TargetManager.SDKModelObserver<T>): void {
    const wrappedObserver = this.wrapModelObserver(observer);
    this.#modelObservers.delete(modelClass, wrappedObserver);
    this.#targetManager.unobserveModels(modelClass, wrappedObserver);
  }

  addModelListener<Events, T extends keyof Events>(
      modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<Events>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object): void {
    this.#targetManager.addModelListener(modelClass, eventType, this.wrapModelListener(listener), thisObject);
  }

  removeModelListener<Events, T extends keyof Events>(
      modelClass: new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<Events>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object): void {
    this.#targetManager.removeModelListener(modelClass, eventType, this.wrapModelListener(listener), thisObject);
  }

  observeTargets(targetObserver: SDK.TargetManager.Observer): void {
    const wrappedObserver = this.wrapTargetObserver(targetObserver);
    this.#observers.add(wrappedObserver);
    this.#targetManager.observeTargets(wrappedObserver);
  }

  unobserveTargets(targetObserver: SDK.TargetManager.Observer): void {
    const wrappedObserver = this.wrapTargetObserver(targetObserver);
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

  shouldIgnore(arg: SDK.ResourceTreeModel.ResourceTreeFrame|SDK.SDKModel.SDKModel|SDK.Target.Target): boolean {
    if (arg instanceof SDK.ResourceTreeModel.ResourceTreeFrame) {
      arg = arg.resourceTreeModel();
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

  wrapModelObserver<T extends SDK.SDKModel.SDKModel>(observer: SDK.TargetManager.SDKModelObserver<T>): SDK.TargetManager.SDKModelObserver<T> {
    let wrapped = this.#wrappedModelObservers.get(observer);
    if (wrapped)
    return wrapped;
    wrapped = {
      modelAdded: (model: T): void => {
        if (!this.shouldIgnore(model)) observer.modelAdded(model);
      },
      modelRemoved: (model: T): void => {
        if (!this.shouldIgnore(model))observer.modelRemoved(model);
      },
    };
    this.#wrappedModelObservers.set(observer, wrapped);
    return wrapped;
  }

  wrapTargetObserver(observer: SDK.TargetManager.Observer): SDK.TargetManager.Observer {
    let wrapped = this.#wrappedTargetObservers.get(observer);
    if (wrapped)
    return wrapped;
    wrapped = {
      targetAdded: (target: SDK.Target.Target): void => {
        if (!this.shouldIgnore(target)) observer.targetAdded(target);
      },
      targetRemoved: (target: SDK.Target.Target): void => {
        if (!this.shouldIgnore(target)) observer.targetRemoved(target);
      },
    };
    this.#wrappedTargetObservers.set(observer, wrapped);
    return wrapped;
  }

  wrapModelListener<Events, T extends keyof Events>(listener: Common.EventTarget.EventListener<Events, T>):
      Common.EventTarget.EventListener<Events, T> {
    let wrapped = this.#wrappedModelListeners.get(listener);
    if (wrapped)
    return wrapped;
    const that = this;
    wrapped = function(this:Object|undefined, event) {
      const model = event.source as SDK.SDKModel.SDKModel;
      if (!that.shouldIgnore(model)) listener.call(this, event)
    };
    this.#wrappedModelListeners.set(listener, wrapped);
    return wrapped;
  }
}
