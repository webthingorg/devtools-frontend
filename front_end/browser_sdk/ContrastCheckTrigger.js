// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Root from '../root/root.js';
import * as SDK from '../sdk/sdk.js';

/** @type {?ContrastCheckTrigger} */
let contrastCheckTriggerInstance = null;

export class ContrastCheckTrigger extends Common.ObjectWrapper.ObjectWrapper {
  constructor() {
    super();
    /** @type {!WeakMap<!SDK.ResourceTreeModel.ResourceTreeModel, !Common.EventTarget.EventDescriptor>} */
    this._eventListeners = new WeakMap();
    SDK.SDKModel.TargetManager.instance().observeModels(SDK.ResourceTreeModel.ResourceTreeModel, this);
  }

  /**
   * @param {{forceNew: boolean}} opts
   * @return {!ContrastCheckTrigger}
   */
  static instance({forceNew} = {forceNew: false}) {
    if (!contrastCheckTriggerInstance || forceNew) {
      contrastCheckTriggerInstance = new ContrastCheckTrigger();
    }

    return contrastCheckTriggerInstance;
  }

  /**
   * @override
   * @param {!SDK.ResourceTreeModel.ResourceTreeModel} resourceTreeModel
   */
  async modelAdded(resourceTreeModel) {
    // If the target document finished loading, check the contrast immediately.
    // Otherwise, it should be triggered when the page load event fires.
    const response = await resourceTreeModel.target().runtimeAgent().invoke_evaluate(
        {expression: 'document.readyState', returnByValue: true});
    const readyState = response.result.value;
    if (readyState === 'complete') {
      this._checkContrast(resourceTreeModel);
    }
    const listener = resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.Load, this._pageLoaded, this);
    this._eventListeners.set(resourceTreeModel, listener);
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeModel} resourceTreeModel
   */
  _checkContrast(resourceTreeModel) {
    if (!Root.Runtime.experiments.isEnabled('contrastIssues')) {
      return;
    }
    resourceTreeModel.target().auditsAgent().invoke_checkContrast();
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _pageLoaded(event) {
    const {resourceTreeModel} =
        /** @type {{resourceTreeModel: !SDK.ResourceTreeModel.ResourceTreeModel}} */ (event.data);
    this._checkContrast(resourceTreeModel);
  }

  /**
   * @override
   * @param {!SDK.ResourceTreeModel.ResourceTreeModel} resourceTreeModel
   */
  modelRemoved(resourceTreeModel) {
    const listener = this._eventListeners.get(resourceTreeModel);
    if (listener) {
      Common.EventTarget.EventTarget.removeEventListeners([listener]);
    }
  }
}
