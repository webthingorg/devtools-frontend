// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Host from '../host/host.js';  // eslint-disable-line no-unused-vars

import {MultitargetNetworkManager} from './NetworkManager.js';
import {Events as ResourceTreeModelEvents, ResourceTreeFrame, ResourceTreeModel} from './ResourceTreeModel.js';  // eslint-disable-line no-unused-vars
import {TargetManager} from './SDKModel.js';

/** @typedef {{success: ?boolean, errorDescription: ?Host.ResourceLoader.LoadErrorDescription, frameId: !Protocol.Page.FrameId, url: string, size: ?number}} */
let PageResource;  // eslint-disable-line no-unused-vars

/** @type {?PageResourceLoader} */
let pageResourceLoader = null;

/**
 * The page resource loader is a bottleneck for all DevTools-initiated resource loads. It keeps a `PageResource` that
 * describes the load around for displaying. This is used to report to the user which resources were loaded, and
 * whether there was a load error.
 */
export class PageResourceLoader extends Common.ObjectWrapper.ObjectWrapper {
  constructor() {
    super();
    this._currentlyLoading = 0;
    this._maxConcurrentLoads = 500;
    /** @type{!Map<string, !PageResource>} */
    this._pageResources = new Map();
    /** @type {!Array<!{resolve:function():void, reject:function(*):void}>} */
    this._queuedLoads = [];
    TargetManager.instance().addModelListener(
        ResourceTreeModel, ResourceTreeModelEvents.MainFrameNavigated, this._onMainFrameNavigated, this);
  }

  /**
   *
   * @param {*} event
   */
  _onMainFrameNavigated(event) {
    const mainFrame = /** @type {!ResourceTreeFrame} */ (event.data);
    if (!mainFrame.isTopFrame()) {
      return;
    }
    for (const {reject} of this._queuedLoads) {
      reject(new Error(ls`Load aborted due to reload of inspected page`));
    }
    this._queuedLoads = [];
    this._pageResources.clear();
    this.dispatchEventToListeners(Events.Update);
  }

  /**
   * @param {{forceNew: boolean}} opts
   */
  static instance({forceNew} = {forceNew: false}) {
    if (!pageResourceLoader || forceNew) {
      pageResourceLoader = new PageResourceLoader();
    }

    return pageResourceLoader;
  }

  getResourcesLoaded() {
    return this._pageResources;
  }

  getNumberOfResources() {
    return {loading: this._currentlyLoading, loaded: this._pageResources.size};
  }

  async _acquireLoadSlot() {
    this._currentlyLoading++;
    if (this._currentlyLoading >= this._maxConcurrentLoads) {
      /** @type {!{resolve:function():void, reject:function():void}} */
      const pair = {resolve: () => {}, reject: () => {}};
      const waitForCapacity = new Promise((resolve, reject) => {
        pair.resolve = resolve;
        pair.reject = reject;
      });
      this._queuedLoads.push(pair);
      await waitForCapacity;
    }
  }

  _releaseLoadSlot() {
    this._currentlyLoading--;
    const entry = this._queuedLoads.shift();
    if (entry) {
      entry.resolve();
    }
  }

  /**
   * @param {string} url
   * @param {!Protocol.Page.FrameId} frameId
   * @return {!Promise<!{success: boolean, content: string, errorDescription: !Host.ResourceLoader.LoadErrorDescription}>}
   */
  async loadResource(url, frameId) {
    const key = `${url}-${frameId}`;
    /** @type {!PageResource} */
    const pageResource = {success: null, size: null, errorDescription: null, url, frameId};
    this._pageResources.set(key, pageResource);
    this.dispatchEventToListeners(Events.Update);
    try {
      await this._acquireLoadSlot();
      const result = await MultitargetNetworkManager.instance().loadResource(url);
      const size = result.content ? result.content.length : 0;
      pageResource.size = size;
      pageResource.errorDescription = result.errorDescription;
      pageResource.success = result.success;
      return result;
    } finally {
      this._releaseLoadSlot();
      this.dispatchEventToListeners(Events.Update);
    }
  }
}

/** @enum {symbol} */
export const Events = {
  Update: Symbol('Update')
};
