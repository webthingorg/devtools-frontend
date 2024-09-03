// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Protocol from '../../generated/protocol.js';

import {type CallFrame, type ScopeChainEntry} from './DebuggerModel.js';
import {type SourceMap, type SourceMapV3Object} from './SourceMap.js';
import {SourceMapScopeChainEntry} from './SourceMapScopeChainEntry.js';
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
      if (originalScope?.kind === 'function' && (range.isScope || range.callsite)) {
        result.push({name: originalScope.name ?? '', callsite: range.callsite});

        if (range.isScope) {
          break;
        }
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

  /**
   * Constructs a scope chain based on the CallFrame's paused position.
   *
   * There are 2 ways how we can construct a original scope chain based on a
   * V8 paused position:
   *
   *   1) We find the inner-most generated range that contains the V8 paused position.
   *      We'll walk the generated range chain outwards until we find a range that also
   *      represents an original scope. That original scope is than the inner-most
   *      original scope and we walk that original scope's parent chain outwards to
   *      construct the original scope chain.
   *
   *   2) We use the source map's mappings to map the V8 paused position back to an
   *      original position. With the original paused position we can then search for the
   *      inner-most original scope. The byproduct of that search is the result, the original
   *      scope chain.
   *
   * 1) and 2) can produce different results when the mapped paused position lies in
   * a different original scope than the inner-most generated range's original scope
   * (e.g. minifiers that constant fold or otherwise aggressively inline expressions).
   *
   * We use approach 2). This is because we have to stay consistent with the rest of the
   * DevTools UI. Otherwise the obtained scope chain would not fit with the paused
   * position in the editor view.
   */
  resolveMappedScopeChain(callFrame: CallFrame): ScopeChainEntry[]|null {
    const mappedPausedPosition = this.#sourceMap.findEntry(
        callFrame.location().lineNumber, callFrame.location().columnNumber, callFrame.location().inlineFrameIndex);
    if (mappedPausedPosition?.sourceIndex === undefined) {
      return null;
    }

    const originalScopeChain = this.#findOriginalScopeChain(
        mappedPausedPosition.sourceIndex, mappedPausedPosition.sourceLineNumber,
        mappedPausedPosition.sourceColumnNumber);

    // For the generated range chain we have to use the generated paused position as
    // reported by V8: These are the only ranges for which we can resolve variable values.
    // For original scopes that don't have any generated range in the generated range chain,
    // we have to show that scope's variables as unavailable. This can happen when approach
    // 1) and 2) produce different results.
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
}

export function contains(range: Pick<GeneratedRange, 'start'|'end'>, line: number, column: number): boolean {
  if (range.start.line > line || (range.start.line === line && range.start.column > column)) {
    return false;
  }

  if (range.end.line < line || (range.end.line === line && range.end.column <= column)) {
    return false;
  }

  return true;
}
