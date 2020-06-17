// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../common/common.js';
import * as Extensions from '../extensions/extensions.js';
import * as ProtocolClient from '../protocol_client/protocol_client.js';
import * as SDK from '../sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';

class SourceVariable extends SDK.RemoteObject.RemoteObjectImpl {
  /**
   * @param {!SDK.DebuggerModel.CallFrame} callFrame
   * @param {!Variable} variable
   * @param {!DebuggerLanguagePluginExtension} plugin
   * @param {!RawLocation} location
   */
  constructor(callFrame, variable, plugin, location) {
    super(
        callFrame.debuggerModel.runtimeModel(), /* objectId=*/ undefined, /* type=*/ variable.type,
        /* subtype=*/ undefined, /* value=*/ null, /* unserializableValue=*/ undefined,
        /* customPreview=*/ variable.type);
    this._variable = variable;
    this._callFrame = callFrame;
    this._plugin = plugin;
    this._location = location;
    this._hasChildren = true;
    this._evaluator = plugin.evaluateVariable(variable.name, location);
  }

  /**
   * @override
   * @return {string}
   */
  get type() {
    return this._variable.type;
  }

  /**
   * @override
   * @param {boolean} ownProperties
   * @param {boolean} accessorPropertiesOnly
   * @param {boolean} generatePreview
   * @return {!Promise<!SDK.RemoteObject.GetPropertiesResult>}
   */
  async doGetProperties(ownProperties, accessorPropertiesOnly, generatePreview) {
    if (accessorPropertiesOnly) {
      return /** @type {!SDK.RemoteObject.GetPropertiesResult} */ ({properties: [], internalProperties: []});
    }

    const repr = await getRepr(this._evaluator, this._callFrame, this._plugin);
    return /** @type {!SDK.RemoteObject.GetPropertiesResult} */ ({
      properties: [new SDK.RemoteObject.RemoteObjectProperty(
          'value', repr, /* enumerable=*/ false, /* writable=*/ false, /* isOwn=*/ true, /* wasThrown=*/ false)],
      internalProperties: []
    });

    async function getRepr(evaluatorPromise, callFrame, plugin) {
      try {
        const evaluator = await evaluatorPromise;
        const evaluateResponse = await callFrame.debuggerModel._agent.invoke_executeWasmEvaluator(
            {callFrameId: callFrame.id, evaluator: evaluator.code});
        if (evaluateResponse[ProtocolClient.InspectorBackend.ProtocolError] || evaluateResponse.exceptionDetails) {
          console.error(
              evaluateResponse[ProtocolClient.InspectorBackend.ProtocolError] ||
              evaluateResponse.exceptionDetails.exception.description);
          return null;
        }

        const value = JSON.parse(evaluateResponse.result.value);
        return await plugin.getRepresentation(value);
      } catch (error) {
        if (!(error instanceof DebuggerLanguagePluginError)) {
          throw error;
        }
        console.error('Error in debugger language plugin: ' + error.message + ' (' + error.code + ')');
        return null;
      }
    }
  }
}

class SourceScopeRemoteObject extends SDK.RemoteObject.RemoteObjectImpl {
  /**
   * @param {!SDK.DebuggerModel.CallFrame} callFrame
   * @param {!DebuggerLanguagePluginExtension} plugin
   * @param {!RawLocation} location
   */
  constructor(callFrame, plugin, location) {
    super(callFrame.debuggerModel.runtimeModel(), undefined, 'object', undefined, null);
    /** @type {!Array<!Variable>} */
    this.variables = [];
    this._callFrame = callFrame;
    this._plugin = plugin;
    this._location = location;
  }

  /**
   * @override
   * @param {boolean} ownProperties
   * @param {boolean} accessorPropertiesOnly
   * @param {boolean} generatePreview
   * @return {!Promise<!SDK.RemoteObject.GetPropertiesResult>}
   */
  async doGetProperties(ownProperties, accessorPropertiesOnly, generatePreview) {
    if (accessorPropertiesOnly) {
      return /** @type {!SDK.RemoteObject.GetPropertiesResult} */ ({properties: [], internalProperties: []});
    }

    const properties = this.variables.map(
        variable => new SDK.RemoteObject.RemoteObjectProperty(
            variable.name,
            this._variableToRemoteObject(
                variable),  // new SourceVariable(this._callFrame, variable, this._plugin, this._location),
            /* enumerable=*/ false, /* writable=*/ false, /* isOwn=*/ true, /* wasThrown=*/ false));

    return /** @type {!SDK.RemoteObject.GetPropertiesResult} */ ({properties: properties, internalProperties: []});
  }

