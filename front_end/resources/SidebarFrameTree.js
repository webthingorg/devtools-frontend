// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

export class SidebarFrameTree {
  /**
   * @param {!UI.Panel.PanelWithSidebar} storagePanel
   * @param {!UI.TreeOutline.TreeElement} treeElement
   */
  constructor(storagePanel, treeElement) {
    this._panel = storagePanel;
    this._treeElement = treeElement;
    /** @type {!Map<string, !SidebarFrameTreeElement>} */
    this._treeElementForFrameId = new Map();

    /**
     * @param {!SDK.ResourceTreeModel.Events} eventType
     * @param {function(!SDK.ResourceTreeModel.ResourceTreeFrame): void} handler
     * @param {!SidebarFrameTree} target
     */
    function addListener(eventType, handler, target) {
      SDK.SDKModel.TargetManager.instance().addModelListener(
          SDK.ResourceTreeModel.ResourceTreeModel, eventType, event => handler.call(target, event.data));
    }
    addListener(SDK.ResourceTreeModel.Events.FrameAdded, this._frameAdded, this);
    addListener(SDK.ResourceTreeModel.Events.FrameNavigated, this._frameNavigated, this);
    addListener(SDK.ResourceTreeModel.Events.FrameDetached, this._frameDetached, this);

    for (const resourceTreeModel of SDK.SDKModel.TargetManager.instance().models(
             SDK.ResourceTreeModel.ResourceTreeModel)) {
      const mainFrame = resourceTreeModel.mainFrame;
      if (mainFrame) {
        this._frameAdded(mainFrame);
      }
    }
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   * @returns {?SDK.ResourceTreeModel.ResourceTreeFrame}
   */
  static _getParentFrame(frame) {
    const parentFrame = frame.parentFrame;
    if (parentFrame) {
      return parentFrame;
    }
    const parentTarget = frame.resourceTreeModel().target().parentTarget();
    if (!parentTarget) {
      return null;
    }
    return parentTarget.model(SDK.ResourceTreeModel.ResourceTreeModel).mainFrame;
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  _frameAdded(frame) {
    const parentFrame = SidebarFrameTree._getParentFrame(frame);
    const parentTreeElement = parentFrame ? this._treeElementForFrameId.get(parentFrame.globalId) : this._treeElement;
    if (!parentTreeElement) {
      return;
    }
    const frameTreeElement = new SidebarFrameTreeElement(this, frame);
    this._treeElementForFrameId.set(frame.globalId, frameTreeElement);
    parentTreeElement.appendChild(frameTreeElement);
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  _frameDetached(frame) {
    const frameTreeElement = this._treeElementForFrameId.get(frame.globalId);
    if (!frameTreeElement) {
      return;
    }

    this._treeElementForFrameId.delete(frame.globalId);
    if (frameTreeElement.parent) {
      frameTreeElement.parent.removeChild(frameTreeElement);
    }
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  _frameNavigated(frame) {
    const frameTreeElement = this._treeElementForFrameId.get(frame.globalId);
    if (frameTreeElement) {
      frameTreeElement.frameNavigated(frame);
    }
  }

  reset() {
    this._treeElement.removeChildren();
    this._treeElementForFrameId.clear();
  }
}

export class SidebarFrameTreeElement extends UI.TreeOutline.TreeElement {
  /**
   * @param {!SidebarFrameTree} section
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  constructor(section, frame) {
    super('', false);
    this._panel = section._panel;
    UI.ARIAUtils.setAccessibleName(this.listItemElement, '');  // ???

    this._populated = false;
    this._section = section;
    this._frame = frame;
    this.setExpandable(frame.childFrames.length > 0);
    this.frameNavigated(frame);

    const icon = UI.Icon.Icon.create('largeicon-navigator-frame', 'navigator-tree-item');
    icon.classList.add('navigator-frame-tree-item');
    this.setLeadingIcons([icon]);

    this._deferredNode = null;
    this.setDeferredNode();
    const parentFrame = SidebarFrameTree._getParentFrame(this._frame);
    this._overlayModel = parentFrame ? parentFrame.resourceTreeModel().domModel().overlayModel() : null;
  }

  async setDeferredNode() {
    if (!this._frame.parentFrame && !this._frame.crossTargetParentFrame()) {
      return;
    }
    const domModel = this._frame.crossTargetParentFrame() ? this._frame.resourceTreeModel().domModel().parentModel() :
                                                            this._frame.resourceTreeModel().domModel();
    const owner = domModel ? await domModel.getFrameOwner(this._frame.id) : null;
    if (owner && owner.backendNodeId) {
      this._deferredNode =
          new SDK.DOMModel.DeferredDOMNode(this._frame.resourceTreeModel().target(), owner.backendNodeId);
    }
  }

  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  frameNavigated(frame) {
    this.invalidateChildren();
    this.title = frame.displayNameAlternative();
    if (this.parent) {
      const parent = this.parent;
      parent.removeChild(this);
      this._insertInAlphabeticalOrder(parent, this);
    }
    this.setExpandable(frame.childFrames.length > 0);
  }

  get itemURL() {
    return 'frame://' + encodeURI(this.titleAsText());
  }

  /**
   * @override
   * @param {boolean=} selectedByUser
   * @return {boolean}
   */
  onselect(selectedByUser) {
    if (selectedByUser) {
      const path = [];
      for (let el = this; el; el = el.parent) {
        const url = el.itemURL;
        if (!url) {
          break;
        }
        path.push(url);
      }
      this._panel.setLastSelectedItemPath(path);
    }

    this._section._panel.showFrameView(this._frame);

    this.listItemElement.classList.remove('hovered');
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    return false;
  }

  /**
   * @param {boolean} hovered
   */
  set hovered(hovered) {
    if (hovered) {
      this.listItemElement.classList.add('hovered');
      if (this._overlayModel && this._deferredNode) {
        this._overlayModel.highlightInOverlay({deferredNode: this._deferredNode}, 'all', true);
      }
    } else {
      this.listItemElement.classList.remove('hovered');
      if (this._overlayModel) {
        this._overlayModel.clearHighlight();
      }
    }
  }

  /**
   * @override
   * @param {!UI.TreeOutline.TreeElement} treeElement
   */
  appendChild(treeElement) {
    this._insertInAlphabeticalOrder(this, treeElement);
  }

  /**
   * @param {!UI.TreeOutline.TreeElement} parentTreeElement
   * @param {!UI.TreeOutline.TreeElement} childTreeElement
   */
  _insertInAlphabeticalOrder(parentTreeElement, childTreeElement) {
    /**
     * @param {!UI.TreeOutline.TreeElement} treeElement1
     * @param {!UI.TreeOutline.TreeElement} treeElement2
     */
    function compare(treeElement1, treeElement2) {
      return treeElement1.titleAsText().localeCompare(treeElement2.titleAsText());
    }

    const childCount = parentTreeElement.childCount();
    let i;
    for (i = 0; i < childCount; ++i) {
      const child = parentTreeElement.childAt(i);
      if (!child || compare(childTreeElement, child) < 0) {
        break;
      }
    }
    parentTreeElement.insertChild(childTreeElement, i);
  }

  /**
   * @override
   */
  async onpopulate() {
    this._populated = true;
    for (const child of this._frame.childFrames) {
      this._section._frameAdded(child);
    }
  }
}

export class FrameDetailsView extends UI.Widget.VBox {
  /**
   * @param {!SDK.ResourceTreeModel.ResourceTreeFrame} frame
   */
  constructor(frame) {
    super();
    const nameElement = document.createElement('h1');
    nameElement.textContent = frame.displayNameAlternative();
    this.element.appendChild(nameElement);

    const urlText = document.createElement('div');
    urlText.textContent = `url: ${frame.url}`;
    this.element.appendChild(urlText);

    const originText = document.createElement('div');
    originText.textContent = `origin: ${frame.securityOrigin}`;
    this.element.appendChild(originText);

    const oopifText = document.createElement('div');
    oopifText.textContent = `Is Out-of-Process iframe: ${frame.crossTargetParentFrame() ? 'yes' : 'no'}`;
    this.element.appendChild(oopifText);
  }
}
