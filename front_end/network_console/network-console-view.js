// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../host/host.js';
import * as QuickOpen from '../quick_open/quick_open.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';

import {NetworkConsoleSidebar} from './network-console-sidebar.js';
import {composeRequestScript} from './request-composer.js';
import {sdkRequestToNetworkConsoleRequest} from './sdk-request-converter.js';
import {TabbedPaneWithSharedView} from './tabbed-pane-with-shared-view.js';

/**
 * @unrestricted
 */
export class NetworkConsoleView extends UI.Panel.PanelWithSidebar {
  constructor() {
    super('network_console');

    // The following line is the "real" version. It is commented out to
    // facilitate debugging.
    // const rootUrl = Root.Runtime.computeHostedRemoteUrl('network_console/build/index.html');
    //
    // If you update your build locally, update BUILD.gn to include network_console_generated_files
    // in the output bundle, and use the following line:
    const rootUrl = 'devtools://devtools/bundled/network_console/build/index.html';
    // Otherwise the following line is a known-good remote module fallback:
    // const rootUrl = 'devtools://devtools/remote/network_console/build/index.html';
    const iframe = UI.Fragment.Fragment.build`
      <iframe src="${
        rootUrl}#host=edge" style="width: 100%; height: 100%; border: none;" class="vbox flex-auto"></iframe>
    `;
    this._iframe = iframe.element();
    this._messageChannel = new MessageChannel();
    this._messagePort = this._messageChannel.port1;

    const mainContainer = new UI.Widget.VBox();
    mainContainer.setHideOnDetach();
    mainContainer.element.appendChild(this._iframe);
    this._frameContainer = mainContainer;
    this._tabbedPane = new TabbedPaneWithSharedView(mainContainer);
    this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabSelected, event => {
      const tabId = /** @type {string} */ (event.data.tabId);
      if (!tabId) {
        return;
      }

      this.selectRequest(tabId);
    });
    this._tabbedPane.addEventListener(UI.TabbedPane.Events.TabClosed, event => {
      const tabId = /** @type {string} */ (event.data.tabId);
      if (!tabId) {
        return;
      }

      const closeOpenViewMessage = {
        type: 'CLOSE_VIEW',
        requestId: tabId,
      };
      this.sendMessageToFrontend(closeOpenViewMessage);
      this._tabDirtyStates.delete(tabId);
      this._tabNames.delete(tabId);
    });
    /** @type {!Map<string, boolean>} */
    this._tabDirtyStates = new Map();
    /** @type {!Map<string, string>} */
    this._tabNames = new Map();

    // this._tabbedPane.setPlaceholderElement(this._iframe);
    this._tabbedPane.show(this.mainElement());

    this.setHideOnDetach();
    /**
     * @param {!MessageEvent} msg
     */
    this._initialMessageHandler = msg => this._onMessage(msg);
    window.addEventListener('message', this._initialMessageHandler);

