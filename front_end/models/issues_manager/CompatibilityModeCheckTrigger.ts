// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';

let compatibilityModeCheckTriggerInstance: CompatibilityModeCheckTrigger|null = null;

export class CompatibilityModeCheckTrigger extends Common.ObjectWrapper.ObjectWrapper {
  private pageLoadListeners: WeakMap<SDK.ResourceTreeModel.ResourceTreeModel, Common.EventTarget.EventDescriptor> =
      new WeakMap();
  private frameAddedListeners: WeakMap<SDK.ResourceTreeModel.ResourceTreeModel, Common.EventTarget.EventDescriptor> =
      new WeakMap();

  constructor() {
    super();
    SDK.SDKModel.TargetManager.instance().observeModels(SDK.ResourceTreeModel.ResourceTreeModel, this);
  }

  static instance({forceNew}: {forceNew: boolean} = {forceNew: false}): CompatibilityModeCheckTrigger {
    if (!compatibilityModeCheckTriggerInstance || forceNew) {
      compatibilityModeCheckTriggerInstance = new CompatibilityModeCheckTrigger();
    }

    return compatibilityModeCheckTriggerInstance;
  }

  async modelAdded(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): Promise<void> {
    this.pageLoadListeners.set(
        resourceTreeModel,
        resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.Load, this.pageLoaded, this));
    this.frameAddedListeners.set(
        resourceTreeModel,
        resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.FrameAdded, this.frameAdded, this));
  }

  modelRemoved(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    const pageLoadListener = this.pageLoadListeners.get(resourceTreeModel);
    if (pageLoadListener) {
      Common.EventTarget.EventTarget.removeEventListeners([pageLoadListener]);
    }
    const frameAddedListeners = this.frameAddedListeners.get(resourceTreeModel);
    if (frameAddedListeners) {
      Common.EventTarget.EventTarget.removeEventListeners([frameAddedListeners]);
    }
  }

  private checkCompatibilityMode(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    resourceTreeModel.target().auditsAgent().invoke_checkCompatibilityMode();
  }

  private pageLoaded(event: Common.EventTarget.EventTargetEvent): void {
    const {resourceTreeModel} = event.data as {resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel};
    this.checkCompatibilityMode(resourceTreeModel);
  }

  private async frameAdded(event: Common.EventTarget.EventTargetEvent): Promise<void> {
    const frame = event.data as SDK.ResourceTreeModel.ResourceTreeFrame;
    if (!frame.isMainFrame()) {
      return;
    }
    // If the target document finished loading, check the mode immediately.
    // Otherwise, it should be triggered when the page load event fires.
    const response = await frame.resourceTreeModel().target().runtimeAgent().invoke_evaluate(
        {expression: 'document.readyState', returnByValue: true});
    if (response.result && response.result.value === 'complete') {
      this.checkCompatibilityMode(frame.resourceTreeModel());
    }
  }
}
