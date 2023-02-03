// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview A description of this module.  What would someone
 * new to your team want to know about the code in this file?
 * (DO NOT SUBMIT as is; replace this comment.)
 */

import type * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';

const instances: ScopedTargetObserver[] = [];
const instanceObservers: ((_: ScopedTargetObserver) => void)[] = [];

export class ScopedTargetObserver implements SDK.TargetManager.Observer, SDK.TargetManager.SDKModelObserver<any> {
  #owner: any;
  #outermostTarget: SDK.Target.Target|null;
  #modelClass: (new(arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<any>)|null;
  constructor(owner: any) {
    this.#owner = owner;
    this.#outermostTarget = null;
    this.#modelClass = null;
    instances.push(this);
    queueMicrotask(() => {
      for (const instanceObserver of instanceObservers) {
        instanceObserver(this);
      }
    });
  }

  static instances(): ScopedTargetObserver[] {
    return [...instances];
  }

  static observeInstances(observer: (_: ScopedTargetObserver) => void): void {
    instanceObservers.push(observer);
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

  modelAdded(model: SDK.SDKModel.SDKModel): void {
    this.#modelClass = model.constructor as new (arg1: SDK.Target.Target) => SDK.SDKModel.SDKModel<any>;
    if (this.shouldIgnore(model)) {
      return;
    }
    if ('modelAdded' in this.#owner) {
      this.#owner.modelAdded(model);
    }
  }

  modelRemoved(model: SDK.SDKModel.SDKModel): void {
    if (this.shouldIgnore(model)) {
      return;
    }
    if ('modelRemoved' in this.#owner) {
      this.#owner.modelRemoved(model);
    }
  }

  targetAdded(target: SDK.Target.Target): void {
    if (this.shouldIgnore(target)) {
      return;
    }
    if ('targetAdded' in this.#owner) {
      this.#owner.targetAdded(target);
    }
  }

  targetRemoved(target: SDK.Target.Target): void {
    if (this.shouldIgnore(target)) {
      return;
    }
    if ('targetRemoved' in this.#owner) {
      this.#owner.targetRemoved(target);
    }
  }

  modelEventListener<Events, T extends keyof Events>(
      listener: Common.EventTarget.EventListener<Events, T>,
      thisObject?: Object): Common.EventTarget.EventListener<Events, T> {
    return (event: Common.EventTarget.EventTargetEvent<Events[T]>) => {
      const model = event.source as SDK.SDKModel.SDKModel;
      if (this.shouldIgnore(model)) {
        return;
      }
      listener.call(thisObject, event);
    };
  }

  setOutermostTarget(target: SDK.Target.Target|null): void {
    const targets = SDK.TargetManager.TargetManager.instance().targets();
    const models = this.#modelClass ? SDK.TargetManager.TargetManager.instance().models(this.#modelClass) : [];
    for (const target of targets) {
      this.targetRemoved(target);
    }
    for (const model of models) {
      this.modelRemoved(model);
    }
    queueMicrotask(() => {
      this.#outermostTarget = target;
      for (const target of targets) {
        this.targetAdded(target);
      }
      for (const model of models) {
        this.modelAdded(model);
      }
    });
  }
}

let staticInstance: ScopedTargetObserver|null = null;

export function modelEventListener<Events, T extends keyof Events>(
    listener: Common.EventTarget.EventListener<Events, T>,
    thisObject?: Object): Common.EventTarget.EventListener<Events, T> {
  staticInstance = staticInstance || new ScopedTargetObserver({});
  return staticInstance.modelEventListener(listener, thisObject);
}

export function shouldIgnore(arg: SDK.ResourceTreeModel.ResourceTreeFrame|SDK.SDKModel.SDKModel|
                             SDK.Target.Target): boolean {
  staticInstance = staticInstance || new ScopedTargetObserver({});
  return staticInstance.shouldIgnore(arg);
}
