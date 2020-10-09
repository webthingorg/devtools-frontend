// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Bindings from '../bindings/bindings.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';                 // eslint-disable-line no-unused-vars

import {LanguageExtensionPluginCommands} from './ExtensionAPI.js';

/**
 * @implements {Bindings.DebuggerLanguagePlugins.DebuggerLanguagePlugin}
 */
export class LanguageExtensionEndpoint {
  /**
   * @param {string} pluginName
   * @param {!{language: string, symbol_types: !Array<string>}} supportedScriptTypes
   * @param {!MessagePort} port
   */
  constructor(pluginName, supportedScriptTypes, port) {
    this._pluginName = pluginName;
    this._supportedScriptTypes = supportedScriptTypes;
    this._port = port;
    this._port.onmessage = this._onResponse.bind(this);
    this._nextRequestId = 0;
    this._pendingRequests = new Map();
  }

  /**
   * @param {string} method
   * @param {*} parameters
   * @return {!Promise<*>}
   */
  _sendRequest(method, parameters) {
    return new Promise((resolve, reject) => {
      const requestId = this._nextRequestId++;
      this._pendingRequests.set(requestId, {resolve, reject});
      this._port.postMessage({requestId, method, parameters});
    });
  }

  /**
   * @param {!MessageEvent<{requestId: string, result: ?, error: (!Error|undefined)}>} data
   * @return {?}
   */
  _onResponse({data: {requestId, result, error}}) {
    if (!this._pendingRequests.has(requestId)) {
      console.error(`No pending request ${requestId}`);
      return;
    }
    const {resolve, reject} = this._pendingRequests.get(requestId);
    this._pendingRequests.delete(requestId);
    if (error) {
      reject(new Error(error.message));
    } else {
      resolve(result);
    }
  }

  /**
   * @override
   * @param {!SDK.Script.Script} script
   * @return {boolean} True if this plugin should handle this script
   */
  handleScript(script) {
    const language = script.scriptLanguage();
    return !!language && !!script.debugSymbols && language === this._supportedScriptTypes.language &&
        this._supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
  }

  /** Notify the plugin about a new script
   * @override
   * @param {string} rawModuleId
   * @param {string} symbolsURL - URL of a file providing the debug symbols for this module
   * @param {!Bindings.DebuggerLanguagePlugins.RawModule} rawModule
   * @return {!Promise<!Array<string>>} - An array of URLs for the source files for the raw module
  */
  addRawModule(rawModuleId, symbolsURL, rawModule) {
    return /** @type {!Promise<!Array<string>>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.AddRawModule, {rawModuleId, symbolsURL, rawModule}));
  }

  /**
   * Notifies the plugin that a script is removed.
   * @override
   * @param {string} rawModuleId
   * @return {!Promise<undefined>}
   */
  removeRawModule(rawModuleId) {
    return /** @type {!Promise<undefined>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.RemoveRawModule, {rawModuleId}));
  }

  /** Find locations in raw modules from a location in a source file
   * @override
   * @param {!Bindings.DebuggerLanguagePlugins.SourceLocation} sourceLocation
   * @return {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.RawLocationRange>>}
  */
  sourceLocationToRawLocation(sourceLocation) {
    return /** @type {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.RawLocationRange>>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.SourceLocationToRawLocation, {sourceLocation}));
  }

  /** Find locations in source files from a location in a raw module
   * @override
   * @param {!Bindings.DebuggerLanguagePlugins.RawLocation} rawLocation
   * @return {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.SourceLocation>>}
  */
  rawLocationToSourceLocation(rawLocation) {
    return /** @type {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.SourceLocation>>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.RawLocationToSourceLocation, {rawLocation}));
  }

  /** List all variables in lexical scope at a given location in a raw module
   * @override
   * @param {!Bindings.DebuggerLanguagePlugins.RawLocation} rawLocation
   * @return {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.Variable>>}
  */
  listVariablesInScope(rawLocation) {
    return /** @type {!Promise<!Array<!Bindings.DebuggerLanguagePlugins.Variable>>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.ListVariablesInScope, {rawLocation}));
  }

  /** Evaluate the content of a variable in a given lexical scope
   * @override
   * @param {string} name
   * @param {!Bindings.DebuggerLanguagePlugins.RawLocation} location
   * @return {!Promise<?Bindings.DebuggerLanguagePlugins.EvaluatorModule>}
  */
  evaluateVariable(name, location) {
    return /** @type {!Promise<?Bindings.DebuggerLanguagePlugins.EvaluatorModule>}*/ (
        this._sendRequest(LanguageExtensionPluginCommands.EvaluateVariable, {name, location}));
  }
  /** List all variables in lexical scope at a given location in a raw module
   * @override
   * @param {!Bindings.DebuggerLanguagePlugins.RawLocation} rawLocation
   * @return {!Promise<?{frames: !Array<!Bindings.DebuggerLanguagePlugins.FunctionInfo>}>}
  */
  getFunctionInfo(rawLocation) {
    return /** @type {!Promise<?{frames: !Array<!Bindings.DebuggerLanguagePlugins.FunctionInfo>}>} */ (
        this._sendRequest(LanguageExtensionPluginCommands.GetFunctionInfo, {rawLocation}));
  }

  /**
   * @override
   */
  dispose() {
  }
}
