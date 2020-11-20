/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import * as Common from '../common/common.js';
import * as Components from '../components/components.js';
import * as LinearMemoryInspector from '../linear_memory_inspector/linear_memory_inspector.js';
import * as ObjectUI from '../object_ui/object_ui.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';

import {resolveScopeChain, resolveScopeInObject, resolveThisObject} from './SourceMapNamesResolver.js';

/**
 * @implements {UI.ContextFlavorListener.ContextFlavorListener}
 * @unrestricted
 */
export class ScopeChainSidebarPane extends UI.Widget.VBox {
  constructor() {
    super(true);
    this.registerRequiredCSS('sources/scopeChainSidebarPane.css', {enableLegacyPatching: true});
    this._treeOutline = new ObjectUI.ObjectPropertiesSection.ObjectPropertiesSectionsTreeOutline();
    this._treeOutline.registerRequiredCSS('sources/scopeChainSidebarPane.css', {enableLegacyPatching: true});
    this._treeOutline.setShowSelectionOnKeyboardFocus(/* show */ true);
    this._expandController =
        new ObjectUI.ObjectPropertiesSection.ObjectPropertiesSectionsTreeExpandController(this._treeOutline);
    this._linkifier = new Components.Linkifier.Linkifier();
    this._infoElement = document.createElement('div');
    this._infoElement.className = 'gray-info-message';
    this._infoElement.textContent = ls`Not paused`;
    this._infoElement.tabIndex = -1;
    this._update();
  }

  /**
   * @override
   * @param {?Object} object
   */
  flavorChanged(object) {
    this._update();
  }

  /**
   * @override
   */
  focus() {
    if (this.hasFocus()) {
      return;
    }

    if (UI.Context.Context.instance().flavor(SDK.DebuggerModel.DebuggerPausedDetails)) {
      this._treeOutline.forceSelect();
    }
  }

  async _update() {
    const callFrame = UI.Context.Context.instance().flavor(SDK.DebuggerModel.CallFrame);
    const details = UI.Context.Context.instance().flavor(SDK.DebuggerModel.DebuggerPausedDetails);
    this._linkifier.reset();
    const [thisObject, scopeChain] = await Promise.all([resolveThisObject(callFrame), resolveScopeChain(callFrame)]);
    this._innerUpdate(details, callFrame, thisObject, scopeChain);
  }

  /**
   * @param {?SDK.DebuggerModel.DebuggerPausedDetails} details
   * @param {?SDK.DebuggerModel.CallFrame} callFrame
   * @param {?SDK.RemoteObject.RemoteObject} thisObject
   * @param {?Array<!SDK.DebuggerModel.ScopeChainEntry>} scopeChain
   */
  _innerUpdate(details, callFrame, thisObject, scopeChain) {
    this._treeOutline.removeChildren();
    this.contentElement.removeChildren();

    if (!details || !callFrame || !scopeChain) {
      this.contentElement.appendChild(this._infoElement);
      return;
    }

    this.contentElement.appendChild(this._treeOutline.element);
    let foundLocalScope = false;
    for (let i = 0; i < scopeChain.length; ++i) {
      const scope = scopeChain[i];
      const extraProperties = this._extraPropertiesForScope(scope, details, callFrame, thisObject, i === 0);

      if (scope.type() === Protocol.Debugger.ScopeType.Local) {
        foundLocalScope = true;
      }

      const section = this._createScopeSectionTreeElement(scope, extraProperties);
      if (scope.type() === Protocol.Debugger.ScopeType.Global) {
        section.collapse();
      } else if (!foundLocalScope || scope.type() === Protocol.Debugger.ScopeType.Local) {
        section.expand();
      }

      this._treeOutline.appendChild(section);
      if (i === 0) {
        section.select(/* omitFocus */ true);
      }
    }
    this._sidebarPaneUpdatedForTest();
  }

  /**
   * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
   * @param {!Array.<!SDK.RemoteObject.RemoteObjectProperty>} extraProperties
   * @return {!ObjectUI.ObjectPropertiesSection.RootElement}
   */
  _createScopeSectionTreeElement(scope, extraProperties) {
    let emptyPlaceholder = null;
    if (scope.type() === Protocol.Debugger.ScopeType.Local || Protocol.Debugger.ScopeType.Closure) {
      emptyPlaceholder = ls`No variables`;
    }

    let title = scope.typeName();
    if (scope.type() === Protocol.Debugger.ScopeType.Closure) {
      const scopeName = scope.name();
      if (scopeName) {
        title = ls`Closure (${UI.UIUtils.beautifyFunctionName(scopeName)})`;
      } else {
        title = ls`Closure`;
      }
    }
    /** @type {?string} */
    let subtitle = scope.description();
    if (!title || title === subtitle) {
      subtitle = null;
    }
    const icon = scope.icon();

    const titleElement = document.createElement('div');
    titleElement.classList.add('scope-chain-sidebar-pane-section-header');
    titleElement.classList.add('tree-element-title');
    if (icon) {
      const iconElement = document.createElement('img');
      iconElement.classList.add('scope-chain-sidebar-pane-section-icon');
      iconElement.src = icon;
      titleElement.appendChild(iconElement);
    }
    titleElement.createChild('div', 'scope-chain-sidebar-pane-section-subtitle').textContent = subtitle;
    titleElement.createChild('div', 'scope-chain-sidebar-pane-section-title').textContent = title;

    const section = new ObjectUI.ObjectPropertiesSection.RootElement(
        resolveScopeInObject(scope), this._linkifier, emptyPlaceholder,
        /* ignoreHasOwnProperty */ true, extraProperties);
    section.title = titleElement;
    section.listItemElement.classList.add('scope-chain-sidebar-pane-section');
    section.listItemElement.setAttribute('aria-label', title);
    this._expandController.watchSection(title + (subtitle ? ':' + subtitle : ''), section);

    return section;
  }

