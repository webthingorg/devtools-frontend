
// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';

/**
 * Responsible for asking autofill for current form issues. This currently happens when devtools is first open.
 */
// TODO(crbug.com/1399414): Trigger check form issues when an element with an associated issue is editted in the issues panel.
let checkFormsIssuesTriggerInstance: CheckFormsIssuesTrigger|null = null;
export class CheckFormsIssuesTrigger {
  #pageLoadListeners: WeakMap<SDK.ResourceTreeModel.ResourceTreeModel, Common.EventTarget.EventDescriptor> =
      new WeakMap();
  #frameAddedListeners: WeakMap<SDK.ResourceTreeModel.ResourceTreeModel, Common.EventTarget.EventDescriptor> =
      new WeakMap();

  constructor() {
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.ResourceTreeModel.ResourceTreeModel, this);
  }

  static instance({forceNew}: {forceNew: boolean} = {forceNew: false}): CheckFormsIssuesTrigger {
    if (!checkFormsIssuesTriggerInstance || forceNew) {
      checkFormsIssuesTriggerInstance = new CheckFormsIssuesTrigger();
    }
    return checkFormsIssuesTriggerInstance;
  }

  async modelAdded(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): Promise<void> {
    this.#pageLoadListeners.set(
        resourceTreeModel,
        resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.Load, this.#pageLoaded, this));
    this.#frameAddedListeners.set(
        resourceTreeModel,
        resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.FrameAdded, this.#frameAdded, this));
  }

  modelRemoved(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    const pageLoadListener = this.#pageLoadListeners.get(resourceTreeModel);
    if (pageLoadListener) {
      Common.EventTarget.removeEventListeners([pageLoadListener]);
    }
    const frameAddedListeners = this.#frameAddedListeners.get(resourceTreeModel);
    if (frameAddedListeners) {
      Common.EventTarget.removeEventListeners([frameAddedListeners]);
    }
  }

  // TODO(crbug.com/1399414): Handle response by dropping current issues in favor of new ones.
  #checkFormsIssues(resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel): void {
    void resourceTreeModel.target().auditsAgent().invoke_checkFormsIssues();
  }

  #pageLoaded(event: Common.EventTarget
                  .EventTargetEvent<{resourceTreeModel: SDK.ResourceTreeModel.ResourceTreeModel, loadTime: number}>):
      void {
    const {resourceTreeModel} = event.data;
    this.#checkFormsIssues(resourceTreeModel);
  }

  // pageLoad is not emitted on start up but the frameAdded is emitted if the frame already exists and the DevTools is a new instance.
  async #frameAdded(event: Common.EventTarget.EventTargetEvent<SDK.ResourceTreeModel.ResourceTreeFrame>):
      Promise<void> {
    const frame = event.data;
    if (!frame.isMainFrame()) {
      return;
    }
    // If the target document finished loading, check the contrast immediately.
    // Otherwise, it should be triggered when the page load event fires.
    const response = await frame.resourceTreeModel().target().runtimeAgent().invoke_evaluate(
        {expression: 'document.readyState', returnByValue: true});
    if (response.result && response.result.value === 'complete') {
      this.#checkFormsIssues(frame.resourceTreeModel());
    }
  }
}
