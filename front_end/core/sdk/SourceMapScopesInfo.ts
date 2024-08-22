// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';

import {type CallFrame, type LocationRange, type Scope, type ScopeChainEntry} from './DebuggerModel.js';
import {type GetPropertiesResult, type RemoteObject, RemoteObjectImpl, RemoteObjectProperty} from './RemoteObject.js';
import {type SourceMap, type SourceMapV3Object} from './SourceMap.js';
import {
  decodeGeneratedRanges,
  decodeOriginalScopes,
  type GeneratedRange,
  type OriginalPosition,
  type OriginalScope,
} from './SourceMapScopes.js';

export class SourceMapScopesInfo {
  /* eslint-disable-next-line no-unused-private-class-members */
  readonly #sourceMap: SourceMap;
  /* eslint-disable-next-line no-unused-private-class-members */
  readonly #originalScopes: OriginalScope[];
  readonly #generatedRanges: GeneratedRange[];

  constructor(sourceMap: SourceMap, originalScopes: OriginalScope[], generatedRanges: GeneratedRange[]) {
    this.#sourceMap = sourceMap;
    this.#originalScopes = originalScopes;
    this.#generatedRanges = generatedRanges;
  }

  static parseFromMap(
      sourceMap: SourceMap,
      sourceMapJson: Pick<SourceMapV3Object, 'names'|'originalScopes'|'generatedRanges'>): SourceMapScopesInfo {
    if (!sourceMapJson.originalScopes || !sourceMapJson.generatedRanges) {
      throw new Error('Cant create SourceMapScopesInfo without encoded scopes');
    }
    const scopeTrees = decodeOriginalScopes(sourceMapJson.originalScopes, sourceMapJson.names ?? []);
    const originalScopes = scopeTrees.map(tree => tree.root);
    const generatedRanges = decodeGeneratedRanges(sourceMapJson.generatedRanges, scopeTrees, sourceMapJson.names ?? []);
    return new SourceMapScopesInfo(sourceMap, originalScopes, generatedRanges);
  }

  /**
   * Given a generated position, returns the original name of the surrounding function as well as
   * all the original function names that got inlined into the surrounding generated function and their
   * respective callsites in the original code (ordered from inner to outer).
   *
   * @returns a list with inlined functions. Every entry in the list has a callsite in the orignal code,
   * except the last function (since the last function didn't get inlined).
   */
  findInlinedFunctions(generatedLine: number, generatedColumn: number): {name: string, callsite?: OriginalPosition}[] {
    const result: {name: string, callsite?: OriginalPosition}[] = [];
    const rangeChain = this.#findGeneratedRangeChain(generatedLine, generatedColumn);

    // Walk the generated ranges from the innermost containing range outwards as long as we don't
    // encounter a range that is a scope in the generated code and a function scope originally.
    for (let i = rangeChain.length - 1; i >= 0; --i) {
      const range = rangeChain[i];
      const originalScope = range.originalScope;

      // Record the name if the range corresponds to a function scope in the authored code. And it's either a scope in the
      // generated code as well or it has a callsite info (which indicates inlining).
      if (originalScope?.kind === 'function' && range.callsite) {
        result.push({name: originalScope.name ?? '', callsite: range.callsite});
      } else if (range.isScope) {
        break;
      }
    }

    return result;
  }

  /**
   * Given a generated position, this returns all the surrounding generated ranges from outer
   * to inner.
   */
  #findGeneratedRangeChain(line: number, column: number): GeneratedRange[] {
    const result: GeneratedRange[] = [];

    (function walkRanges(ranges: GeneratedRange[]) {
      for (const range of ranges) {
        if (!contains(range, line, column)) {
          continue;
        }
        result.push(range);
        walkRanges(range.children);
      }
    })(this.#generatedRanges);

    return result;
  }

  async resolveMappedScopeChain(callFrame: CallFrame): Promise<ScopeChainEntry[]|null> {
    const mappedPausedPosition = this.#sourceMap.findEntry(
        callFrame.location().lineNumber, callFrame.location().columnNumber, callFrame.location().inlineFrameIndex);
    if (!mappedPausedPosition) {
      return null;
    }