  /**
   * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
   * @param {!SDK.DebuggerModel.DebuggerPausedDetails} details
   * @param {!SDK.DebuggerModel.CallFrame} callFrame
   * @param {?SDK.RemoteObject.RemoteObject} thisObject
   * @param {boolean} isFirstScope
   * @return {!Array.<!SDK.RemoteObject.RemoteObjectProperty>}
   */
  _extraPropertiesForScope(scope, details, callFrame, thisObject, isFirstScope) {
    if (scope.type() !== Protocol.Debugger.ScopeType.Local || callFrame.script.isWasm()) {
      return [];
    }

    const extraProperties = [];
    if (thisObject) {
      extraProperties.push(new SDK.RemoteObject.RemoteObjectProperty('this', thisObject));
    }
    if (isFirstScope) {
      const exception = details.exception();
      if (exception) {
        extraProperties.push(new SDK.RemoteObject.RemoteObjectProperty(
            Common.UIString.UIString('Exception'), exception, undefined, undefined, undefined, undefined, undefined,
            /* synthetic */ true));
      }
      const returnValue = callFrame.returnValue();
      if (returnValue) {
        extraProperties.push(new SDK.RemoteObject.RemoteObjectProperty(
            Common.UIString.UIString('Return value'), returnValue, undefined, undefined, undefined, undefined,
            undefined,
            /* synthetic */ true, callFrame.setReturnValue.bind(callFrame)));
      }
    }

    return extraProperties;
  }

  _sidebarPaneUpdatedForTest() {
  }
}

/**
 * @implements {LinearMemoryInspector.LinearMemoryInspectorPane.LazyUint8Array}
 * @unrestricted
 */
class RemoteArrayWrapper {
  /**
   * @override
   * @param {!SDK.RemoteObject.RemoteArray} array
   */
  constructor(array) {
    this.remoteArray = array;
  }

  /**
   * @override
   */
  length() {
    return this.remoteArray.length();
  }

  /**
   * @override
   * @param {number} start
   * @param {number} end
   */
  async getRange(start, end) {
    if (start < 0 || end >= this.remoteArray.length() || start > end) {
      return Promise.resolve(new Uint8Array(0));
    }
    const array = this.extractByteArray(start, end);
    return array.then(x => new Uint8Array(x));
  }

  /**
   * @param {number} start
   * @param {number} end
   */
  async extractByteArray(start, end) {
    const promises = [];
    for (let i = start; i < end && i < this.remoteArray.length(); ++i) {
      promises.push(this.remoteArray.at(i).then(x => x.value));
    }
    return Promise.all(promises);
  }
}

/**
 * @implements {UI.ContextMenu.Provider}
 * @unrestricted
 */
export class OpenLinearMemoryInspector extends UI.Widget.VBox {
  /**
   * @param {!SDK.RemoteObject.RemoteObject} obj
   */
  _isMemoryObjectProperty(obj) {
    return obj.className === 'Uint8Array';
  }

  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   */
  appendApplicableItems(event, contextMenu, target) {
    if (target instanceof ObjectUI.ObjectPropertiesSection.ObjectPropertyTreeElement) {
      if (target.property && target.property.value && this._isMemoryObjectProperty(target.property.value)) {
        contextMenu.debugSection().appendItem(
            ls`Inspect memory`, this._openMemoryInspector.bind(this, target.property.value));
      }
    }
  }

  /**
   * @param {!SDK.RemoteObject.RemoteObject} obj
   */
  async _openMemoryInspector(obj) {
    const remoteArray = new SDK.RemoteObject.RemoteArray(obj);
    const callFrame = UI.Context.Context.instance().flavor(SDK.DebuggerModel.CallFrame);

    if (!callFrame) {
      throw new Error(`Cannot find call frame for ${obj.description}.`);
    }
    const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(callFrame.script.sourceURL);
    const address = 0;

    if (!uiSourceCode) {
      throw new Error(`Cannot find uiSourceCode for ${obj.description}`);
    }
    const inspector = LinearMemoryInspector.LinearMemoryInspectorPane.LinearMemoryInspectorPaneImpl.instance();
    inspector.showLinearMemory(
        callFrame.script.scriptId, uiSourceCode.displayName(), new RemoteArrayWrapper(remoteArray), address);
    UI.ViewManager.ViewManager.instance().showView('linear-memory-inspector');
  }
}

export const pathSymbol = Symbol('path');
