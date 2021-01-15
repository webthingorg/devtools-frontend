// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import {ls} from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export class RequestInitiatorView extends UI.Widget.VBox {
  /**
   * @param {!SDK.NetworkRequest.NetworkRequest} request
   */
  constructor(request) {
    super();
    this.registerRequiredCSS('network/requestInitiatorView.css', {enableLegacyPatching: false});
    this.element.classList.add('request-initiator-view');
    /** @type {!Components.Linkifier.Linkifier} */
    this._linkifier = new Components.Linkifier.Linkifier();
    this._request = request;
    this._emptyWidget = new UI.EmptyWidget.EmptyWidget(Common.UIString.UIString('This request has no initiator data.'));
    this._emptyWidget.show(this.element);
    this._hasShown = false;
  }

  /**
   * @param {!SDK.NetworkRequest.NetworkRequest} request
   * @param {!Components.Linkifier.Linkifier} linkifier
   * @param {boolean=} focusableLink
   * @param {function()=} callback
   * @return {?{element: !Element, links: !Array<!Element>}}
   */
  static createStackTracePreview(request, linkifier, focusableLink, callback) {
    const initiator = request.initiator();
    if (!initiator || !initiator.stack) {
      return null;
    }
    const networkManager = SDK.NetworkManager.NetworkManager.forRequest(request);
    const target = networkManager ? networkManager.target() : null;
    const stackTrace = Components.JSPresentationUtils.buildStackTracePreviewContents(
        target, linkifier, {stackTrace: initiator.stack, contentUpdated: callback, tabStops: focusableLink});
    return stackTrace;
  }

  /**
   * @preturn {!UI.TreeOutline.TreeOutlineInShadow}
   */
  _createSection() {
    const section = document.createElement('div');
    section.classList.add('request-initiator-view-section');
    const treeOutline = new UI.TreeOutline.TreeOutlineInShadow();
    treeOutline.registerRequiredCSS('network/requestInitiatorViewTree.css', {enableLegacyPatching: true});
    section.appendChild(treeOutline.element);
    this.element.appendChild(section);

    return treeOutline;
  }

  /**
   * @param {!SDK.NetworkLog.InitiatorGraph} initiatorGraph
   * @param {string} title
   * @param {!UI.TreeOutline.TreeOutlineInShadow} tree
   */
  _buildRequestChainTree(initiatorGraph, title, tree) {
    const root = new UI.TreeOutline.TreeElement(title);

    tree.appendChild(root);

    if (root.titleElement instanceof HTMLElement) {
      root.titleElement.classList.add('request-initiator-view-section-title');
    }

    const initiators = initiatorGraph.initiators;
    /** @type {!UI.TreeOutline.TreeElement} */
    let parent = root;
    for (const request of Array.from(initiators).reverse()) {
      const treeElement = new UI.TreeOutline.TreeElement(request.url());
      parent.appendChild(treeElement);
      parent.expand();
      parent = treeElement;
    }

    root.expand();
    parent.select();
    const titleElement = parent.titleElement;
    if (titleElement instanceof HTMLElement) {
      titleElement.style.fontWeight = 'bold';
    }

    const initiated = initiatorGraph.initiated;
    this._depthFirstSearchTreeBuilder(initiated, /** @type {!UI.TreeOutline.TreeElement} */ (parent), this._request);
    return root;
  }

  /**
   * @param {!Map<!SDK.NetworkRequest.NetworkRequest, !SDK.NetworkRequest.NetworkRequest>} initiated
   * @param {!UI.TreeOutline.TreeElement} parentElement
   * @param {!SDK.NetworkRequest.NetworkRequest} parentRequest
   */
  _depthFirstSearchTreeBuilder(initiated, parentElement, parentRequest) {
    const visited = new Set();
    // this._request should be already in the tree when build initiator part
    visited.add(this._request);
    for (const request of initiated.keys()) {
      if (initiated.get(request) === parentRequest) {
        const treeElement = new UI.TreeOutline.TreeElement(request.url());
        parentElement.appendChild(treeElement);
        parentElement.expand();
        // only do dfs when we haven't done one
        if (!visited.has(request)) {
          visited.add(request);
          this._depthFirstSearchTreeBuilder(initiated, treeElement, request);
        }
      }
    }
  }

  /**
   * @param {!Element} content
   * @param {string} title
   * @param {!UI.TreeOutline.TreeOutlineInShadow} tree
   */
  _buildStackTraceSection(content, title, tree) {
    const root = new UI.TreeOutline.TreeElement(title);
    tree.appendChild(root);

    if (root.titleElement instanceof HTMLElement) {
      root.titleElement.classList.add('request-initiator-view-section-title');
    }

    const contentElement = new UI.TreeOutline.TreeElement(content, false);

    root.appendChild(contentElement);
    root.expand();
  }

  /**
   * @override
   */
  wasShown() {
    if (this._hasShown) {
      return;
    }
    let initiatorDataPresent = false;
    /** @type {?UI.TreeOutline.TreeOutlineInShadow} */
    let containerTree = null;

    const stackTracePreview = RequestInitiatorView.createStackTracePreview(this._request, this._linkifier, true);

    if (stackTracePreview) {
      initiatorDataPresent = true;
      containerTree = this._createSection();
      this._buildStackTraceSection(stackTracePreview.element, ls`Request call stack`, containerTree);
    }

    const initiatorGraph = SDK.NetworkLog.NetworkLog.instance().initiatorGraphForRequest(this._request);

    if (initiatorGraph.initiators.size > 1 || initiatorGraph.initiated.size > 1) {
      initiatorDataPresent = true;
      containerTree = containerTree || this._createSection();
      this._buildRequestChainTree(initiatorGraph, ls`Request initiator chain`, containerTree);
    }

    const firstChild = containerTree ? containerTree.firstChild() : null;

    if (firstChild) {
      firstChild.select(true);
    }

    if (initiatorDataPresent) {
      this._emptyWidget.hideWidget();
    }
    this._hasShown = true;
  }
}