    const originalScopeChain = this.#findOriginalScopeChain(
        mappedPausedPosition.sourceIndex, mappedPausedPosition.sourceLineNumber,
        mappedPausedPosition.sourceColumnNumber);
    const rangeChain =
        this.#findGeneratedRangeChain(callFrame.location().lineNumber, callFrame.location().columnNumber);
    let seenFunctionScope = false;
    const result: SourceMapScopeChainEntry[] = [];
    for (let i = originalScopeChain.length - 1; i >= 0; --i) {
      // Walk the original scope chain outwards and try to find the corresponding generated range along the way.
      const originalScope = originalScopeChain[i];
      const range = rangeChain.findLast(r => r.originalScope === originalScope);
      const isFunctionScope = originalScope.kind === 'function';
      const isInnerMostFunction = isFunctionScope && !seenFunctionScope;
      const returnValue = isInnerMostFunction ? callFrame.returnValue() : null;
      result.push(
          new SourceMapScopeChainEntry(callFrame, originalScope, range, isInnerMostFunction, returnValue ?? undefined));
      seenFunctionScope ||= isFunctionScope;
    }

    // If we are paused on a return statement, we need to drop inner block scopes. This is because V8 only emits a
    // single return bytecode and "gotos" at the functions' end, where we are now paused.
    if (callFrame.returnValue() !== null) {
      while (result.length && result[0].type() !== Protocol.Debugger.ScopeType.Local) {
        result.shift();
      }
    }

    return result;
  }

  #findOriginalScopeChain(sourceIdx: number, line: number, column: number): OriginalScope[] {
    const result: OriginalScope[] = [];
    (function walkScope(scope: OriginalScope) {
      if (!contains(scope, line, column)) {
        return;
      }
      result.push(scope);
      for (const child of scope.children) {
        walkScope(child);
      }
    })(this.#originalScopes[sourceIdx]);
    return result;
  }

  hasOriginalScope(callFrame: CallFrame): boolean {
    const rangeChain =
        this.#findGeneratedRangeChain(callFrame.location().lineNumber, callFrame.location().columnNumber);
    const innerMostFunctionRange = rangeChain.findLast(range => range.isScope);
    return Boolean(innerMostFunctionRange?.originalScope);
  }

  findFunctionName(callFrame: CallFrame): string|null {
    const rangeChain =
        this.#findGeneratedRangeChain(callFrame.location().lineNumber, callFrame.location().columnNumber);
    let inlineRanges = callFrame.inlineFrameIndex;
    while (inlineRanges > 0) {
      const range = rangeChain.pop();
      if (range?.callsite) {
        inlineRanges--;
      }
    }

    const innerMostRangeWithOriginalFunctionScope =
        rangeChain.findLast(range => range.originalScope?.kind === 'function');
    return innerMostRangeWithOriginalFunctionScope?.originalScope?.name ?? null;
  }
}

function contains(range: Pick<GeneratedRange, 'start'|'end'>, line: number, column: number): boolean {
  if (range.start.line > line || (range.start.line === line && range.start.column > column)) {
    return false;
  }

  if (range.end.line < line || (range.end.line === line && range.end.column <= column)) {
    return false;
  }

  return true;
}

class SourceMapScopeChainEntry implements ScopeChainEntry {
  readonly #callFrame: CallFrame;
  readonly #scope: OriginalScope;
  readonly #range?: GeneratedRange;
  readonly #isInnerMostFunction: boolean;
  readonly #returnValue?: RemoteObject;

  readonly #debuggerScopeIdx: number;

  /**
   * @param isInnerMostFunction If `scope` is the innermost 'function' scope. Only used for labeling as we name the
   * scope of the paused function 'Local', while any other outer 'function' scope is named 'Closure'.
   */
  constructor(
      callFrame: CallFrame, scope: OriginalScope, range: GeneratedRange|undefined, isInnerMostFunction: boolean,
      returnValue: RemoteObject|undefined) {
    this.#callFrame = callFrame;
    this.#scope = scope;
    this.#range = range;
    this.#isInnerMostFunction = isInnerMostFunction;
    this.#returnValue = returnValue;
    this.#debuggerScopeIdx = SourceMapScopeChainEntry.#findDebuggerScopeIdx(callFrame, scope.kind, range);
  }

  extraProperties(): RemoteObjectProperty[] {
    if (this.#returnValue) {
      // TODO(crbug.com/): L10n.
      return [new RemoteObjectProperty(
          'Return value', this.#returnValue, undefined, undefined, undefined, undefined, undefined,
          /* synthetic */ true)];
    }
    return [];
  }

  callFrame(): CallFrame {
    return this.#callFrame;
  }

  type(): string {
    switch (this.#scope.kind) {
      case 'global':
        return Protocol.Debugger.ScopeType.Global;
      case 'function':
        return this.#isInnerMostFunction ? Protocol.Debugger.ScopeType.Local : Protocol.Debugger.ScopeType.Closure;
      case 'block':
        return Protocol.Debugger.ScopeType.Block;
    }
    return this.#scope.kind;
  }

  typeName(): string {
    // TODO(crbug.com/): L10n.
    switch (this.#scope.kind) {
      case 'global':
        return 'Global';
      case 'function':
        return this.#isInnerMostFunction ? 'Local' : 'Closure';
      case 'block':
        return 'Block';
    }
    return this.#scope.kind;
  }

