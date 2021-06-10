// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface RawModule {
  url: string;
  code?: ArrayBuffer;
}

export interface RawLocationRange {
  rawModuleId: string;
  startOffset: number;
  endOffset: number;
}

export interface RawLocation {
  rawModuleId: string;
  codeOffset: number;
  inlineFrameIndex: number;
}

export interface SourceLocation {
  rawModuleId: string;
  sourceFileURL: string;
  lineNumber: number;
  columnNumber: number;
}

export interface Variable {
  scope: string;
  name: string;
  type: string;
  nestedName?: string[];
}

export interface ScopeInfo {
  type: string;
  typeName: string;
  icon?: string;
}

export interface FunctionInfo {
  name: string;
}

export interface FieldInfo {
  name?: string;
  offset: number;
  typeId: unknown;
}

export interface TypeInfo {
  typeNames: string[];
  typeId: unknown;
  members: FieldInfo[];
  alignment: number;
  arraySize: number;
  size: number;
  canExpand: boolean;
  hasValue: boolean;
}

export interface EvalBase {
  rootType: TypeInfo;
  payload: unknown;
}

export interface LanguageExtensionPluginAPI {
  /**
   * A new raw module has been loaded. If the raw wasm module references an external debug info module, its URL will be
   * passed as symbolsURL.
   */
  addRawModule(rawModuleId: string, symbolsURL: string|undefined, rawModule: RawModule): Promise<string[]>;

  /**
   * Find locations in raw modules from a location in a source file.
   */
  sourceLocationToRawLocation(sourceLocation: SourceLocation): Promise<RawLocationRange[]>;

  /**
   * Find locations in source files from a location in a raw module.
   */
  rawLocationToSourceLocation(rawLocation: RawLocation): Promise<SourceLocation[]>;

  /**
   * Return detailed information about a scope.
    */
  getScopeInfo(type: string): Promise<ScopeInfo>;

  /**
   * List all variables in lexical scope at a given location in a raw module.
   */
  listVariablesInScope(rawLocation: RawLocation): Promise<Variable[]>;

  /**
   * Notifies the plugin that a script is removed.
   */
  removeRawModule(rawModuleId: string): Promise<void>;

  /**
   * Return type information for an expression. The result describes the type (and recursively its member types) of the
   * result of the expression if it were evaluated in the given context.
   */
  getTypeInfo(expression: string, context: RawLocation): Promise<{
    typeInfos: Array<TypeInfo>,
    base: EvalBase,
  }|null>;

  /**
   * Returns a piece of JavaScript code that, if evaluated, produces a representation of the given expression or field.
   */
  getFormatter(
      expressionOrField: string|{
        base: EvalBase,
        field: Array<FieldInfo>,
      },
      context: RawLocation): Promise<{
    js: string,
  }|null>;

  /**
   * Returns a piece of JavaScript code that, if evaluated, produces the address of the given field in the wasm memory.
   */
  getInspectableAddress(field: {
    base: EvalBase,
    field: Array<FieldInfo>,
  }): Promise<{
    js: string,
  }>;

  /**
   * Find locations in source files from a location in a raw module
   */
  getFunctionInfo(rawLocation: RawLocation): Promise<{
    frames: Array<FunctionInfo>,
  }>;

  /**
   * Find locations in raw modules corresponding to the inline function
   * that rawLocation is in. Used for stepping out of an inline function.
   */
  getInlinedFunctionRanges(rawLocation: RawLocation): Promise<RawLocationRange[]>;

  /**
   * Find locations in raw modules corresponding to inline functions
   * called by the function or inline frame that rawLocation is in.
   * Used for stepping over inline functions.
   */
  getInlinedCalleesRanges(rawLocation: RawLocation): Promise<RawLocationRange[]>;

  /**
   * Retrieve a list of line numbers in a file for which line-to-raw-location mappings exist.
   */
  getMappedLines(rawModuleId: string, sourceFileURL: string): Promise<number[]|undefined>;
}