    this._sidebar = new NetworkConsoleSidebar(this);
    this._sidebar.show(this.panelSidebarElement());
    this._toggleNavigatorSidebarButton =
        new UI.Toolbar.ToolbarButton(ls`Hide Network Console navigator`, 'largeicon-hide-left-sidebar');
    this._toggleNavigatorSidebarButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, _e => {
      this._toggleSidebarVisibility();
    });
    this._tabbedPane.leftToolbar().appendToolbarItem(this._toggleNavigatorSidebarButton);
  }

  _toggleSidebarVisibility() {
    const split = this.splitWidget();
    let glyph = '';
    let title = '';
    if (split.showMode() === UI.SplitWidget.ShowMode.Both) {
      split.hideSidebar(/* animate: */ true);
      glyph = 'largeicon-show-left-sidebar';
      title = ls`Show Network Console navigator`;
    } else {
      split.showBoth(/* animate: */ true);
      glyph = 'largeicon-hide-left-sidebar';
      title = ls`Hide Network Console navigator`;
    }
    this._toggleNavigatorSidebarButton.setGlyph(glyph);
    this._toggleNavigatorSidebarButton.setTitle(title);
  }

  willHide() {
    self.UI.context.setFlavor(NetworkConsoleView, null);
  }

  sidebar() {
    return this._sidebar;
  }

  /**
   * @override
   */
  wasShown() {
    window.addEventListener('message', this._initialMessageHandler);
    this._messageChannel = new MessageChannel();
    this._messagePort = this._messageChannel.port1;
    super.wasShown();
    self.UI.context.setFlavor(NetworkConsoleView, this);
  }

  /**
   * @param {!MessageEvent} msg
   */
  _onMessage(msg) {
    if (!msg.data.type) {
      return;
    }

    const data = /** @type {!NCShared.FrontendMessage} */ (msg.data);
    switch (data.type) {
      case 'CONSOLE_READY':
        this._onConsoleReady();
        break;

      case 'EXECUTE_REQUEST':
        this._executeRequest(msg.data.id, msg.data.configuration);
        break;

      case 'UPDATE_DIRTY_FLAG':
        this._onUpdateDirtyFlag(data);
        break;

      case 'OPEN_WEB_LINK':
        this._onOpenWebLink(data);
        break;

      case 'SAVE_COLLECTION_AUTHORIZATION_PARAMETERS':
        this._onSaveCollectionAuthorization(data);
        break;

      case 'SAVE_ENVIRONMENT_VARIABLES':
        this._onSaveEnvironmentVariables(data);
        break;

      case 'OPEN_NEW_UNATTACHED_REQUEST':
        this._openNewUnattachedRequest(data.requestId);
        break;

      default:
        console.warn(`Unsupported message type '${msg.data.type}' from Network Console frontend.`);
        break;
    }
  }

  /**
   *
   * @param {string} requestId
   */
  _openNewUnattachedRequest(requestId) {
    const untitledRequest = ls`Untitled request`;
    this._tabbedPane.appendTab(
        requestId, untitledRequest, this._frameContainer, untitledRequest, /* userGesture: */ true,
        /* isClosable: */ true);
    this._tabbedPane.selectTab(requestId);
    this._tabDirtyStates.set(requestId, false);
    this._tabNames.set(requestId, untitledRequest);
  }

  _onConsoleReady() {
    this._iframe.contentWindow.addEventListener('keydown', event => {
      // One of the weird things about using iframes is that they have their own sets of top-level
      // event handlers. One of these is for Ctrl+P, which is used for printing.
      // However, we want to hook Ctrl+P for the Command Palette, so that (among other things) we
      // can invoke commands like Connect to OpenAPI; but we'd also want to be able to press F8
      // to allow a broken script to Continue. This allows the host to preview keydown events
      // and avoid dispatching them to the frontend if they're handled as a global DevTools command.
      const keyEvent = /** @type {!KeyboardEvent} */ (event);
      const clonedEvent = new KeyboardEvent(keyEvent.type, keyEvent);
      document.dispatchEvent(clonedEvent);
      if (clonedEvent.defaultPrevented || clonedEvent.handled) {
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
      }
    }, true);

    window.removeEventListener('message', this._initialMessageHandler);
    this._messagePort.addEventListener('message', this._initialMessageHandler);
    this._messagePort.start();

    this._iframe.contentWindow.postMessage(
        {
          type: 'INIT_HOST',
          cssVariables: '',
          isDark: self.UI.themeSupport.themeName() === 'dark',
          isHighContrast: false,
          messagePort: this._messageChannel.port2,
        },
        '*', [this._messageChannel.port2]);
  }

  /**
   *
   * @param {!NCShared.IUpdateDirtyFlagMessage} message
   */
  _onUpdateDirtyFlag(message) {
    const was = this._tabDirtyStates.get(message.requestId) || false;
    this._tabDirtyStates.set(message.requestId, message.isDirty);
    const tabName = this._tabNames.get(message.requestId);
    if (!was && message.isDirty) {
      this._tabbedPane.changeTabTitle(message.requestId, `${tabName} *`);
    } else if (was && !message.isDirty) {
      this._tabbedPane.changeTabTitle(message.requestId, tabName);
    }
  }

  /**
   *
   * @param {!NCShared.ISaveRequestMessage} message
   */
  _onSaveRequest(message) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/4
  }

  /**
   *
   * @param {!NCShared.ISaveCollectionAuthorizationMessage} message
   */
  _onSaveCollectionAuthorization(message) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/4
  }

  /**
   *
   * @param {!NCShared.ISaveEnvironmentVariablesMessage} message
   */
  _onSaveEnvironmentVariables(message) {
    // TODO: https://github.com/microsoft/edge-devtools-network-console/issues/4
  }

  /**
   *
   * @param {!NCShared.IOpenWebLinkMessage} message
   */
  _onOpenWebLink(message) {
    const {url} = message;
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(url);
  }

  /**
   * @param {!NCShared.HostMessage} msg
   */
  sendMessageToFrontend(msg) {
    if (!this._messagePort) {
      throw new Error('Not ready.');
    } else {
      this._messagePort.postMessage(msg);
    }
  }

  /**
   *
   * @param {number} id
   * @param {!NCShared.INetConsoleRequest} request
   */
  async _executeRequest(id, request) {
    const authorization = request.authorization;
    if (authorization) {
      // Sometimes the authorization parameterization occurs in the frontend and the authorization
      // property is not included. If it's included, handle it necessarily here.

      // Basic authorization is unsupported in a fetch-based web context.
    }
    const executionContext = self.UI.context.flavor(SDK.RuntimeModel.ExecutionContext);
    const requestScript =
        composeRequestScript(request.verb, request.url, request.headers, request.fetchParams, request.body.content);
    const compileResult = await executionContext.runtimeModel.compileScript(
        requestScript, /** scriptUrl: */ '', true, executionContext.id);
    if (!compileResult) {
      this.sendMessageToFrontend({
        type: 'REQUEST_COMPLETE',
        id,
        result: {
          duration: 0,
          status: 3,
          response: {
            body: {content: ''},
            headers: [],
            size: 0,
            statusText: 'Compiler error.',
            statusCode: 0,
          },
        },
      });
      return;
    }

    const start = Date.now();
    const resultObject = await executionContext.runtimeModel.runScript(
        compileResult.scriptId, executionContext.id,
        /* objectGroupId: */ undefined,
        /* silent: */ true,
        /* includeCommandLineAPI: */ undefined,
        /* returnByValue: */ true,
        /* generatePreview: */ false,
        /* awaitPromise: */ true);

    if (!resultObject || resultObject.exceptionDetails) {
      const stop = Date.now();
      const duration = stop - start;
      this.sendMessageToFrontend({
        type: 'REQUEST_COMPLETE',
        id,
        result: {
          duration,
          status: 3,  // ERROR_BELOW_APPLICATION_LAYER
          response: {
            body: {
              content: '',
            },
            headers: [],
            size: 0,
            statusCode: 0,
            statusText: 'FETCH_ERROR',
          },
        },
      });
      return;
    }

    /** @type {!NCShared.INetConsoleResponse} */
    const netConsoleResponse = resultObject.object.value;
    this.sendMessageToFrontend({
      type: 'REQUEST_COMPLETE',
      id,
      result: netConsoleResponse,
    });
  }

  /**
   *
   * @param {!SDK.NetworkRequest.NetworkRequest} request
   */
  async _loadSDKRequest(request) {
    const requestId = request.requestId();
    const resultRequest = await sdkRequestToNetworkConsoleRequest(request);
    const requestName = resultRequest.name;

    /** @type {!NCShared.ILoadRequestMessage} */
    const loadRequestMessage = {
      type: 'LOAD_REQUEST',
      requestId: request.requestId(),
      request: resultRequest,
      // Intentionally omit environmentAuth and environmentAuthPath
    };

    this.sendMessageToFrontend(loadRequestMessage);

    this._tabbedPane.appendTab(
        requestId, requestName + ' *', this._frameContainer, requestName, /* userGesture: */ true,
        /* isClosable: */ true);
    this._tabbedPane.selectTab(requestId);
    this._tabDirtyStates.set(requestId, true);
    this._tabNames.set(requestId, requestName);
  }

  /**
   * Changes the active tab by request ID.
   * @param {string} id
   */
  selectRequest(id) {
    /** @type {!NCShared.IShowViewMessage} */
    const showRequestMessage = {
      type: 'SHOW_OPEN_REQUEST',
      requestId: id,
    };
    this.sendMessageToFrontend(showRequestMessage);
  }

  /**
   * @param {string} id
   * @param {!NCShared.INetConsoleRequest} request
   * @param {!NCShared.INetConsoleAuthorization|undefined} environmentAuth
   * @param {!Array<string>|undefined} environmentAuthPath
   */
  switchToOrLoadRequest(id, request, environmentAuth, environmentAuthPath) {
    if (this._tabbedPane.hasTab(id)) {
      this._tabbedPane.selectTab(id, /* userGesture: */ true);
    } else {
      this.loadRequest(id, request, environmentAuth, environmentAuthPath);
    }
  }

  /**
   * @param {string} id
   * @param {!NCShared.INetConsoleRequest} request
   * @param {!NCShared.INetConsoleAuthorization|undefined} environmentAuth
   * @param {!Array<string>|undefined} environmentAuthPath
   */
  loadRequest(id, request, environmentAuth, environmentAuthPath) {
    /** @type {!NCShared.ILoadRequestMessage} */
    const loadRequestMessage = {
      type: 'LOAD_REQUEST',
      requestId: id,
      request,
      environmentAuth,
      environmentAuthPath,
    };

    this.sendMessageToFrontend(loadRequestMessage);
    this._tabbedPane.appendTab(
        id, request.name, this._frameContainer, request.name, /* userGesture: */ true, /* isClosable: */ true);
    this._tabbedPane.selectTab(id);
    this._tabDirtyStates.set(id, false);
    this._tabNames.set(id, request.name);
  }

  /**
   *
   * @param {string} id
   * @param {!NCShared.IEnvironment} environment
   */
  activateEnvironment(id, environment) {
    /** @type {!NCShared.IUpdateEnvironmentMessage} */
    const updateEnvironmentMessage = {
      type: 'UPDATE_ENVIRONMENT',
      environment: {
        id,
        name: environment.name,
        options: environment.settings,
      },
    };
    this.sendMessageToFrontend(updateEnvironmentMessage);
  }

  static _instance() {
    return /** @type {!NetworkConsoleView} */ (self.runtime.sharedInstance(NetworkConsoleView));
  }

  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   * @this {NetworkPanel}
   */
  appendApplicableItems(event, contextMenu, target) {
    if (!(target instanceof SDK.NetworkRequest.NetworkRequest)) {
      return;
    }

    /**
     * @this {NetworkConsoleView}
     * @param {!SDK.NetworkRequest.NetworkRequest} request
     */
    function reveal(request) {
      UI.ViewManager.ViewManager.instance().showView('network_console').then(() => this._loadSDKRequest(request));
    }

    /**
     * @this {NetworkConsoleView}
     * @param {!SDK.NetworkRequest.NetworkRequest} request
     */
    function appendEditAndReplayItem(request) {
      contextMenu.revealSection().appendItem(ls`Edit and Replay`, reveal.bind(this, request));
    }

    const request = /** @type {!SDK.NetworkRequest.NetworkRequest} */ (target);
    appendEditAndReplayItem.call(this, request);
  }

  /**
   * @param {string} collectionId
   * @param {!Array<string>} path
   * @param {!NCShared.INetConsoleAuthorization} authorization
   */
  editCollectionAuthorization(collectionId, path, authorization) {
    this.sendMessageToFrontend({
      type: 'EDIT_COLLECTION_AUTHORIZATION_PARAMETERS',
      collectionId,
      path,
      authorization,
    });
  }

  /**
   * @typedef {Object} IHostCollection
   * @property {string} id
   * @property {string} name
   * @property {!Array<!IHostCollection>} children
   */

  /**
   * @param {!Array<!IHostCollection>} collections
   */
  updateCollectionsTree(collections) {
  }

  /**
   *
   * @param {string} id
   * @param {!NCShared.IEnvironment} environment
   * @param {string} file
   * @param {string} collectionName
   */
  editEnvironmentVariables(id, environment, file, collectionName) {
    /** @type {!NCShared.IEditEnvironmentMessage} */
    const msg = {
      type: 'EDIT_ENVIRONMENT_VARIABLES',
      id,
      environment: {
        name: environment.name,
        options: environment.settings.slice(),
      },
      file,
      collectionName,
    };
    this.sendMessageToFrontend(msg);
  }

  clearActiveEnvironment() {
    /** @type {!NCShared.IClearEnvironmentMessage} */
    const msg = {
      type: 'CLEAR_ENVIRONMENT',
    };
    this.sendMessageToFrontend(msg);
  }
}

/**
 * @implements {UI.ContextMenu.Provider}
 * @unrestricted
 */
export class NetworkContextMenuProvider {
  /**
   * @override
   * @param {!Event} event
   * @param {!UI.ContextMenu.ContextMenu} contextMenu
   * @param {!Object} target
   */
  appendApplicableItems(event, contextMenu, target) {
    const ncView = /** @type {!NetworkConsoleView} */ (self.runtime.sharedInstance(NetworkConsoleView));
    ncView.appendApplicableItems(event, contextMenu, target);
  }
}

/**
 * @implements {UI.ActionDelegate.ActionDelegate}
 * @unrestricted
 */
export class ActionDelegate {
  /**
   * @override
   * @param {!UI.Context.Context} context
   * @param {string} actionId
   * @return {boolean}
   */
  handleAction(context, actionId) {
    const ncView = self.UI.context.flavor(NetworkConsoleView);
    if (!ncView) {
      return false;
    }

    switch (actionId) {
      case 'network-console.connect-to-openapi':
        QuickOpen.QuickOpen.QuickOpenImpl.show('//');
        return true;
    }

    return false;
  }
}
