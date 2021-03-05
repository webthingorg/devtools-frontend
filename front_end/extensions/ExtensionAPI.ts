/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import type {DebuggerLanguagePlugin} from '../bindings/DebuggerLanguagePlugins';

const enum SearchAction {
  CancelSearch = 'cancelSearch',
  PerformSearch = 'performSearch',
  NextSearchResult = 'nextSearchResult',
  PreviousSearchResult = 'previousSearchResult',
}

const enum Events {
  ButtonClicked = 'button-clicked-',
  PanelObjectSelected = 'panel-objectSelected-',
  NetworkRequestFinished = 'network-request-finished',
  OpenResource = 'open-resource',
  PanelSearch = 'panel-search-',
  RecordingStarted = 'trace-recording-started-',
  RecordingStopped = 'trace-recording-stopped-',
  ResourceAdded = 'resource-added',
  ResourceContentCommitted = 'resource-content-committed',
  ViewShown = 'view-shown-',
  ViewHidden = 'view-hidden-',
}

const enum Commands {
  AddRequestHeaders = 'addRequestHeaders',
  AddTraceProvider = 'addTraceProvider',
  ApplyStyleSheet = 'applyStyleSheet',
  CompleteTraceSession = 'completeTraceSession',
  CreatePanel = 'createPanel',
  CreateSidebarPane = 'createSidebarPane',
  CreateToolbarButton = 'createToolbarButton',
  EvaluateOnInspectedPage = 'evaluateOnInspectedPage',
  ForwardKeyboardEvent = '_forwardKeyboardEvent',
  GetHAR = 'getHAR',
  GetPageResources = 'getPageResources',
  GetRequestContent = 'getRequestContent',
  GetResourceContent = 'getResourceContent',
  InspectedURLChanged = 'inspectedURLChanged',
  OpenResource = 'openResource',
  Reload = 'Reload',
  Subscribe = 'subscribe',
  SetOpenResourceHandler = 'setOpenResourceHandler',
  SetResourceContent = 'setResourceContent',
  SetSidebarContent = 'setSidebarContent',
  SetSidebarHeight = 'setSidebarHeight',
  SetSidebarPage = 'setSidebarPage',
  ShowPanel = 'showPanel',
  Unsubscribe = 'unsubscribe',
  UpdateButton = 'updateButton',
  RegisterLanguageExtensionPlugin = 'registerLanguageExtensionPlugin',
}

const enum LanguageExtensionPluginCommands {
  AddRawModule = 'addRawModule',
  RemoveRawModule = 'removeRawModule',
  SourceLocationToRawLocation = 'sourceLocationToRawLocation',
  RawLocationToSourceLocation = 'rawLocationToSourceLocation',
  GetScopeInfo = 'getScopeInfo',
  ListVariablesInScope = 'listVariablesInScope',
  GetTypeInfo = 'getTypeInfo',
  GetFormatter = 'getFormatter',
  GetInspectableAddress = 'getInspectableAddress',
  GetFunctionInfo = 'getFunctionInfo',
  GetInlinedFunctionRanges = 'getInlinedFunctionRanges',
  GetInlinedCalleesRanges = 'getInlinedCalleesRanges',
  GetMappedLines = 'getMappedLines',
}

const enum LanguageExtensionPluginEvents {
  UnregisteredLanguageExtensionPlugin = 'unregisteredLanguageExtensionPlugin',
}

declare global {
  interface Window {
    injectedExtensionAPI:
        (extensionInfo: ExtensionDescriptor, inspectedTabId: string, themeName: string, keysToForward: number[],
         testHook: (arg0: any, arg1: any) => void, injectedScriptId: number) => void;
    buildExtensionAPIInjectedScript(
        extensionInfo: ExtensionDescriptor, inspectedTabId: string, themeName: string, keysToForward: number[],
        testHook: (arg0: object, arg1: object) => void|undefined): string;
  }
}

interface ExtensionDescriptor {
  startPage: string;
  name: string;
  exposeExperimentalAPIs: boolean;
  exposeWebInspectorNamespace: boolean;
}