  _variableToRemoteObject(variable) {
    if (variable.nestedVariables && variable.nestedVariables.length) {
      return new SDK.RemoteObject.LocalJSONObject(this._variableToNestedObject(variable));
    }
    return this._variableToSourceVariable(variable);
  }

  _variableToSourceVariable(variable) {
    return new SourceVariable(this._callFrame, variable, this._plugin, this._location);
  }

  _variableToNestedObject(variable) {
    const result = {};
    for (const nested of variable.nestedVariables) {
      if (nested.nestedVariables && nested.nestedVariables.length) {
        result[nested.name] = this._variableToNestedObject(nested);
      } else {
        result[nested.name] = this._variableToSourceVariable(nested);
      }
    }
    return result;
  }
}

/**
 * @unrestricted
 * TODO rename Scope to RawScope and add a common interface
 */
class SourceScope {
  /**
   * @param {!SDK.DebuggerModel.CallFrame} callFrame
   * @param {string} type
   * @param {!DebuggerLanguagePluginExtension} plugin
   * @param {!RawLocation} location
   */
  constructor(callFrame, type, plugin, location) {
    this._callFrame = callFrame;
    this._type = type;
    this._object = new SourceScopeRemoteObject(callFrame, plugin, location);
    this._name = type;
    /** @type {?Location} */
    this._startLocation = null;
    /** @type {?Location} */
    this._endLocation = null;
  }

  /**
   * @return {!SDK.DebuggerModel.CallFrame}
   */
  callFrame() {
    return this._callFrame;
  }

  /**
   * @return {string}
   */
  type() {
    return this._type;
  }

  /**
   * @return {string}
   */
  typeName() {
    return this.type();
  }


  /**
   * @return {string|undefined}
   */
  name() {
    return this._name;
  }

  /**
   * @return {?Location}
   */
  startLocation() {
    return this._startLocation;
  }

  /**
   * @return {?Location}
   */
  endLocation() {
    return this._endLocation;
  }

  /**
   * @return {!SourceScopeRemoteObject}
   */
  object() {
    return this._object;
  }

  /**
   * @return {string}
   */
  description() {
    return this.type();
  }
}

class DebuggerLanguagePluginExtension {
  constructor(pluginId) {
    this._pluginId = pluginId;
    this._requestId = 0;
  }

  _nextRequestId() {
    return this._requestId++;
  }

  async handleScript(scriptId, isWasm, sourceURL, sourceMapURL, debugSymbols) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'handleScript',
        {scriptId, isWasm, sourceURL, sourceMapURL, debugSymbols});
  }

  async addRawModule(rawModuleId, symbolsURL, rawModule) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'addRawModule', {rawModuleId, symbolsURL, rawModule});
  }

  async sourceLocationToRawLocation(sourceLocation) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'sourceLocationToRawLocation', {sourceLocation});
  }

  async rawLocationToSourceLocation(rawLocation) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'rawLocationToSourceLocation', {rawLocation});
  }

  async listVariablesInScope(rawLocation) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'listVariablesInScope', {rawLocation});
  }

  async evaluateVariable(name, location) {
    return await self.Extensions.extensionServer.sendLanguagePluginRequestAsync(
        this._pluginId, this._nextRequestId(), 'evaluateVariable', {name, location});
  }

  /** Get the representation when value contains a string
   * @param {!VariableValue} value
   */
  _reprString(value) {
    return value.value;
  }

  /** Get the representation when value contains a number
   * @param {!VariableValue} value
   */
  _reprNumber(value) {
    return Number(value.value);
  }

  /** Get the representation when value is a compound value
   * @param {!VariableValue} value
   */
  _reprCompound(value) {
    const result = {};
    for (const property of value.value) {
      result[property.name] = this._repr(property);
    }
    return result;
  }

  /** Get the representation when value contains an array of values
   * @param {!VariableValue} value
   */
  _reprArray(value) {
    if (value.value.length > 0 && value.value[0].name && value.value[0].name.endsWith(']')) {
      return value.value.map(v => this._repr(v));
    }
    return this._reprCompound(value);
  }

  /** Get the representation for a variable value
   * @param {!VariableValue} value
   */
  _repr(value) {
    if (Array.isArray(value.value)) {
      return this._reprArray(value);
    }
    console.error(`Repr for type ${value.type}`);
    const numberTypes = [
      'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'float', 'double',
      'long double'
    ];
    if (numberTypes.indexOf(value.type) > -1) {
      return this._reprNumber(value);
    }
    return this._reprString(value);
  }

  /** Produce a language specific representation of a variable value
   * @param {!VariableValue} value
   * @return {!Promise<!SDK.RemoteObject.RemoteObject>}
   */
  async getRepresentation(value) {
    return new SDK.RemoteObject.LocalJSONObject(this._repr(value));
  }
}

