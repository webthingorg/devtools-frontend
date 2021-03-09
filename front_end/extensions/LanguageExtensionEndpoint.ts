// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Bindings from '../bindings/bindings.js';  // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';                 // eslint-disable-line no-unused-vars

export class LanguageExtensionEndpoint extends Bindings.DebuggerLanguagePlugins.DebuggerLanguagePlugin {
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _supportedScriptTypes: {language: string, symbol_types: string[]};
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _port: MessagePort;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _nextRequestId: number;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _pendingRequests: Map<number, {resolve: (value: unknown) => void, reject: (value: unknown) => void}>;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _events: {[key: string]: string};
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _commands: {[key: string]: string};
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(name: string, supportedScriptTypes: {language: string, symbol_types: string[]}, port: MessagePort) {
    super(name);
    // @ts-expect-error TODO(crbug.com/1011811): Fix after extensionAPI is migrated.
    this._commands = Extensions.extensionAPI.LanguageExtensionPluginCommands;
    // @ts-expect-error TODO(crbug.com/1011811): Fix after extensionAPI is migrated.
    this._events = Extensions.extensionAPI.LanguageExtensionPluginEvents;
    this._supportedScriptTypes = supportedScriptTypes;
    this._port = port;
    this._port.onmessage = this._onResponse.bind(this);
    this._nextRequestId = 0;
    this._pendingRequests = new Map();
  }

  _sendRequest<ReturnT>(method: string, parameters: unknown): Promise<ReturnT> {
    return new Promise((resolve, reject) => {
      const requestId = this._nextRequestId++;
      this._pendingRequests.set(requestId, {resolve: (resolve as (value: unknown) => void), reject});
      this._port.postMessage({requestId, method, parameters});
    });
  }

  _onResponse({data}: MessageEvent<{requestId: number, result: unknown, error?: Error}|{event: string}>): void {
    if ('event' in data) {
      const {event} = data;
      switch (event) {
        case this._events.UnregisteredLanguageExtensionPlugin: {
          for (const {reject} of this._pendingRequests.values()) {
            reject(new Error('Language extension endpoint disconnected'));
          }
          this._pendingRequests.clear();
          this._port.close();
          const {pluginManager} = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
          if (pluginManager) {
            pluginManager.removePlugin(this);
          }
          break;
        }
      }
      return;
    }
    const {requestId, result, error} = data;
    const callbacks = this._pendingRequests.get(requestId);
    if (!callbacks) {
      console.error(`No pending request ${requestId}`);
      return;
    }
    const {resolve, reject} = callbacks;
    this._pendingRequests.delete(requestId);
    if (error) {
      reject(new Error(error.message));
    } else {
      resolve(result);
    }
  }

  handleScript(script: SDK.Script.Script): boolean {
    const language = script.scriptLanguage();
    return language !== null && script.debugSymbols !== null && language === this._supportedScriptTypes.language &&
        this._supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
  }

  addRawModule(rawModuleId: string, symbolsURL: string, rawModule: Bindings.DebuggerLanguagePlugins.RawModule):
      Promise<string[]> {
    return this._sendRequest<string[]>(this._commands.AddRawModule, {rawModuleId, symbolsURL, rawModule});
  }

  removeRawModule(rawModuleId: string): Promise<void> {
    return this._sendRequest<void>(this._commands.RemoveRawModule, {rawModuleId});
  }

  sourceLocationToRawLocation(sourceLocation: Bindings.DebuggerLanguagePlugins.SourceLocation):
      Promise<Bindings.DebuggerLanguagePlugins.RawLocationRange[]> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.RawLocationRange[]>(
        this._commands.SourceLocationToRawLocation, {sourceLocation});
  }

  rawLocationToSourceLocation(rawLocation: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<Bindings.DebuggerLanguagePlugins.SourceLocation[]> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.SourceLocation[]>(
        this._commands.RawLocationToSourceLocation, {rawLocation});
  }

  getScopeInfo(type: string): Promise<Bindings.DebuggerLanguagePlugins.ScopeInfo> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.ScopeInfo>(this._commands.GetScopeInfo, {type});
  }

  listVariablesInScope(rawLocation: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<Bindings.DebuggerLanguagePlugins.Variable[]> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.Variable[]>(
        this._commands.ListVariablesInScope, {rawLocation});
  }

  getFunctionInfo(rawLocation: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<{frames: Bindings.DebuggerLanguagePlugins.FunctionInfo[]}> {
    return this._sendRequest<{frames: Bindings.DebuggerLanguagePlugins.FunctionInfo[]}>(
        this._commands.GetFunctionInfo, {rawLocation});
  }

  getInlinedFunctionRanges(rawLocation: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<Bindings.DebuggerLanguagePlugins.RawLocationRange[]> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.RawLocationRange[]>(
        this._commands.GetInlinedFunctionRanges, {rawLocation});
  }

  getInlinedCalleesRanges(rawLocation: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<Bindings.DebuggerLanguagePlugins.RawLocationRange[]> {
    return this._sendRequest<Bindings.DebuggerLanguagePlugins.RawLocationRange[]>(
        this._commands.GetInlinedCalleesRanges, {rawLocation});
  }

  getTypeInfo(expression: string, context: Bindings.DebuggerLanguagePlugins.RawLocation):
      Promise<{typeInfos: Bindings.DebuggerLanguagePlugins.TypeInfo[], base: Bindings.DebuggerLanguagePlugins.EvalBase}|
              undefined> {
    return this._sendRequest<
        {typeInfos: Bindings.DebuggerLanguagePlugins.TypeInfo[], base: Bindings.DebuggerLanguagePlugins.EvalBase}|
        undefined>(this._commands.GetTypeInfo, {expression, context});
  }

  getFormatter(
      expressionOrField: string|
      {base: Bindings.DebuggerLanguagePlugins.EvalBase, field: Bindings.DebuggerLanguagePlugins.FieldInfo[]},
      context: Bindings.DebuggerLanguagePlugins.RawLocation): Promise<{js: string}> {
    return (this._sendRequest<{js: string}>(this._commands.GetFormatter, {expressionOrField, context}));
  }

  getInspectableAddress(field: {
    base: Bindings.DebuggerLanguagePlugins.EvalBase,
    field: Bindings.DebuggerLanguagePlugins.FieldInfo[],
  }): Promise<{js: string}> {
    return (this._sendRequest<{js: string}>(this._commands.GetInspectableAddress, {field}));
  }

  async getMappedLines(rawModuleId: string, sourceFileURL: string): Promise<number[]|undefined> {
    return (this._sendRequest<number[]|undefined>(this._commands.GetMappedLines, {rawModuleId, sourceFileURL}));
  }
}