self.injectedExtensionAPI = function(
    extensionInfo: ExtensionDescriptor, inspectedTabId: string, themeName: string, keysToForward: number[],
    testHook: (arg0: any, arg1: any) => void, injectedScriptId: number) {
  const keysToForwardSet = new Set(keysToForward);
  // @ts-ignore
  const chrome = window.chrome || {};
  const devtools_descriptor = Object.getOwnPropertyDescriptor(chrome, 'devtools');
  if (devtools_descriptor) {
    return;
  }

  let userAction = false;

  // Here and below, all constructors are private to API implementation.
  // For a public type Foo, if internal fields are present, these are on
  // a private FooImpl type, an instance of FooImpl is used in a closure
  // by Foo consutrctor to re-bind publicly exported members to an instance
  // of Foo.


  interface IEventSink {
    _listeners: never[];
    _customDispatch?: (message: {arguments: any[]}) => void;
    _type: string;

    _fire(...vararg: any[]): void;
    _dispatch(request: {arguments: any}): void;
  }

  const EventSinkImpl = function(
      this: IEventSink, type: string, customDispatch?: (message: {arguments: any[]}) => void) {
    this._type = type;
    this._listeners = [];
    this._customDispatch = customDispatch;
  };

  EventSinkImpl.prototype = {
    addListener: function(callback: (...args: unknown[]) => unknown) {
      if (typeof callback !== 'function') {
        throw 'addListener: callback is not a function';
      }
      if (this._listeners.length === 0) {
        extensionServer.sendRequest({command: Commands.Subscribe, type: this._type});
      }
      this._listeners.push(callback);
      extensionServer.registerHandler('notify-' + this._type, this._dispatch.bind(this));
    },

    removeListener: function(callback: (...args: unknown[]) => unknown) {
      const listeners = this._listeners;

      for (let i = 0; i < listeners.length; ++i) {
        if (listeners[i] === callback) {
          listeners.splice(i, 1);
          break;
        }
      }
      if (this._listeners.length === 0) {
        extensionServer.sendRequest({command: Commands.Unsubscribe, type: this._type});
      }
    },

    _fire: function(...vararg: any[]) {
      const listeners = this._listeners.slice();
      for (let i = 0; i < listeners.length; ++i) {
        listeners[i].apply(null, arguments);
      }
    },

    _dispatch: function(request: {arguments: any}) {
      if (this._customDispatch) {
        this._customDispatch.call(this, request);
      } else {
        this._fire.apply(this, request.arguments);
      }
    },
  };

  interface IInspectorExtensionAPI {
    languageServices: ILanguageServicesAPI;
    timeline: ITimeline;
    network: INetwork;
    panels: IPanels;
    inspectedWindow: IInspectedWindow;
  }
  const InspectorExtensionAPI = function(this: IInspectorExtensionAPI) {
    this.inspectedWindow = new InspectedWindow();
    this.panels = new Panels();
    this.network = new Network();
    this.timeline = new Timeline();
    this.languageServices = new LanguageServicesAPI();
    defineDeprecatedProperty(this, 'webInspector', 'resources', 'network');
  } as any as Constructable<IInspectorExtensionAPI, []>;

  interface INetwork {
    onNavigated: IEventSink;
    onRequestFinished: IEventSink;
  }

  const Network = function(this: INetwork) {
    function dispatchRequestEvent(this: IEventSink, message: {arguments: any[]}) {
      const request = message.arguments[1];
      request.__proto__ = new Request(message.arguments[0]);
      this._fire(request);
    }
    this.onRequestFinished = new EventSink(Events.NetworkRequestFinished, dispatchRequestEvent);
    defineDeprecatedProperty(this, 'network', 'onFinished', 'onRequestFinished');
    this.onNavigated = new EventSink(Commands.InspectedURLChanged);
  } as any as Constructable<INetwork, []>;

  Network.prototype = {
    getHAR: function(callback?: (arg0: any) => void) {
      function callbackWrapper(result?: {entries: {_requestId?: string}[]}) {
        const entries = (result && result.entries) || [];
        for (let i = 0; i < entries.length; ++i) {
          // @ts-ignore
          entries[i].__proto__ = new Request(entries[i]._requestId);
          delete entries[i]._requestId;
        }
        callback && callback(result);
      }
      extensionServer.sendRequest({command: Commands.GetHAR}, callback && callbackWrapper);
    },

    addRequestHeaders: function(headers: {[key: string]: string}) {
      extensionServer.sendRequest(
          {command: Commands.AddRequestHeaders, headers: headers, extensionId: window.location.hostname});
    },
  };

  interface IRequest {
    _id: string;
  }

  function RequestImpl(this: IRequest, id: string) {
    this._id = id;
  }

  RequestImpl.prototype = {
    getContent: function(callback?: (arg0: any, arg1: any) => void) {
      function callbackWrapper(response: {content: any, encoding: any}) {
        callback && callback(response.content, response.encoding);
      }
      extensionServer.sendRequest({command: Commands.GetRequestContent, id: this._id}, callback && callbackWrapper);
    },
  };

  interface IPanels {
    applyStyleSheet: (styleSheet: any) => void;
  }

  const Panels = function(this: IPanels) {
    const panels: {[key: string]: object} = {
      elements: new ElementsPanel(),
      sources: new SourcesPanel(),
    };

    function panelGetter(name: string) {
      return panels[name];
    }
    for (const panel in panels) {
      Object.defineProperty(this, panel, {get: panelGetter.bind(null, panel), enumerable: true});
    }
    this.applyStyleSheet = function(styleSheet) {
      extensionServer.sendRequest({command: Commands.ApplyStyleSheet, styleSheet: styleSheet});
    };
  } as any as {new (): IPanels};

  Panels.prototype = {
    create: function(title: string, icon: string, page: string, callback: (arg0: any, arg1: any) => any) {
      const id = 'extension-panel-' + extensionServer.nextObjectId();
      const request = {command: Commands.CreatePanel, id: id, title: title, icon: icon, page: page};
      extensionServer.sendRequest(request, callback && callback.bind(this, new ExtensionPanel(id)));
    },

    setOpenResourceHandler: function(callback: (arg1: any, arg2: any) => void) {
      const hadHandler = extensionServer.hasHandler(Events.OpenResource);

      function callbackWrapper(message: {resource: {url: string, type: string}, lineNumber: number}) {
        // Allow the panel to show itself when handling the event.
        userAction = true;
        try {
          callback.call(null, new Resource(message.resource), message.lineNumber);
        } finally {
          userAction = false;
        }
      }

      if (!callback) {
        extensionServer.unregisterHandler(Events.OpenResource);
      } else {
        extensionServer.registerHandler(Events.OpenResource, callbackWrapper);
      }

      // Only send command if we either removed an existing handler or added handler and had none before.
      if (hadHandler === !callback) {
        extensionServer.sendRequest({command: Commands.SetOpenResourceHandler, 'handlerPresent': Boolean(callback)});
      }
    },

    openResource: function(url: string, lineNumber: number, callback: any) {
      extensionServer.sendRequest({command: Commands.OpenResource, 'url': url, 'lineNumber': lineNumber}, callback);
    },

    get SearchAction() {
      return {
        CancelSearch: SearchAction.CancelSearch,
        PerformSearch: SearchAction.PerformSearch,
        NextSearchResult: SearchAction.NextSearchResult,
        PreviousSearchResult: SearchAction.PreviousSearchResult,
      };
    },
  };

  interface IExtensionView {
    onHidden: IEventSink;
    onShown: IEventSink;
    _id: string|null;
  }
  function ExtensionViewImpl(this: IExtensionView, id: string|null) {
    this._id = id;

    function dispatchShowEvent(this: IEventSink, message: {arguments: any[]}) {
      const frameIndex = message.arguments[0];
      if (typeof frameIndex === 'number') {
        this._fire(window.parent.frames[frameIndex]);
      } else {
        this._fire();
      }
    }

    if (id) {
      this.onShown = new EventSink(Events.ViewShown + id, dispatchShowEvent);
      this.onHidden = new EventSink(Events.ViewHidden + id);
    }
  }

  interface IPanelWithSideBarClass extends IExtensionView {
    new(hostPanelName: string): IPanelWithSideBarClass;
    onSelectionChanged: IEventSink;
    _hostPanelName: string;
  }
  function PanelWithSidebarImpl(this: IPanelWithSideBarClass, hostPanelName: string) {
    ExtensionViewImpl.call(this, null);
    this._hostPanelName = hostPanelName;
    this.onSelectionChanged = new EventSink(Events.PanelObjectSelected + hostPanelName);
  }

  PanelWithSidebarImpl.prototype = {
    createSidebarPane: function(title: string, callback?: (arg0: any) => void) {
      const id = 'extension-sidebar-' + extensionServer.nextObjectId();
      const request = {command: Commands.CreateSidebarPane, panel: this._hostPanelName, id: id, title: title};
      function callbackWrapper() {
        callback && callback(new ExtensionSidebarPane(id));
      }
      extensionServer.sendRequest(request, callback && callbackWrapper);
    },

    __proto__: ExtensionViewImpl.prototype,
  };

  interface ILanguageServicesAPI {
    _plugins: Map<any, MessagePort>;
  }
  function LanguageServicesAPIImpl(this: ILanguageServicesAPI) {
    this._plugins = new Map();
  }

  LanguageServicesAPIImpl.prototype = {
    registerLanguageExtensionPlugin: async function(
        plugin: DebuggerLanguagePlugin, pluginName: string,
        supportedScriptTypes: {language: string, symbol_types: string[]}) {
      if (this._plugins.has(plugin)) {
        throw new Error(`Tried to register plugin '${pluginName}' twice`);
      }
      const channel = new MessageChannel();
      const port = channel.port1;
      this._plugins.set(plugin, port);
      port.onmessage = ({data: {requestId, method, parameters}}) => {
        console.time(`${requestId}: ${method}`);
        dispatchMethodCall(method, parameters)
            .then(result => port.postMessage({requestId, result}))
            .catch(error => port.postMessage({requestId, error: {message: error.message}}))
            .finally(() => console.timeEnd(`${requestId}: ${method}`));
      };

      /**
       * @param {string} method
       * @param {*} parameters
       * @return {!Promise<*>}
       */
      function dispatchMethodCall(method: string, parameters: any): Promise<any> {
        switch (method) {
          case LanguageExtensionPluginCommands.AddRawModule:
            return plugin.addRawModule(parameters.rawModuleId, parameters.symbolsURL, parameters.rawModule);
          case LanguageExtensionPluginCommands.RemoveRawModule:
            return plugin.removeRawModule(parameters.rawModuleId);
          case LanguageExtensionPluginCommands.SourceLocationToRawLocation:
            return plugin.sourceLocationToRawLocation(parameters.sourceLocation);
          case LanguageExtensionPluginCommands.RawLocationToSourceLocation:
            return plugin.rawLocationToSourceLocation(parameters.rawLocation);
          case LanguageExtensionPluginCommands.GetScopeInfo:
            return plugin.getScopeInfo(parameters.type);
          case LanguageExtensionPluginCommands.ListVariablesInScope:
            return plugin.listVariablesInScope(parameters.rawLocation);
          case LanguageExtensionPluginCommands.GetTypeInfo:
            return plugin.getTypeInfo(parameters.expression, parameters.context);
          case LanguageExtensionPluginCommands.GetFormatter:
            return plugin.getFormatter(parameters.expressionOrField, parameters.context);
          case LanguageExtensionPluginCommands.GetInspectableAddress:
            if ('getInspectableAddress' in plugin) {
              return plugin.getInspectableAddress(parameters.field);
            }
            return Promise.resolve({js: ''});
          case LanguageExtensionPluginCommands.GetFunctionInfo:
            return plugin.getFunctionInfo(parameters.rawLocation);
          case LanguageExtensionPluginCommands.GetInlinedFunctionRanges:
            return plugin.getInlinedFunctionRanges(parameters.rawLocation);
          case LanguageExtensionPluginCommands.GetInlinedCalleesRanges:
            return plugin.getInlinedCalleesRanges(parameters.rawLocation);
          case LanguageExtensionPluginCommands.GetMappedLines:
            if ('getMappedLines' in plugin) {
              return plugin.getMappedLines(parameters.rawModuleId, parameters.sourceFileURL);
            }
            return Promise.resolve(undefined);
        }
        throw new Error(`Unknown language plugin method ${method}`);
      }

      await new Promise<void>(resolve => {
        extensionServer.sendRequest(
            {command: Commands.RegisterLanguageExtensionPlugin, pluginName, port: channel.port2, supportedScriptTypes},
            () => resolve(), [channel.port2]);
      });
    },

    /**
     * @param {*} plugin The language plugin instance to unregister.
     * @return {!Promise<void>}
     */
    unregisterLanguageExtensionPlugin: async function(plugin: DebuggerLanguagePlugin) {
      const port = this._plugins.get(plugin);
      if (!port) {
        throw new Error('Tried to unregister a plugin that was not previously registered');
      }
      this._plugins.delete(plugin);
      port.postMessage({event: LanguageExtensionPluginEvents.UnregisteredLanguageExtensionPlugin});
      port.close();
    },
  };

  interface Constructable<T, P extends any[]> {
    new(...args: [...P]): T;
  }

  function declareInterfaceClass<ThisT, ArgsT extends any[]>(implConstructor: (this: ThisT, ...args: ArgsT) => void) {
    return function(this: ThisT, ...args: ArgsT) {
      const impl = {__proto__: implConstructor.prototype};
      implConstructor.apply(impl as any, arguments as any);
      populateInterfaceClass(this, impl);
    } as any as Constructable<ThisT, ArgsT>;
  }

  function defineDeprecatedProperty(object: {[key: string]: any}, className: string, oldName: string, newName: string) {
    let warningGiven = false;
    function getter() {
      if (!warningGiven) {
        console.warn(className + '.' + oldName + ' is deprecated. Use ' + className + '.' + newName + ' instead');
        warningGiven = true;
      }
      return object[newName];
    }
    object.__defineGetter__(oldName, getter);
  }

  function extractCallbackArgument(args: IArguments) {
    const lastArgument = args[args.length - 1];
    return typeof lastArgument === 'function' ? lastArgument : undefined;
  }

  const LanguageServicesAPI = declareInterfaceClass(LanguageServicesAPIImpl);
  const Button = declareInterfaceClass(ButtonImpl);
  const EventSink = declareInterfaceClass(EventSinkImpl);
  const ExtensionPanel = declareInterfaceClass(ExtensionPanelImpl);
  const ExtensionSidebarPane = declareInterfaceClass(ExtensionSidebarPaneImpl);
  const PanelWithSidebarClass = declareInterfaceClass(PanelWithSidebarImpl);
  const Request = declareInterfaceClass(RequestImpl);
  const Resource = declareInterfaceClass(ResourceImpl);
  const TraceSession = declareInterfaceClass(TraceSessionImpl);

  class ElementsPanel extends PanelWithSidebarClass {
    constructor() {
      super('elements');
    }
  }

  class SourcesPanel extends PanelWithSidebarClass {
    constructor() {
      super('sources');
    }
  }

  interface IExtensionPanel extends IExtensionView {
    onSearch: IEventSink;
    new(id: string): IExtensionPanel;
  }
  function ExtensionPanelImpl(this: IExtensionPanel, id: string) {
    ExtensionViewImpl.call(this, id);
    this.onSearch = new EventSink(Events.PanelSearch + id);
  }

  ExtensionPanelImpl.prototype = {
    /**
     * @return {!Object}
     */
    createStatusBarButton: function(iconPath: string, tooltipText: string, disabled: boolean) {
      const id = 'button-' + extensionServer.nextObjectId();
      const request = {
        command: Commands.CreateToolbarButton,
        panel: this._id,
        id: id,
        icon: iconPath,
        tooltip: tooltipText,
        disabled: Boolean(disabled),
      };
      extensionServer.sendRequest(request);
      return new Button(id);
    },

    show: function() {
      if (!userAction) {
        return;
      }

      const request = {command: Commands.ShowPanel, id: this._id};
      extensionServer.sendRequest(request);
    },

    __proto__: ExtensionViewImpl.prototype,
  };

  /**
   * @constructor
   * @extends {ExtensionViewImpl}
   */
  interface IExtensionSidebarPane extends IExtensionView {}
  function ExtensionSidebarPaneImpl(this: IExtensionSidebarPane, id: string) {
    ExtensionViewImpl.call(this, id);
  }

  ExtensionSidebarPaneImpl.prototype = {
    setHeight: function(height: number) {
      extensionServer.sendRequest({command: Commands.SetSidebarHeight, id: this._id, height: height});
    },

    setExpression: function(
        this: IExtensionSidebarPane, expression: string, rootTitle: string, evaluateOptions: object) {
      const request = {
        command: Commands.SetSidebarContent,
        id: this._id,
        expression,
        rootTitle,
        evaluateOnPage: true,
        evaluateOptions: typeof evaluateOptions === 'object' ? evaluateOptions : undefined,
      };
      extensionServer.sendRequest(request, extractCallbackArgument(arguments));
    },

    setObject: function(
        this: IExtensionSidebarPane, jsonObject: string, rootTitle: string, callback: (...args: any[]) => void) {
      extensionServer.sendRequest(
          {command: Commands.SetSidebarContent, id: this._id, expression: jsonObject, rootTitle}, callback);
    },

    setPage: function(this: IExtensionSidebarPane, page: string) {
      extensionServer.sendRequest({command: Commands.SetSidebarPage, id: this._id, page});
    },

    __proto__: ExtensionViewImpl.prototype,
  };

  interface IButton {
    onClicked: IEventSink;
    _id: string;
  }
  function ButtonImpl(this: IButton, id: string) {
    this._id = id;
    this.onClicked = new EventSink(Events.ButtonClicked + id);
  }

  ButtonImpl.prototype = {
    update: function(this: IButton, iconPath: string, tooltipText: string, disabled: boolean) {
      const request = {
        command: Commands.UpdateButton,
        id: this._id,
        icon: iconPath,
        tooltip: tooltipText,
        disabled: Boolean(disabled),
      };
      extensionServer.sendRequest(request);
    },
  };

  interface ITimeline {}

  const Timeline = function(this: ITimeline) {} as any as Constructable<ITimeline, []>;

  Timeline.prototype = {
    /**
     * @param {string} categoryName
     * @param {string} categoryTooltip
     * @return {!TraceProvider}
     */
    addTraceProvider: function(this: ITimeline, categoryName: string, categoryTooltip: string) {
      const id = 'extension-trace-provider-' + extensionServer.nextObjectId();
      extensionServer.sendRequest({command: Commands.AddTraceProvider, id, categoryName, categoryTooltip});
      return new TraceProvider(id);
    },
  };

  interface ITraceSession {
    _id: string;
  }
  function TraceSessionImpl(this: ITraceSession, id: string) {
    this._id = id;
  }

  TraceSessionImpl.prototype = {
    /**
     * @param {string=} url
     * @param {number=} timeOffset
     */
    complete: function(this: ITraceSession, url = '', timeOffset = 0) {
      const request = {command: Commands.CompleteTraceSession, id: this._id, url, timeOffset};
      extensionServer.sendRequest(request);
    },
  };

  interface ITraceProvider {
    onRecordingStopped: IEventSink;
    onRecordingStarted: IEventSink;
  }

  const TraceProvider = function(this: ITraceProvider, id: string) {
    function dispatchRecordingStarted(this: IEventSink, message: {arguments: any[]}) {
      const sessionId = message.arguments[0];
      this._fire(new TraceSession(sessionId));
    }

    this.onRecordingStarted = new EventSink(Events.RecordingStarted + id, dispatchRecordingStarted);
    this.onRecordingStopped = new EventSink(Events.RecordingStopped + id);
  } as any as Constructable<ITraceProvider, [string]>;


  interface IInspectedWindow {
    onResourceContentCommitted: IEventSink;
    onResourceAdded: IEventSink;
  }

  const InspectedWindow = function(this: IInspectedWindow) {
    function dispatchResourceEvent(this: IEventSink, message: {arguments: any[]}) {
      this._fire(new Resource(message.arguments[0]));
    }

    function dispatchResourceContentEvent(this: IEventSink, message: {arguments: any[]}) {
      this._fire(new Resource(message.arguments[0]), message.arguments[1]);
    }

    this.onResourceAdded = new EventSink(Events.ResourceAdded, dispatchResourceEvent);
    this.onResourceContentCommitted = new EventSink(Events.ResourceContentCommitted, dispatchResourceContentEvent);
  } as any as Constructable<IInspectedWindow, []>;

  InspectedWindow.prototype = {
    reload: function(this: IInspectedWindow, optionsOrUserAgent: object|string) {
      let options = null;
      if (typeof optionsOrUserAgent === 'object') {
        options = optionsOrUserAgent;
      } else if (typeof optionsOrUserAgent === 'string') {
        options = {userAgent: optionsOrUserAgent};
        console.warn(
            'Passing userAgent as string parameter to inspectedWindow.reload() is deprecated. ' +
            'Use inspectedWindow.reload({ userAgent: value}) instead.');
      }
      extensionServer.sendRequest({command: Commands.Reload, options: options});
    },

    eval: function(this: IInspectedWindow, expression: string, evaluateOptions: object) {
      const callback = extractCallbackArgument(arguments);
      function callbackWrapper(result: {isError: any, isException: any, value: any}) {
        if (result.isError || result.isException) {
          callback(undefined, result);
        } else {
          callback(result.value);
        }
      }
      const request = {
        command: Commands.EvaluateOnInspectedPage,
        expression: expression,
        evaluateOptions: typeof evaluateOptions === 'object' ? evaluateOptions : undefined,
      };
      extensionServer.sendRequest(request, callback && callbackWrapper);
      return null;
    },

    getResources: function(this: IInspectedWindow, callback?: (arg0: any) => void) {
      function wrapResource(resourceData: any) {
        return new Resource(resourceData);
      }
      function callbackWrapper(resources: any[]) {
        callback && callback(resources.map(wrapResource));
      }
      extensionServer.sendRequest({command: Commands.GetPageResources}, callback && callbackWrapper);
    },
  };

  interface IResource {
    _type: string;
    _url: string;
  }
  function ResourceImpl(this: IResource, resourceData: {url: string, type: string}) {
    this._url = resourceData.url;
    this._type = resourceData.type;
  }

  ResourceImpl.prototype = {
    get url() {
      return this._url;
    },

    get type() {
      return this._type;
    },

    getContent: function(callback?: (arg0: any, arg1: any) => void) {
      function callbackWrapper(response: {content: any, encoding: any}) {
        callback && callback(response.content, response.encoding);
      }

      extensionServer.sendRequest({command: Commands.GetResourceContent, url: this._url}, callback && callbackWrapper);
    },

    setContent: function(content: any, commit: any, callback: any) {
      extensionServer.sendRequest(
          {command: Commands.SetResourceContent, url: this._url, content: content, commit: commit}, callback);
    },
  };

  function getTabId() {
    return inspectedTabId;
  }

  let keyboardEventRequestQueue: {
    eventType: string,
    ctrlKey: boolean,
    altKey: boolean,
    metaKey: boolean,
    shiftKey: boolean,
    keyIdentifier: any,
    key: string,
    code: string,
    location: number,
    keyCode: number,
  }[] = [];
  let forwardTimer: number|null = null;
  function forwardKeyboardEvent(event: KeyboardEvent) {
    // Check if the event should be forwarded.
    // This is a workaround for crbug.com/923338.
    const focused = document.activeElement;
    if (focused) {
      const isInput = focused.nodeName === 'INPUT' || focused.nodeName === 'TEXTAREA';
      if (isInput && !(event.ctrlKey || event.altKey || event.metaKey)) {
        return;
      }
    }

    let modifiers = 0;
    if (event.shiftKey) {
      modifiers |= 1;
    }
    if (event.ctrlKey) {
      modifiers |= 2;
    }
    if (event.altKey) {
      modifiers |= 4;
    }
    if (event.metaKey) {
      modifiers |= 8;
    }
    const num = (event.keyCode & 255) | (modifiers << 8);
    // We only care about global hotkeys, not about random text
    if (!keysToForwardSet.has(num)) {
      return;
    }
    event.preventDefault();
    const requestPayload = {
      eventType: event.type,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      // @ts-ignore
      keyIdentifier: event.keyIdentifier,
      key: event.key,
      code: event.code,
      location: event.location,
      keyCode: event.keyCode,
    };
    keyboardEventRequestQueue.push(requestPayload);
    if (!forwardTimer) {
      // @ts-ignore
      forwardTimer = setTimeout(forwardEventQueue, 0);
    }
  }

  function forwardEventQueue() {
    forwardTimer = null;
    const request = {command: Commands.ForwardKeyboardEvent, entries: keyboardEventRequestQueue};
    extensionServer.sendRequest(request);
    keyboardEventRequestQueue = [];
  }

  document.addEventListener('keydown', forwardKeyboardEvent, false);

  interface IExtensionServerClient {
    _port: MessagePort;
    _lastObjectId: number;
    _lastRequestId: number;
    _handlers: {[key: string]: any};
    _callbacks: {[key: string]: (...args: any[]) => void};

    sendRequest(message: any, callback?: (...args: any[]) => void, transfers?: Transferable[]): void;
    registerHandler(event: string, data: any): void;
    nextObjectId(): string;
    hasHandler(command: string): boolean;
    unregisterHandler(command: string): void;
    _registerCallback(callback: (...args: any[]) => void): any;
    _onCallback(request: {requestId: string, result: any}): void;
    _onMessage(event: MessageEvent): void;
  }

  const ExtensionServerClient = function(this: IExtensionServerClient) {
    this._callbacks = {};
    this._handlers = {};
    this._lastRequestId = 0;
    this._lastObjectId = 0;

    this.registerHandler('callback', this._onCallback.bind(this));

    const channel = new MessageChannel();
    this._port = channel.port1;
    this._port.addEventListener('message', this._onMessage.bind(this), false);
    this._port.start();

    window.parent.postMessage('registerExtension', '*', [channel.port2]);
  } as any as Constructable<IExtensionServerClient, []>;

  ExtensionServerClient.prototype = {
    sendRequest: function(
        this: IExtensionServerClient, message: any, callback?: (...args: any[]) => void, transfers?: Transferable[]) {
      if (typeof callback === 'function') {
        message.requestId = this._registerCallback(callback);
      }
      this._port.postMessage(message, transfers || []);
    },

    hasHandler: function(this: IExtensionServerClient, command: string) {
      return Boolean(this._handlers[command]);
    },

    registerHandler: function(this: IExtensionServerClient, command: string, handler: any) {
      this._handlers[command] = handler;
    },

    unregisterHandler: function(this: IExtensionServerClient, command: string) {
      delete this._handlers[command];
    },

    nextObjectId: function(this: IExtensionServerClient) {
      return injectedScriptId.toString() + '_' + ++this._lastObjectId;
    },

    _registerCallback: function(this: IExtensionServerClient, callback: (...args: any[]) => void) {
      const id = ++this._lastRequestId;
      this._callbacks[id] = callback;
      return id;
    },

    _onCallback: function(this: IExtensionServerClient, request: {requestId: string, result: any}) {
      if (request.requestId in this._callbacks) {
        const callback = this._callbacks[request.requestId];
        delete this._callbacks[request.requestId];
        callback(request.result);
      }
    },

    _onMessage: function(this: IExtensionServerClient, event: MessageEvent) {
      const request = event.data;
      const handler = this._handlers[request.command];
      if (handler) {
        handler.call(this, request);
      }
    },
  };

  interface ProtoChain {
    __proto__?: ProtoChain;
  }
  function populateInterfaceClass<T extends ProtoChain>(interfaze: {[key: string]: any}, implementation: T) {
    for (const member in implementation) {
      if (member.charAt(0) === '_') {
        continue;
      }
      let descriptor = null;
      // Traverse prototype chain until we find the owner.
      for (let owner: ProtoChain|undefined = implementation; owner && !descriptor; owner = owner.__proto__) {
        descriptor = Object.getOwnPropertyDescriptor(owner, member);
      }
      if (!descriptor) {
        continue;
      }
      if (typeof descriptor.value === 'function') {
        interfaze[member] = descriptor.value.bind(implementation);
      } else if (typeof descriptor.get === 'function') {
        interfaze.__defineGetter__(member, descriptor.get.bind(implementation));
      } else {
        Object.defineProperty(interfaze, member, descriptor);
      }
    }
  }

  const extensionServer = new ExtensionServerClient();
  const coreAPI = new InspectorExtensionAPI();

  Object.defineProperty(chrome, 'devtools', {value: {}, enumerable: true});

  // Only expose tabId on chrome.devtools.inspectedWindow, not webInspector.inspectedWindow.
  // @ts-ignore
  chrome.devtools.inspectedWindow = {};
  Object.defineProperty(chrome.devtools.inspectedWindow, 'tabId', {get: getTabId});
  // @ts-ignore
  chrome.devtools.inspectedWindow.__proto__ = coreAPI.inspectedWindow;
  // @ts-ignore
  chrome.devtools.network = coreAPI.network;
  // @ts-ignore
  chrome.devtools.panels = coreAPI.panels;
  // @ts-ignore
  chrome.devtools.panels.themeName = themeName;
  // @ts-ignore
  chrome.devtools.languageServices = new LanguageServicesAPI();

  // default to expose experimental APIs for now.
  if (extensionInfo.exposeExperimentalAPIs !== false) {
    // @ts-ignore
    chrome.experimental = chrome.experimental || {};
    // @ts-ignore
    chrome.experimental.devtools = chrome.experimental.devtools || {};

    const properties = Object.getOwnPropertyNames(coreAPI);
    for (let i = 0; i < properties.length; ++i) {
      const descriptor = Object.getOwnPropertyDescriptor(coreAPI, properties[i]);
      if (descriptor) {
        // @ts-ignore
        Object.defineProperty(chrome.experimental.devtools, properties[i], descriptor);
      }
    }
    // @ts-ignore
    chrome.experimental.devtools.inspectedWindow = chrome.devtools.inspectedWindow;
  }

  if (extensionInfo.exposeWebInspectorNamespace) {
    // @ts-ignore
    window.webInspector = coreAPI;
  }
  testHook(extensionServer, coreAPI);
};

/**
 * @param {!} extensionInfo
 * @param {string} inspectedTabId
 * @param {string} themeName
 * @param {!Array<number>} keysToForward
 * @param {function(!Object, !Object)|undefined} testHook
 * @return {string}
 */
self.buildExtensionAPIInjectedScript = function(
    extensionInfo: ExtensionDescriptor, inspectedTabId: string, themeName: string, keysToForward: number[],
    testHook: (arg0: object, arg1: object) => void|undefined): string {
  const argumentsJSON =
      [extensionInfo, inspectedTabId || null, themeName, keysToForward].map(_ => JSON.stringify(_)).join(',');
  if (!testHook) {
    testHook = () => {};
  }
  return '(function(injectedScriptId){ ' +
      '(' + self.injectedExtensionAPI.toString() + ')(' + argumentsJSON + ',' + testHook + ', injectedScriptId);' +
      '})';
};