/**
 * @unrestricted
 */
export class DebuggerLanguagePluginManager {
  /**
   * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
   * @param {!Workspace.Workspace.WorkspaceImpl} workspace
   * @param {!Bindings.DebuggerWorkspaceBinding} debuggerWorkspaceBinding
   */
  constructor(debuggerModel, workspace, debuggerWorkspaceBinding) {
    this._sourceMapManager = debuggerModel.sourceMapManager();
    this._debuggerModel = debuggerModel;
    this._debuggerWorkspaceBinding = debuggerWorkspaceBinding;
    /** @type {!Array<!DebuggerLanguagePluginExtension>} */
    this._plugins = [];
    for (const pluginId of self.Extensions.extensionServer.languagePluginExtensions) {
      this._plugins.push(new DebuggerLanguagePluginExtension(pluginId));
    }

    // @type {!Map<!Workspace.UISourceCode.UISourceCode, !Array<[string, !SDK.Script.Script]>>}
    this._uiSourceCodes = new Map();
    // @type {!Map<string, !DebuggerLanguagePluginExtension>}
    this._pluginForScriptId = new Map();

    const target = this._debuggerModel.target();
    this._project = new Bindings.ContentProviderBasedProject(
        workspace, 'language_plugins::' + target.id(), Workspace.Workspace.projectTypes.Network, '',
        false /* isServiceProject */);
    Bindings.NetworkProject.setTargetForProject(this._project, target);


    const runtimeModel = debuggerModel.runtimeModel();
    this._eventHandlers = [
      this._debuggerModel.addEventListener(
          SDK.DebuggerModel.Events.ParsedScriptSource, this._newScriptSourceListener, this),
      runtimeModel.addEventListener(
          SDK.RuntimeModel.Events.ExecutionContextDestroyed, this._executionContextDestroyed, this),
      self.Extensions.extensionServer.addEventListener(
          Extensions.ExtensionServer.Events.LanguagePluginExtensionAdded, this._languagePluginExtensionAdded, this)
    ];
  }

  clearPlugins() {
    this._plugins = [];
  }

  /**
   * @param {!DebuggerLanguagePluginExtension} plugin
   */
  addPlugin(plugin) {
    this._plugins.push(plugin);
  }

  _languagePluginExtensionAdded(event) {
    this.addPlugin(new DebuggerLanguagePluginExtension(event.data));
  }

  /**
   * @param {!SDK.Script.Script} script
   * @return {boolean}
   */
  hasPluginForScript(script) {
    return this._pluginForScriptId.has(script.scriptId);
  }

  /**
   * @param {!SDK.Script.Script} script
   * @return {!Promise<?DebuggerLanguagePluginExtension>}
   */
  async _getPluginForScript(script) {
    const plugin = this._pluginForScriptId.get(script.scriptId);
    if (plugin) {
      return plugin;
    }

    for (const plugin of this._plugins) {
      if (await plugin.handleScript(
              script.scriptId, script.isWasm(), script.sourceURL, script.sourceMapURL, script.debugSymbols)) {
        this._pluginForScriptId.set(script.scriptId, plugin);
        return plugin;
      }
    }

    return null;
  }

  /**
   * @param {!SDK.DebuggerModel.Location} rawLocation
   * @return {!Promise<?Workspace.UISourceCode.UILocation>}
   */
  async rawLocationToUILocation(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return null;
    }
    const plugin = this._pluginForScriptId.get(script.scriptId);
    if (!plugin) {
      return null;
    }

    const pluginLocation = {
      rawModuleId: script.scriptId,
      // RawLocation.columnNumber is the byte offset in the full raw wasm module. Plugins expect the offset in the code
      // section, so subtract the offset of the code section in the module here.
      codeOffset: rawLocation.columnNumber - script.codeOffset()
    };
    const sourceLocations = await plugin.rawLocationToSourceLocation(pluginLocation);

    if (!sourceLocations || sourceLocations.length === 0) {
      return null;
    }

    // TODO(chromium:1044536) Support multiple UI locations.
    const sourceLocation = sourceLocations[0];

