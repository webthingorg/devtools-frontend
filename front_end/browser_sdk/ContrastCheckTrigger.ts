// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';

let contrastCheckTriggerInstance: ContrastCheckTrigger|null = null;

export class ContrastCheckTrigger extends Common.ObjectWrapper.ObjectWrapper {
  private eventListeners: WeakMap<SDK.ResourceTreeModel.ResourceTreeModel, Common.EventTarget.EventDescriptor> =
      new WeakMap();

  constructor() {
    super();
    SDK.SDKModel.TargetManager.instance().observeModels(SDK.ResourceTreeModel.ResourceTreeModel, this);
  }

  static instance({forceNew}: {forceNew: boolean} = {forceNew: false}): ContrastCheckTrigger {
    if (!contrastCheckTriggerInstance || forceNew) {
      contrastCheckTriggerInstance = new ContrastCheckTrigger();
    }

    return contrastCheckTriggerInstance;
  }

  async modelAdded(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): Promise<void> {
    const listener = resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.Load, this.pageLoaded, this);
    this.eventListeners.set(resourceTreeModel, listener);
    // If the frontend does not know about the main frame, we should not evaluate anything via runtimeAgent.
    if (!resourceTreeModel.mainFrame) {
      return;
    }
    // If the target document finished loading, check the contrast immediately.
    // Otherwise, it should be triggered when the page load event fires.
    const response = await resourceTreeModel.target().runtimeAgent().invoke_evaluate(
        {expression: 'document.readyState', returnByValue: true});
    if (response.result && response.result.value === 'complete') {
      this.checkContrast(resourceTreeModel);
    }
  }

  modelRemoved(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    const listener = this.eventListeners.get(resourceTreeModel);
    if (listener) {
      Common.EventTarget.EventTarget.removeEventListeners([listener]);
    }
  }

  private checkContrast(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    if (!Root.Runtime.experiments.isEnabled('contrastIssues')) {
      return;
    }
    resourceTreeModel.target().auditsAgent().invoke_checkContrast();
  }

  private pageLoaded(event: Common.EventTarget.EventTargetEvent): void {
    const {resourceTreeModel} = event.data as {resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel};
    this.checkContrast(resourceTreeModel);
  }
}