  name(): string|undefined {
    return this.#scope.name;
  }

  range(): LocationRange|null {
    return null;
  }

  object(): RemoteObject {
    return new SourceMapScopeRemoteObject(this.#callFrame, this.#scope, this.#range, this.#debuggerScopeIdx);
  }

  description(): string {
    return '';
  }

  icon(): string|undefined {
    return undefined;
  }

  /**
   * Finds the closest matching debugger scope to the provided generated range. We'll evaluate the
   * binding expressions in this debugger scope.
   */
  static #findDebuggerScopeIdx(callFrame: CallFrame, originalScopeKind: string, range?: GeneratedRange): number {
    if (!range) {
      return -1;
    }

    // V8 doesn't report a scope start/end for global, script and module scope. So we don't match based on location
    // but match by scope type for global.
    if (originalScopeKind === 'global') {
      return callFrame.scopeChain().findLastIndex(scope => scope.type() === Protocol.Debugger.ScopeType.Global);
    }
    if (originalScopeKind === 'module' || originalScopeKind === 'script') {
      return callFrame.scopeChain().findLastIndex(
          scope => scope.type() === Protocol.Debugger.ScopeType.Module ||
              scope.type() === Protocol.Debugger.ScopeType.Script);
    }
    return callFrame.scopeChain().findIndex(scope => SourceMapScopeChainEntry.#contains(scope, range));
  }

  static #contains(scope: Scope, range: GeneratedRange): boolean {
    const start = scope.range()?.start;
    const end = scope.range()?.end;
    if (!start || !end) {
      return false;
    }

    if (start.lineNumber > range.start.line ||
        (start.lineNumber === range.start.line && start.columnNumber > range.start.column)) {
      return false;
    }

    if (end.lineNumber < range.end.line || (end.lineNumber === range.end.line && end.columnNumber < range.end.column)) {
      return false;
    }

    return true;
  }
}

function unavailableProperty(name: string): RemoteObjectProperty {
  return new RemoteObjectProperty(
      name, null, /* enumerable=*/ false, /* writeable=*/ false, /* isOwn=*/ true, /* wasThrown=*/ false);
}

class SourceMapScopeRemoteObject extends RemoteObjectImpl {
  readonly #callFrame: CallFrame;
  readonly #scope: OriginalScope;
  readonly #range?: GeneratedRange;
  readonly #debuggerScopeIdx: number;

  constructor(callFrame: CallFrame, scope: OriginalScope, range: GeneratedRange|undefined, debuggerScopeIdx: number) {
    super(callFrame.debuggerModel.runtimeModel(), undefined, 'object', undefined, null);
    this.#callFrame = callFrame;
    this.#scope = scope;
    this.#range = range;
    this.#debuggerScopeIdx = debuggerScopeIdx;
  }

  override async doGetProperties(ownProperties: boolean, accessorPropertiesOnly: boolean, _generatePreview: boolean):
      Promise<GetPropertiesResult> {
    if (accessorPropertiesOnly) {
      return {properties: [], internalProperties: []};
    }

    const properties: RemoteObjectProperty[] = [];
    for (const [index, variable] of this.#scope.variables.entries()) {
      if (!this.#range || this.#debuggerScopeIdx < 0) {
        properties.push(unavailableProperty(variable));
        continue;
      }

      const expression = this.#findExpression(index);
      if (expression !== null) {
        const result = await this.#callFrame.evaluate({expression, throwOnSideEffect: true, generatePreview: true});
        if ('error' in result || result.exceptionDetails) {
          properties.push(unavailableProperty(variable));
        } else {
          properties.push(new RemoteObjectProperty(
              variable, result.object, /* enumerable=*/ false, /* writable=*/ false, /* isOwn=*/ true,
              /* wasThrown=*/ false));
        }
      } else {
        properties.push(unavailableProperty(variable));
      }
    }

    return {properties, internalProperties: []};
  }

  /** @returns null if the variable is unavailabe at the current paused location */
  #findExpression(index: number): string|null {
    if (!this.#range) {
      return null;
    }

    const expressionOrSubRanges = this.#range.values[index];
    if (typeof expressionOrSubRanges === 'string') {
      return expressionOrSubRanges;
    }
    if (expressionOrSubRanges === undefined) {
      return null;
    }

    const pausedPosition = this.#callFrame.location();
    for (const range of expressionOrSubRanges) {
      if (contains({start: range.from, end: range.to}, pausedPosition.lineNumber, pausedPosition.columnNumber)) {
        return range.value ?? null;
      }
    }
    return null;
  }
}
