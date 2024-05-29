// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';

import * as Spec from './web-vitals-injected/spec/spec.js';

const LIVE_METRICS_WORLD_NAME = 'live_metrics_world';

class InjectedScript {
  static #injectedScript?: string;
  static async get(): Promise<string> {
    if (!this.#injectedScript) {
      const url = new URL('./web-vitals-injected/web-vitals-injected.generated.js', import.meta.url);
      const result = await fetch(url);
      this.#injectedScript = await result.text();
    }
    return this.#injectedScript;
  }
}

export class LiveMetrics extends Common.ObjectWrapper.ObjectWrapper<EventTypes> implements SDK.TargetManager.Observer {
  #target?: SDK.Target.Target;
  #scriptIdentifier?: Protocol.Page.ScriptIdentifier;

  constructor() {
    super();
    SDK.TargetManager.TargetManager.instance().observeTargets(this);
  }

  async #getIsolatedContextId(): Promise<Protocol.Runtime.ExecutionContextId|null> {
    if (!this.#target) {
      return null;
    }

    const resourceTreeModel = this.#target.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return null;
    }

    const mainFrameId = resourceTreeModel.mainFrame?.id;
    if (!mainFrameId) {
      return null;
    }

    // Will return previous context ID if it already exists
    const {executionContextId} = await this.#target.pageAgent().invoke_createIsolatedWorld({
      frameId: mainFrameId,
      worldName: LIVE_METRICS_WORLD_NAME,
    });

    return executionContextId;
  }

  async #resolveDomNode(index: number): Promise<SDK.DOMModel.DOMNode|null> {
    if (!this.#target) {
      return null;
    }

    const executionContextId = await this.#getIsolatedContextId();
    if (executionContextId === null) {
      return null;
    }

    const {result} = await this.#target.runtimeAgent().invoke_evaluate({
      expression: `window.getNodeForIndex(${index})`,
      contextId: executionContextId,
    });

    const runtimeModel = this.#target.model(SDK.RuntimeModel.RuntimeModel);
    if (!runtimeModel) {
      return null;
    }

    const domModel = this.#target.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return null;
    }

    const remoteObject = runtimeModel.createRemoteObject(result);
    return domModel.pushObjectAsNodeToFrontend(remoteObject);
  }

  async #onBindingCalled(event: {data: Protocol.Runtime.BindingCalledEvent}): Promise<void> {
    const {data} = event;
    if (data.name !== Spec.EVENT_BINDING_NAME) {
      return;
    }
    const webVitalsEvent = JSON.parse(data.payload) as Spec.WebVitalsEvent;
    switch (webVitalsEvent.name) {
      case 'LCP': {
        const lcpEvent: LCPChangeEvent = {
          value: webVitalsEvent.value,
          rating: webVitalsEvent.rating,
        };
        if (webVitalsEvent.nodeIndex !== undefined) {
          const node = await this.#resolveDomNode(webVitalsEvent.nodeIndex);
          if (node) {
            lcpEvent.node = node;
          }
        }
        this.dispatchEventToListeners(Events.LCPChanged, lcpEvent);
        break;
      }
      case 'CLS': {
        this.dispatchEventToListeners(Events.CLSChanged, {
          value: webVitalsEvent.value,
          rating: webVitalsEvent.rating,
        });
        break;
      }
      case 'INP': {
        const inpEvent: INPChangeEvent = {
          value: webVitalsEvent.value,
          rating: webVitalsEvent.rating,
          interactionType: webVitalsEvent.interactionType,
        };
        if (webVitalsEvent.nodeIndex !== undefined) {
          const node = await this.#resolveDomNode(webVitalsEvent.nodeIndex);
          if (node) {
            inpEvent.node = node;
          }
        }
        this.dispatchEventToListeners(Events.INPChanged, inpEvent);
        break;
      }
      case 'reset': {
        this.dispatchEventToListeners(Events.Reset);
        break;
      }
    }
  }

  targetAdded(target: SDK.Target.Target): void {
    if (target !== SDK.TargetManager.TargetManager.instance().primaryPageTarget()) {
      return;
    }
    void this.enable(target);
  }

  targetRemoved(target: SDK.Target.Target): void {
    if (target !== SDK.TargetManager.TargetManager.instance().primaryPageTarget()) {
      return;
    }
    void this.disable();
  }

  async enable(target: SDK.Target.Target): Promise<void> {
    if (this.#target) {
      return;
    }
    this.#target = target;

    target.targetManager().addModelListener(
        SDK.RuntimeModel.RuntimeModel, SDK.RuntimeModel.Events.BindingCalled, this.#onBindingCalled, this);

    await this.#target.runtimeAgent().invoke_addBinding({
      name: Spec.EVENT_BINDING_NAME,
      executionContextName: LIVE_METRICS_WORLD_NAME,
    });

    const source = await InjectedScript.get();

    const {identifier} = await target.pageAgent().invoke_addScriptToEvaluateOnNewDocument({
      source,
      worldName: LIVE_METRICS_WORLD_NAME,
      includeCommandLineAPI: true,
      runImmediately: true,
    });
    this.#scriptIdentifier = identifier;
  }

  async disable(): Promise<void> {
    if (!this.#target) {
      return;
    }

    if (this.#scriptIdentifier) {
      await this.#target.pageAgent().invoke_removeScriptToEvaluateOnNewDocument({
        identifier: this.#scriptIdentifier,
      });
    }

    await this.#target.runtimeAgent().invoke_removeBinding({
      name: Spec.EVENT_BINDING_NAME,
    });

    this.#target.targetManager().removeModelListener(
        SDK.RuntimeModel.RuntimeModel, SDK.RuntimeModel.Events.BindingCalled, this.#onBindingCalled, this);

    this.#target = undefined;
  }
}

export const enum Events {
  LCPChanged = 'lcp_changed',
  CLSChanged = 'cls_changed',
  INPChanged = 'inp_changed',
  Reset = 'reset',
}

type MetricChangeEvent = Pick<Spec.MetricChangeEvent, 'value'|'rating'>;

interface LCPChangeEvent extends MetricChangeEvent {
  node?: SDK.DOMModel.DOMNode;
}

interface INPChangeEvent extends MetricChangeEvent {
  interactionType: Spec.INPChangeEvent['interactionType'];
  node?: SDK.DOMModel.DOMNode;
}

type CLSChangeEvent = MetricChangeEvent;

type EventTypes = {
  [Events.LCPChanged]: LCPChangeEvent,
  [Events.CLSChanged]: CLSChangeEvent,
  [Events.INPChanged]: INPChangeEvent,
  [Events.Reset]: void,
};
