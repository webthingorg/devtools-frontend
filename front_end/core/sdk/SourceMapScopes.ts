// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This file implements the current state of the "Scopes" proposal
 * for the source map spec.
 *
 * See https://github.com/tc39/source-map-rfc/blob/main/proposals/scopes.md.
 *
 * The proposal is still being worked on so we expect the implementation details
 * in this file to change frequently.
 */

import {TokenIterator} from './SourceMap.js';

/**
 * A scope in the authored source.
 */
export interface OriginalScope {
  start: Position;
  end: Position;
  kind: ScopeKind;
  name?: string;
  variables: string[];
  children: OriginalScope[];
}

/**
 * A range (can be a scope) in the generated JavaScript.
 */
export interface GeneratedRange {
  start: Position;
  end: Position;
  originalScope?: OriginalScope;

  /**
   * If this `GeneratedRange` is the result of inlining `originalScope`, then `callsite`
   * refers to where `originalScope` was called in the original ("authored") code.
   */
  callsite?: OriginalPosition;

  /**
   * Expressions that compute the values of the variables of this OriginalScope. The length
   * of `values` must match the length of `originalScope.variables`.
   *
   * For each variable this can either be a single expression (valid for the full `GeneratedRange`),
   * or an array of `BindingRange`s, e.g. if computing the value requires different expressions
   * throughout the range or if the variable is only available in parts of the `GeneratedRange`.
   *
   * `undefined` denotes that the value of a variable is unavailble in the whole range.
   * This can happen e.g. if the variable was optimized out and can't be recomputed.
   */
  values: (string|undefined|BindingRange[])[];
  children: GeneratedRange[];
}

export type ScopeKind = 'global'|'class'|'function'|'block';

export interface BindingRange {
  value?: string;
  from: Position;
  to: Position;
}

export interface Position {
  line: number;
  column: number;
}

export interface OriginalPosition extends Position {
  sourceIndex: number;
}

interface OriginalScopeTree {
  readonly root: OriginalScope;
  readonly scopeForItemIndex: Map<number, OriginalScope>;
}

export function decodeOriginalScopes(encodedOriginalScopes: string[], names: string[]): OriginalScopeTree[] {
  return encodedOriginalScopes.map(scope => decodeOriginalScope(scope, names));
}

function decodeOriginalScope(encodedOriginalScope: string, names: string[]): OriginalScopeTree {
  const scopeForItemIndex = new Map<number, OriginalScope>();
  const scopeStack: OriginalScope[] = [];
  let line = 0;

  for (const [index, item] of decodeOriginalScopeItems(encodedOriginalScope)) {
    line += item.line;
    const {column} = item;
    if (isStart(item)) {
      const kind = decodeKind(item.kind);
      const name = resolveName(item.name, names);
      const variables = item.variables.map(idx => names[idx]);
      const scope: OriginalScope = {start: {line, column}, end: {line, column}, kind, name, variables, children: []};
      scopeStack.push(scope);
      scopeForItemIndex.set(index, scope);
    } else {
      const scope = scopeStack.pop();
      if (!scope) {
        throw new Error('Scope items not nested properly: encountered "end" item without "start" item');
      }
      scope.end = {line, column};

      if (scopeStack.length === 0) {
        // We are done. There might be more top-level scopes but we only allow one.
        return {root: scope, scopeForItemIndex};
      }
      scopeStack[scopeStack.length - 1].children.push(scope);
    }
  }
  throw new Error('Malformed original scope encoding');
}

interface EncodedOriginalScopeStart {
  line: number;
  column: number;
  kind: number;
  flags: number;
  name?: number;
  variables: number[];
}

interface EncodedOriginalScopeEnd {
  line: number;
  column: number;
}

function isStart(item: EncodedOriginalScopeStart|EncodedOriginalScopeEnd): item is EncodedOriginalScopeStart {
  return 'kind' in item;
}

function*
    decodeOriginalScopeItems(encodedOriginalScope: string):
        Generator<[number, EncodedOriginalScopeStart | EncodedOriginalScopeEnd]> {
  const iter = new TokenIterator(encodedOriginalScope);
  let prevColumn = 0;
  let itemCount = 0;

  while (iter.hasNext()) {
    if (iter.peek() === ',') {
      iter.next();  // Consume ','.
    }

    const [line, column] = [iter.nextVLQ(), iter.nextVLQ()];
    if (line === 0 && column < prevColumn) {
      throw new Error('Malformed original scope encoding: start/end items must be ordered w.r.t. source positions');
    }
    prevColumn = column;

    if (!iter.hasNext() || iter.peek() === ',') {
      yield [itemCount++, {line, column}];
      continue;
    }

    const startItem: EncodedOriginalScopeStart = {
      line,
      column,
      kind: iter.nextVLQ(),
      flags: iter.nextVLQ(),
      variables: [],
    };

    if (startItem.flags & 0x1) {
      startItem.name = iter.nextVLQ();
    }

    if (startItem.flags & 0x2) {
      while (iter.hasNext() && iter.peek() !== ',') {
        startItem.variables.push(iter.nextVLQ());
      }
    }

    yield [itemCount++, startItem];
  }
}