    const sourceFileURL =
        DebuggerLanguagePluginManager._makeUISourceFileURL(sourceLocation.sourceFile, new URL(script.sourceURL).origin);
    if (sourceFileURL === null) {
      return null;
    }
    const uiSourceCode = this._project.uiSourceCodeForURL(sourceFileURL.toString());
    if (!uiSourceCode) {
      return null;
    }
    return uiSourceCode.uiLocation(sourceLocation.lineNumber, sourceLocation.columnNumber);
  }

  /**
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   * @param {number} lineNumber
   * @param {number} columnNumber
   * @return {!Promise<?Array<!SDK.DebuggerModel.Location>>} Returns null if this manager does not have a plugin for it.
   */
  async uiLocationToRawLocations(uiSourceCode, lineNumber, columnNumber) {
    const mappedSourceFiles = this._uiSourceCodes.get(uiSourceCode);
    if (!mappedSourceFiles) {
      return null;
    }

    const locationPromises = [];
    for (const [sourceFile, script] of mappedSourceFiles) {
      const plugin = this._pluginForScriptId.get(script.scriptId);
      if (plugin) {
        locationPromises.push(getLocations(this._debuggerModel, plugin, sourceFile, script));
      }
    }

    if (locationPromises.length === 0) {
      return null;
    }
    return (await Promise.all(locationPromises)).flat();

    /**
     * @return {!Promise<!Array<!SDK.DebuggerModel.Location>>}
     */
    async function getLocations(debuggerModel, plugin, sourceFile, script) {
      const pluginLocation =
          {rawModuleId: script.scriptId, sourceFile: sourceFile, lineNumber: lineNumber, columnNumber: columnNumber};

      const rawLocations = await plugin.sourceLocationToRawLocation(pluginLocation);
      if (!rawLocations || rawLocations.length === 0) {
        return [];
      }

      return rawLocations.map(
          m => new SDK.DebuggerModel.Location(
              debuggerModel, script.scriptId, 0, Number(m.codeOffset) + script.codeOffset()));
    }
  }

  /**
     * @param {!SDK.Script.Script} script
     */
  async _getRawModule(script) {
    if (!script.sourceURL.startsWith('wasm://')) {
      return {url: script.sourceURL};
    }
    if (script.sourceMapURL === SDK.SourceMap.WasmSourceMap.FAKE_URL) {
      return {code: await script.getWasmBytecode()};
    }
    return null;
  }

  /**
   * @param {!SDK.Script.Script} script
   * @return {!Promise<?Array<string>>}
   */
  async _getSourceFiles(script) {
    const rawModule = await this._getRawModule(script);
    if (!rawModule) {
      return null;
    }
    const plugin = this._pluginForScriptId.get(script.scriptId);
    if (plugin) {
      const sourceFiles = await plugin.addRawModule(script.scriptId, script.sourceMapURL || '', rawModule);
      return sourceFiles;
    }
    return null;
  }

  /**
   * @param {string} filename
   * @param {string=} baseURL
   * @return {?URL}
   */
  static _makeUISourceFileURL(filename, baseURL) {
    function makeUrl(filename) {
      try {
        const url = new URL(filename);
        if (url.protocol !== 'file:' || !url.hostname) {
          return url;
        }
      } catch (error) {
        if (!(error instanceof TypeError)) {
          throw error;
        }
      }
      return null;
    }
    return makeUrl(filename) || makeUrl('file://' + filename) || new URL(filename, baseURL);
  }

  /**
   * @param {string} sourceFileURL
   * @return {!Workspace.UISourceCode.UISourceCode}
   */
  _getOrCreateUISourceCode(sourceFile, script, sourceFileURL) {
    let uiSourceCode = this._project.uiSourceCodeForURL(sourceFileURL);
    if (uiSourceCode) {
      return uiSourceCode;
    }

    uiSourceCode = this._project.createUISourceCode(sourceFileURL, Common.ResourceType.resourceTypes.SourceMapScript);
    Bindings.NetworkProject.setInitialFrameAttribution(uiSourceCode, script.frameId);
    const contentProvider = new SDK.CompilerSourceMappingContentProvider.CompilerSourceMappingContentProvider(
        sourceFileURL, Common.ResourceType.resourceTypes.SourceMapScript);
    this._bindUISourceCode(uiSourceCode, script, sourceFile);

    // TODO(pfaffe) Try and set a correct mimetype here? We don't actually know the mime type of the source code here,
    // and there might not even be one for the respective language which only the plugin knows about.
    this._project.addUISourceCodeWithProvider(uiSourceCode, contentProvider, null, 'text/javascript');
    return uiSourceCode;
  }

  /**
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   * @param {!SDK.Script.Script} script
   * @param {string} sourceFile
   */
  _bindUISourceCode(uiSourceCode, script, sourceFile) {
    const entry = this._uiSourceCodes.get(uiSourceCode);
    if (entry) {
      entry.push([sourceFile, script]);
    } else {
      this._uiSourceCodes.set(uiSourceCode, [[sourceFile, script]]);
    }
  }

  /**
   * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
   * @param {!Set<!SDK.Script.Script>} scripts
   */
  _unbindUISourceCode(uiSourceCode, scripts) {
    const filter = ([sourceFile, script]) => !scripts.has(script);
    this._uiSourceCodes.set(uiSourceCode, this._uiSourceCodes.get(uiSourceCode).filter(filter));
    if (this._uiSourceCodes.get(uiSourceCode).length === 0) {
      this._project.removeFile(uiSourceCode.url());
      this._uiSourceCodes.delete(uiSourceCode);
    }
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _newScriptSourceListener(event) {
    const script = /** @type {!SDK.Script.Script} */ (event.data);
    this._newScriptSource(script);
  }

  /**
   * @param {!SDK.Script.Script} script
   */
  async _newScriptSource(script) {
    if (!await this._getPluginForScript(script)) {
      return;
    }

    const sourceFiles = await this._getSourceFiles(script);
    if (!sourceFiles) {
      return;
    }

    for (const sourceFile of sourceFiles) {
      const sourceFileURL =
          DebuggerLanguagePluginManager._makeUISourceFileURL(sourceFile, new URL(script.sourceURL).origin);
      if (sourceFileURL === null) {
        return;
      }
      this._getOrCreateUISourceCode(sourceFile, script, sourceFileURL.toString());
    }
    this._debuggerWorkspaceBinding.updateLocations(script);
  }

  /**
   * @param {!Common.EventTarget.EventTargetEvent} event
   */
  _executionContextDestroyed(event) {
    const executionContext = /** @type {!SDK.RuntimeModel.ExecutionContext} */ (event.data);
    const scripts = new Set(this._debuggerModel.scriptsForExecutionContext(executionContext));

    for (const uiSourceCode of this._uiSourceCodes.keys()) {
      this._unbindUISourceCode(uiSourceCode, scripts);
    }

    for (const script of scripts) {
      this._pluginForScriptId.delete(script.scriptId);
    }
  }

  dispose() {
    this._project.dispose();
    for (const plugin of this._plugins) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }
    this._pluginForScriptId.clear();
    this._uiSourceCodes.clear();
  }

  /**
   * @param {!SDK.DebuggerModel.CallFrame} callFrame
   * @return {!Promise<?Array<!SourceScope>>}
   */
  async resolveScopeChain(callFrame) {
    if (!callFrame) {
      return null;
    }
    const script = callFrame.script;
    const plugin = this._pluginForScriptId.get(script.scriptId);
    if (!plugin) {
      return null;
    }
    /** @type {!Map<string, !SourceScope>} */
    const scopes = new Map();
    /** @type {!RawLocation}} */
    const location = {
      'rawModuleId': script.scriptId,
      'codeOffset': callFrame.location().columnNumber - script.codeOffset()
    };

    const variables = await plugin.listVariablesInScope(location);
    if (variables) {
      for (const variable of variables) {
        if (!scopes.has(variable.scope)) {
          scopes.set(variable.scope, new SourceScope(callFrame, variable.scope, plugin, location));
        }
        scopes.get(variable.scope).object().variables.push(variable);
      }
    }
    return Array.from(scopes.values());
  }
}

export class DebuggerLanguagePluginError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'DebuggerLanguagePluginError';
  }
}

/** Raw modules represent compiled JavaScript Scripts or Wasm Modules
 * @typedef {{
 *            url:string,
 *            code:string
 *          }}
 */
export let RawModule;

/** Offsets in raw modules
 * @typedef {{
 *            rawModuleId:string,
 *            codeOffset:number
 *          }}
 */
export let RawLocation;

/** Locations in source files
 * @typedef {{
 *            sourceFile:string,
 *            lineNumber:number,
 *            columnNumber:number
 *          }}
 */
export let SourceLocation;

/** A source language variable
 * @typedef {{
 *            scope:string,
 *            name:string,
 *            type:string
 *          }}
 */
export let Variable;

/** The value of a source language variable
 * @typedef {{
 *            value: (string|!Array<!VariableValue>),
 *            type: string,
 *            name: string
 *          }}
 */
export let VariableValue;
