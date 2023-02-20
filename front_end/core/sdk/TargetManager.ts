// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Platform from '../platform/platform.js';
import type * as ProtocolClient from '../protocol_client/protocol_client.js';
import type * as Protocol from '../../generated/protocol.js';
// import {type ResourceTreeFrame} from './ResourceTreeModel.js'
import {Type as TargetType} from './Target.js';
import {Target} from './Target.js';
import {SDKModel} from './SDKModel.js';
import * as Root from '../root/root.js';
import * as Host from '../host/host.js';

let targetManagerInstance: TargetManager|undefined;
type ModelClass<T = SDKModel> = new (arg1: Target) => T;

export class TargetManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
  #targetsInternal: Set<Target>;
  readonly #observers: Set<Observer>;
  #modelListeners: Platform.MapUtilities.Multimap<string|symbol|number, {
    modelClass: ModelClass,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: Common.EventTarget.EventListener<any, any>,
  }>;
  #wrappedModelListeners: Map<Common.EventTarget.EventListener<any, any>, Common.EventTarget.EventListener<any, any>>;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #modelObservers:
      Platform.MapUtilities.Multimap<ModelClass, SDKModelObserver<any>>;
  #unscopedObservers: Set<Object>;
  #isSuspended: boolean;
  #browserTargetInternal: Target|null;
  #scopeTarget: Target|null;

  private constructor() {
    super();
    this.#targetsInternal = new Set();
    this.#observers = new Set();
    this.#modelListeners = new Platform.MapUtilities.Multimap();
    this.#modelObservers = new Platform.MapUtilities.Multimap();
    this.#isSuspended = false;
    this.#browserTargetInternal = null;
    this.#scopeTarget = null;
    this.#unscopedObservers = new Set();
    this.#wrappedModelListeners = new Map();
  }

  static instance({forceNew}: {
    forceNew: boolean,
  } = {forceNew: false}): TargetManager {
    if (!targetManagerInstance || forceNew) {
      targetManagerInstance = new TargetManager();
    }

    return targetManagerInstance;
  }

  static removeInstance(): void {
    targetManagerInstance = undefined;
  }

  onInspectedURLChange(target: Target): void {
    this.dispatchEventToListeners(Events.InspectedURLChanged, target);
  }

  onNameChange(target: Target): void {
    this.dispatchEventToListeners(Events.NameChanged, target);
  }

  async suspendAllTargets(reason?: string): Promise<void> {
    if (this.#isSuspended) {
      return;
    }
    this.#isSuspended = true;
    this.dispatchEventToListeners(Events.SuspendStateChanged);
    const suspendPromises = Array.from(this.#targetsInternal.values(), target => target.suspend(reason));
    await Promise.all(suspendPromises);
  }

  async resumeAllTargets(): Promise<void> {
    if (!this.#isSuspended) {
      return;
    }
    this.#isSuspended = false;
    this.dispatchEventToListeners(Events.SuspendStateChanged);
    const resumePromises = Array.from(this.#targetsInternal.values(), target => target.resume());
    await Promise.all(resumePromises);
  }

  allTargetsSuspended(): boolean {
    return this.#isSuspended;
  }

  models<T extends SDKModel>(modelClass: ModelClass<T>, scoped: boolean = false): T[] {
    const result = [];
    for (const target of this.#targetsInternal) {
      if (scoped && !this.isInScope(target)) {
        continue;
      }
      const model = target.model(modelClass);
      if (!model) {
        continue;
      }
      result.push(model);
    }
    return result;
  }

  inspectedURL(): string {
    const mainTarget = this.mainFrameTarget();
    return mainTarget ? mainTarget.inspectedURL() : '';
  }

  observeModels<T extends SDKModel>(modelClass: ModelClass<T>, observer: SDKModelObserver<T>, scoped: boolean = false): void {
    const models = this.models(modelClass, scoped);
    this.#modelObservers.set(modelClass, observer);
    if (!scoped)
      this.#unscopedObservers.add(observer);
    for (const model of models) {
      observer.modelAdded(model);
    }
  }

  unobserveModels<T extends SDKModel>(modelClass: ModelClass<T>, observer: SDKModelObserver<T>, scoped: boolean = false): void {
    this.#modelObservers.delete(modelClass, observer);
    if (!scoped)
      this.#unscopedObservers.delete(observer);
  }

  modelAdded(target: Target, modelClass: ModelClass, model: SDKModel): void {
    for (const observer of this.#modelObservers.get(modelClass).values()) {
      if (this.#unscopedObservers.has(observer) || this.isInScope(model)) {
        observer.modelAdded(model);
      }
    }
  }

  private modelRemoved(target: Target, modelClass: ModelClass, model: SDKModel): void {
    for (const observer of this.#modelObservers.get(modelClass).values()) {
      if (this.#unscopedObservers.has(observer) || this.isInScope(model)) {
        observer.modelRemoved(model);
      }
    }
  }

  addModelListener<Events, T extends keyof Events>(
      modelClass: ModelClass<SDKModel<Events>>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object, scoped: boolean = false): void {
    const wrappedListener = this.wrapModelListener(listener, thisObject, scoped);
    for (const model of this.models(modelClass)) {
      model.addEventListener(eventType, wrappedListener);
    }
    this.#modelListeners.set(eventType, {modelClass, listener: wrappedListener});
  }

  removeModelListener<Events, T extends keyof Events>(
      modelClass: ModelClass<SDKModel<Events>>, eventType: T,
      listener: Common.EventTarget.EventListener<Events, T>, thisObject?: Object, scoped: boolean = false): void {
    if (!this.#modelListeners.has(eventType)) {
      return;
    }
    const wrappedListener = this.wrapModelListener(listener, thisObject, scoped);
    for (const model of this.models(modelClass)) {
      model.removeEventListener(eventType, wrappedListener);
    }

    for (const info of this.#modelListeners.get(eventType)) {
      if (info.modelClass === modelClass && info.listener === listener) {
        this.#modelListeners.delete(eventType, info);
      }
    }
    this.#wrappedModelListeners.delete(listener);
  }

  observeTargets(targetObserver: Observer, scoped: boolean = false): void {
    if (this.#observers.has(targetObserver)) {
      throw new Error('Observer can only be registered once');
    }
    if (!scoped) {
      this.#unscopedObservers.add(targetObserver);
    }
    for (const target of this.#targetsInternal) {
      if (!scoped || this.isInScope(target)) {
        targetObserver.targetAdded(target);
      }
    }
    this.#observers.add(targetObserver);
  }

  unobserveTargets(targetObserver: Observer, scoped: boolean = false): void {
    this.#observers.delete(targetObserver);
    this.#unscopedObservers.delete(targetObserver);
  }

  createTarget(
      id: Protocol.Target.TargetID|'main', name: string, type: TargetType, parentTarget: Target|null,
      sessionId?: string, waitForDebuggerInPage?: boolean, connection?: ProtocolClient.InspectorBackend.Connection,
      targetInfo?: Protocol.Target.TargetInfo): Target {
    const target = new Target(
        this, id, name, type, parentTarget, sessionId || '', this.#isSuspended, connection || null, targetInfo);
    if (waitForDebuggerInPage) {
      void target.pageAgent().invoke_waitForDebugger();
    }
    target.createModels(new Set(this.#modelObservers.keysArray()));
    this.#targetsInternal.add(target);

    // Iterate over a copy. #observers might be modified during iteration.
    for (const observer of [...this.#observers]) {
      if (this.#unscopedObservers.has(observer) || this.isInScope(target)) {
        observer.targetAdded(target);
      }
    }

    for (const [modelClass, model] of target.models().entries()) {
      this.modelAdded(target, modelClass, model);
    }

    for (const key of this.#modelListeners.keysArray()) {
      for (const info of this.#modelListeners.get(key)) {
        const model = target.model(info.modelClass);
        if (model) {
          model.addEventListener(key, info.listener);
        }
      }
    }

    return target;
  }

  removeTarget(target: Target): void {
    if (!this.#targetsInternal.has(target)) {
      return;
    }

    this.#targetsInternal.delete(target);
    for (const modelClass of target.models().keys()) {
      const model = (target.models().get(modelClass) as SDKModel);
      this.modelRemoved(target, modelClass, model);
    }

    // Iterate over a copy. #observers might be modified during iteration.
    for (const observer of [...this.#observers]) {
      if (this.#unscopedObservers.has(observer) || this.isInScope(target)) {
        observer.targetRemoved(target);
      }
    }

    for (const key of this.#modelListeners.keysArray()) {
      for (const info of this.#modelListeners.get(key)) {
        const model = target.model(info.modelClass);
        if (model) {
          model.removeEventListener(key, info.listener);
        }
      }
    }
  }

  targets(): Target[] {
    return [...this.#targetsInternal];
  }

  targetById(id: string): Target|null {
    // TODO(dgozman): add a map #id -> #target.
    return this.targets().find(target => target.id() === id) || null;
  }

  mainTarget(): Target|null {
    return this.#targetsInternal.size ? this.#targetsInternal.values().next().value : null;
  }

  mainFrameTarget(): Target|null {
    let target = this.mainTarget();
    if (target?.type() === TargetType.Tab) {
      target =
          this.targets().find(
              t => t.parentTarget() === target && t.type() === TargetType.Frame && !t.targetInfo()?.subtype?.length) ||
          null;
    }
    return target;
  }

  browserTarget(): Target|null {
    return this.#browserTargetInternal;
  }

  async maybeAttachInitialTarget(): Promise<boolean> {
    if (!Boolean(Root.Runtime.Runtime.queryParam('browserConnection'))) {
      return false;
    }
    if (!this.#browserTargetInternal) {
      this.#browserTargetInternal = new Target(
          this, /* #id*/ 'main', /* #name*/ 'browser', TargetType.Browser, /* #parentTarget*/ null,
          /* #sessionId */ '', /* suspended*/ false, /* #connection*/ null, /* targetInfo*/ undefined);
      this.#browserTargetInternal.createModels(new Set(this.#modelObservers.keysArray()));
    }
    const targetId =
        await Host.InspectorFrontendHost.InspectorFrontendHostInstance.initialTargetId() as Protocol.Target.TargetID;
    // Do not await for Target.autoAttachRelated to return, as it goes throguh the renderer and we don't want to block early
    // at front-end initialization if a renderer is stuck. The rest of #target discovery and auto-attach process should happen
    // asynchronously upon Target.attachedToTarget.
    void this.#browserTargetInternal.targetAgent().invoke_autoAttachRelated({
      targetId,
      waitForDebuggerOnStart: true,
    });
    return true;
  }

  clearAllTargetsForTest(): void {
    this.#targetsInternal.clear();
  }

  isInScope(arg: /*ResourceTreeFrame|*/SDKModel|Target|Common.EventTarget.EventTargetEvent<any, any>|null): boolean {
    if (!arg) return false;
    // if (arg instanceof ResourceTreeFrame) {
    //   arg = arg.resourceTreeModel();
    // }
    if (isEvent(arg)) {
      arg = arg.source as SDKModel;
    }
    if (arg instanceof SDKModel) {
      arg = arg.target();
    }
    while (arg && arg !== this.#scopeTarget) {
      arg = arg.parentTarget();
    }
    return arg === this.#scopeTarget;
  }

  setScopeTarget(scopeTarget: Target|null) {
    for (const target of this.targets()) {
      if (!this.isInScope(target)) {
        continue;
      }
      for (const modelClass of this.#modelObservers.keysArray()) {
        const model = (target.models().get(modelClass) as SDKModel);
        if (!model) continue;
        for (const observer of this.#modelObservers.get(modelClass).values()) {
          if (this.#unscopedObservers.has(observer)) {
            continue;
          }
          observer.modelRemoved(model);
        }
      }

      // Iterate over a copy. #observers might be modified during iteration.
      for (const observer of [...this.#observers]) {
        if (this.#unscopedObservers.has(observer)) {
          continue;
        }
        observer.targetRemoved(target);
      }
    }
    this.#scopeTarget = scopeTarget;
    for (const target of this.targets()) {
      if (!this.isInScope(target)) {
        continue;
      }

      for (const observer of [...this.#observers]) {
        if (this.#unscopedObservers.has(observer)) {
          continue;
        }
        observer.targetAdded(target);
      }

      for (const [modelClass, model] of target.models().entries()) {
        for (const observer of this.#modelObservers.get(modelClass).values()) {
          if (this.#unscopedObservers.has(observer)) {
            continue;
          }
          observer.modelAdded(model);
        }
      }
    }
  }

  wrapModelListener(
      listener: Common.EventTarget.EventListener<any, any>, thisObject: Object|undefined, scoped: boolean) {
    let wrappedListener = this.#wrappedModelListeners.get(listener);
    if (wrappedListener) {
      return wrappedListener;
    }
    wrappedListener = (event: any) => {
      if (!scoped || !this.isInScope(event))
        listener.call(thisObject, event)
    };
    this.#wrappedModelListeners.set(listener, wrappedListener);
    return wrappedListener;
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  AvailableTargetsChanged = 'AvailableTargetsChanged',
  InspectedURLChanged = 'InspectedURLChanged',
  NameChanged = 'NameChanged',
  SuspendStateChanged = 'SuspendStateChanged',
}

export type EventTypes = {
  [Events.AvailableTargetsChanged]: Protocol.Target.TargetInfo[],
  [Events.InspectedURLChanged]: Target,
  [Events.NameChanged]: Target,
  [Events.SuspendStateChanged]: void,
};

export class Observer {
  targetAdded(_target: Target): void {
  }
  targetRemoved(_target: Target): void {
  }
}

export class SDKModelObserver<T> {
  modelAdded(_model: T): void {
  }
  modelRemoved(_model: T): void {
  }
}


function isEvent(arg: any): arg is Common.EventTarget.EventTargetEvent<any, any> {
  return 'source' in arg && arg.source instanceof SDKModel;
}