export function decodeGeneratedRanges(
    encodedGeneratedRange: string, originalScopeTrees: OriginalScopeTree[], _names: string[]): GeneratedRange {
  const rangeStack: GeneratedRange[] = [];
  const rangeToStartItem = new Map<GeneratedRange, EncodedGeneratedRangeStart>();

  for (const item of decodeGeneratedRangeItems(encodedGeneratedRange)) {
    if (isRangeStart(item)) {
      // TODO(crbug.com/40277685): Decode callsite and bindings.

      const range: GeneratedRange = {
        start: {line: item.line, column: item.column},
        end: {line: item.line, column: item.column},
        values: [],
        children: [],
      };

      if (item.definition) {
        const {scopeIdx, sourceIdx} = item.definition;
        if (!originalScopeTrees[sourceIdx]) {
          throw new Error('Invalid source index!');
        }
        const originalScope = originalScopeTrees[sourceIdx].scopeForItemIndex.get(scopeIdx);
        if (!originalScope) {
          throw new Error('Invalid original scope index!');
        }
        range.originalScope = originalScope;
      }

      rangeToStartItem.set(range, item);
      rangeStack.push(range);
    } else {
      const range = rangeStack.pop();
      if (!range) {
        throw new Error('Range items not nested properly: encountered "end" item without "start" item');
      }
      range.end = {line: item.line, column: item.column};

      if (rangeStack.length === 0) {
        // We are done. There might be more top-level scopes but we only allow one.
        return range;
      }
      rangeStack[rangeStack.length - 1].children.push(range);
    }
  }
  throw new Error('Malformed generated range encoding');
}

interface EncodedGeneratedRangeStart {
  line: number;
  column: number;
  flags: number;
  definition?: {
    sourceIdx: number,
    scopeIdx: number,
  };
  // TODO(crbug.com/40277685): Add the rest.
}

interface EncodedGeneratedRangeEnd {
  line: number;
  column: number;
}

export const enum EncodedGeneratedRangeFlag {
  HasDefinition = 0x1,
}

function isRangeStart(item: EncodedGeneratedRangeStart|EncodedGeneratedRangeEnd): item is EncodedGeneratedRangeStart {
  return 'flags' in item;
}

function*
    decodeGeneratedRangeItems(encodedGeneratedRange: string):
        Generator<EncodedGeneratedRangeStart|EncodedGeneratedRangeEnd> {
  const iter = new TokenIterator(encodedGeneratedRange);
  let line = 0;

  // The state are the fields of the last produced item, tracked because many
  // are relative to the preceeding item.
  const state = {
    line: 0,
    column: 0,
    defSourceIdx: 0,
    defScopeIdx: 0,
  };

  while (iter.hasNext()) {
    if (iter.peek() === ';') {
      iter.next();  // Consume ';'.
      ++line;
      continue;
    } else if (iter.peek() === ',') {
      iter.next();  // Consume ','.
      continue;
    }

    state.column = iter.nextVLQ() + (line === state.line ? state.column : 0);
    state.line = line;
    if (iter.peekVLQ() === null) {
      yield {line, column: state.column};
      continue;
    }

    const startItem: EncodedGeneratedRangeStart = {
      line,
      column: state.column,
      flags: iter.nextVLQ(),
    };

    if (startItem.flags & EncodedGeneratedRangeFlag.HasDefinition) {
      const sourceIdx = iter.nextVLQ();
      const scopeIdx = iter.nextVLQ();
      state.defScopeIdx = scopeIdx + (sourceIdx === 0 ? state.defScopeIdx : 0);
      state.defSourceIdx += sourceIdx;
      startItem.definition = {
        sourceIdx: state.defSourceIdx,
        scopeIdx: state.defScopeIdx,
      };
    }

    yield startItem;
  }
}

function resolveName(idx: number|undefined, names: string[]): string|undefined {
  if (idx === undefined || idx < 0) {
    return undefined;
  }
  return names[idx];
}

function decodeKind(kind: number): ScopeKind {
  switch (kind) {
    case 0x1:
      return 'global';
    case 0x2:
      return 'function';
    case 0x3:
      return 'class';
    case 0x4:
      return 'block';
    default:
      throw new Error(`Unknown scope kind ${kind}`);
  }
}
