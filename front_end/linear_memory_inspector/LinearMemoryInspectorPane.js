// Copyright (c) 2020 The Chromium Authors. All rights reserved.

// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// @ts-nocheck
// TODO(crbug.com/1011811): Enable TypeScript compiler checks

import * as Common from '../common/common.js';
import * as ObjectUI from '../object_ui/object_ui.js';
import * as SDK from '../sdk/sdk.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {LinearMemoryInspector} from './LinearMemoryInspector.js';
import {createLinearMemoryInspector} from './LinearMemoryInspector_bridge.js';  // eslint-disable-line no-unused-vars
import {RequestMemoryEvent} from './LinearMemoryInspectorUtils.js';

/**
 * @type {!LinearMemoryInspectorPaneImpl}
 */
let memoryInspectorInstance;

/**
 * @unrestricted
 */
export class Wrapper extends UI.Widget.VBox {
  constructor() {
    super();
    this._view = LinearMemoryInspectorPaneImpl.instance();
  }

  /**
   * @override
   */
  wasShown() {
    this._showViewInWrapper();
  }
  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   */
  appendApplicableItems(event, contextMenu, target) {
    this._view.appendApplicableItems(event, contextMenu, target);
  }

  _showViewInWrapper() {
    this._view.show(this.element);
  }
}

/**
 * @unrestricted
 * @implements {UI.ContextMenu.Provider}
 */
export class LinearMemoryInspectorPaneImpl extends UI.View.SimpleView {
  constructor() {
    super();
    this._tabIdToInspectorView = new Map();
    this._tabIds = new Map();
    this._tabId = 0;
    this._tabbedPane = new UI.TabbedPane.TabbedPane();
    this._tabbedPane.setCloseableTabs(true);
    this._tabbedPane.setAllowTabReorder(true, true);

    this._tabIdToRemoteArray = new Map();

    this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabClosed, this._tabClosed, this);
    this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabSelected, this._tabSelected, this);

    this.element.id = 'lienar-memory-inspector-pane';
    this._tabbedPane.show(this.element);
  }

  /**
   * @param {{forceNew: boolean}} opts
   */
  static instance({forceNew} = {forceNew: false}) {
    if (!memoryInspectorInstance || forceNew) {
      memoryInspectorInstance = new LinearMemoryInspectorPaneImpl();
    }

    return memoryInspectorInstance;
  }

  /**
   * @param {!ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement} target
   */
  isMemoryObjectProperty(target) {
    return target.property.value.className === 'Uint8Array';
  }
  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   */
  appendApplicableItems(event, contextMenu, target) {
    if (target instanceof ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement) {
      if (this.isMemoryObjectProperty(target)) {
        contextMenu.debugSection().appendItem(ls`Inspect memory`, this._openMemoryInspector.bind(this, target));
      }
    }
  }
  /**
   * @param {!ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement} target
   */
  async _openMemoryInspector(target) {
    const remoteArray = new SDK.RemoteObject.RemoteArray(target.property.value);
    this.showLinearMemory('id', 'Title', remoteArray);
    UI.ViewManager.ViewManager.instance().showView('linear-memory-inspector');

    // TODO: trigger event to sources view
  }


  /**
   * @param {string} scriptId
   * @param {string} title
   * @param {Uint8Array} memory
   */
  showLinearMemory(scriptId, title, memory) {
    this._inspectorView = new LinearMemoryInspectorView(memory);
    this._tabbedPane.appendTab(scriptId, title, this._inspectorView, undefined, undefined, true, undefined);
    this._tabbedPane.selectTab(scriptId, undefined);
  }

  /**
   * @return {string}
   */
  _generateTabId() {
    return 'tab_' + (tabId++);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _tabClosed(event) {
    console.log('tab closed');
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _tabSelected(event) {
    console.log('tab selected');
  }
}

export class LinearMemoryInspectorDelegate {}

export class LinearMemoryInspectorView extends UI.View.SimpleView {
  static MAX_BUFFER_LENGTH = 1000;

  /**
   * @param {RemoteArray} memory
   */
  constructor(memory) {
    super(true /* isWebComponent */);
    this.memory = memory;
    this._inspector = createLinearMemoryInspector();
    this._inspector.addEventListener('request-memory', event => {
      this._memoryRequested(/** @type {{data: *}} */ (event));
    });
    this.contentElement.appendChild(this._inspector);

    this._extractByteArray(0, LinearMemoryInspectorView.MAX_BUFFER_LENGTH).then(byteArray => {
      this._inspector.data = {memory: Uint8Array.from(byteArray), index: 0, memoryOffset: 0};
    });
  }

  /**
   * @param {!RequestMemoryEvent} event
   */
  _memoryRequested(event) {
    const index = event.data.index;
    const startAddress = event.data.start;
    const endAddress = event.data.end;

    const start = Math.min(startAddress, this.memory.length() - LinearMemoryInspectorView.MAX_BUFFER_LENGTH);
    this._extractByteArray(start, endAddress).then(byteArray => this._inspector.data = {
      memory: Uint8Array.from(byteArray),
      index: Math.min(index, this.memory.length() - 1),
      memoryOffset: start
    });
  }

  /**
   * @param {number} start
   * @param {number} end
   * @return {Promise<!Array<number>}
   */
  _extractByteArray(start, end) {
    const promises = [];
    for (let i = start; i < end && i < this.memory.length(); ++i) {
      promises.push(this.memory.at(i).then(x => x.value));
    }
    return Promise.all(promises);
  }
}
