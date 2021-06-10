// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';    // eslint-disable-line no-unused-vars
import * as Bindings from '../bindings/bindings.js';  // eslint-disable-line no-unused-vars

export interface SupportedScriptTypesSpec {
  language: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  symbol_types: string[];
}

export class LanguageExtensionEndpoint implements Bindings.DebuggerLanguagePlugins.DebuggerLanguagePlugin {
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private commands: any;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private events: any;
  private supportedScriptTypes: SupportedScriptTypesSpec;
  private port: MessagePort;
  private nextRequestId: number;
  private pendingRequests: Map<number, {resolve: (value: unknown) => void, reject: (value: unknown) => void}>;
  name: string;
  constructor(name: string, supportedScriptTypes: SupportedScriptTypesSpec, port: MessagePort) {
    this.name = name;
    // @ts-expect-error TODO(crbug.com/1011811): Fix after extensionAPI is migrated.
    this.commands = Extensions.extensionAPI.LanguageExtensionPluginCommands;
    // @ts-expect-error TODO(crbug.com/1011811): Fix after extensionAPI is migrated.
    this.events = Extensions.extensionAPI.LanguageExtensionPluginEvents;
    this.supportedScriptTypes = supportedScriptTypes;
    this.port = port;
    this.port.onmessage = this.onResponse.bind(this);
    this.nextRequestId = 0;
    this.pendingRequests = new Map();
  }

  sendRequest(method: string, parameters: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const requestId = this.nextRequestId++;
      this.pendingRequests.set(requestId, {resolve, reject});
      this.port.postMessage({requestId, method, parameters});
    });
  }

  onResponse({data}: MessageEvent<{
    requestId: number,
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    error: Error|null,
  }|{
    event: string,
  }>): void {
    if ('event' in data) {
      const {event} = data;
      switch (event) {
        case this.events.UnregisteredLanguageExtensionPlugin: {
          for (const {reject} of this.pendingRequests.values()) {
            reject(new Error('Language extension endpoint disconnected'));
          }
          this.pendingRequests.clear();
          this.port.close();
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
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      console.error(`No pending request ${requestId}`);
      return;
    }
    const {resolve, reject} = pendingRequest;
    this.pendingRequests.delete(requestId);
    if (error) {
      reject(new Error(error.message));
    } else {
      resolve(result);
    }
  }

  handleScript(script: SDK.Script.Script): boolean {
    const language = script.scriptLanguage();
    return language !== null && script.debugSymbols !== null && language === this.supportedScriptTypes.language &&
        this.supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
  }

  addRawModule(rawModuleId: string, symbolsURL: string, rawModule: SDK.LanguageExtensionPluginAPI.RawModule):
      Promise<string[]> {
    return this.sendRequest(this.commands.AddRawModule, {rawModuleId, symbolsURL, rawModule}) as Promise<string[]>;
  }

  removeRawModule(rawModuleId: string): Promise<void> {
    return this.sendRequest(this.commands.RemoveRawModule, {rawModuleId}) as Promise<void>;
  }

  sourceLocationToRawLocation(sourceLocation: SDK.LanguageExtensionPluginAPI.SourceLocation):
      Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]> {
    return this.sendRequest(this.commands.SourceLocationToRawLocation, {sourceLocation}) as
        Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]>;
  }

  rawLocationToSourceLocation(rawLocation: SDK.LanguageExtensionPluginAPI.RawLocation):
      Promise<SDK.LanguageExtensionPluginAPI.SourceLocation[]> {
    return this.sendRequest(this.commands.RawLocationToSourceLocation, {rawLocation}) as
        Promise<SDK.LanguageExtensionPluginAPI.SourceLocation[]>;
  }

  getScopeInfo(type: string): Promise<SDK.LanguageExtensionPluginAPI.ScopeInfo> {
    return this.sendRequest(this.commands.GetScopeInfo, {type}) as Promise<SDK.LanguageExtensionPluginAPI.ScopeInfo>;
  }

  listVariablesInScope(rawLocation: SDK.LanguageExtensionPluginAPI.RawLocation):
      Promise<SDK.LanguageExtensionPluginAPI.Variable[]> {
    return this.sendRequest(this.commands.ListVariablesInScope, {rawLocation}) as
        Promise<SDK.LanguageExtensionPluginAPI.Variable[]>;
  }

  getFunctionInfo(rawLocation: SDK.LanguageExtensionPluginAPI.RawLocation): Promise<{
    frames: Array<SDK.LanguageExtensionPluginAPI.FunctionInfo>,
  }> {
    return this.sendRequest(this.commands.GetFunctionInfo, {rawLocation}) as Promise<{
             frames: Array<SDK.LanguageExtensionPluginAPI.FunctionInfo>,
           }>;
  }

  getInlinedFunctionRanges(rawLocation: SDK.LanguageExtensionPluginAPI.RawLocation):
      Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]> {
    return this.sendRequest(this.commands.GetInlinedFunctionRanges, {rawLocation}) as
        Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]>;
  }

  getInlinedCalleesRanges(rawLocation: SDK.LanguageExtensionPluginAPI.RawLocation):
      Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]> {
    return this.sendRequest(this.commands.GetInlinedCalleesRanges, {rawLocation}) as
        Promise<SDK.LanguageExtensionPluginAPI.RawLocationRange[]>;
  }

  getTypeInfo(expression: string, context: SDK.LanguageExtensionPluginAPI.RawLocation): Promise<{
    typeInfos: Array<SDK.LanguageExtensionPluginAPI.TypeInfo>,
    base: SDK.LanguageExtensionPluginAPI.EvalBase,
  }|null> {
    return this.sendRequest(this.commands.GetTypeInfo, {expression, context}) as Promise<{
             typeInfos: Array<SDK.LanguageExtensionPluginAPI.TypeInfo>,
             base: SDK.LanguageExtensionPluginAPI.EvalBase,
           }|null>;
  }

  getFormatter(
      expressionOrField: string|{
        base: SDK.LanguageExtensionPluginAPI.EvalBase,
        field: Array<SDK.LanguageExtensionPluginAPI.FieldInfo>,
      },
      context: SDK.LanguageExtensionPluginAPI.RawLocation): Promise<{
    js: string,
  }> {
    return this.sendRequest(this.commands.GetFormatter, {expressionOrField, context}) as Promise<{
             js: string,
           }>;
  }

  getInspectableAddress(field: {
    base: SDK.LanguageExtensionPluginAPI.EvalBase,
    field: Array<SDK.LanguageExtensionPluginAPI.FieldInfo>,
  }): Promise<{
    js: string,
  }> {
    return this.sendRequest(this.commands.GetInspectableAddress, {field}) as Promise<{
             js: string,
           }>;
  }

  async getMappedLines(rawModuleId: string, sourceFileURL: string): Promise<number[]|undefined> {
    return this.sendRequest(this.commands.GetMappedLines, {rawModuleId, sourceFileURL}) as Promise<number[]|undefined>;
  }
}
