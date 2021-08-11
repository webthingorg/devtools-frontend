// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../../../front_end/core/sdk/sdk.js';

const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeVlq(n: number): string {
  // Set the sign bit as the least significant bit.
  n = n >= 0 ? 2 * n : 1 - 2 * n;
  // Encode in base64 run
  let result = '';
  while (true) {
    const digit = n & 0x1f;
    n >>= 5;
    if (n === 0) {
      result += base64Digits[digit];
      break;
    } else {
      result += base64Digits[0x20 + digit];
    }
  }
  return result;
}

export function encodeVlqList(list: number[]) {
  return list.map(encodeVlq).join('');
}

const mappingRE = new RegExp('^(\\d+):(\\d+)(?:\\s*=>\\s*([^:]+):(\\d+):(\\d+)(?:@(\\S+))?)?$');

// Encode array mappings of the form "compiledLine:compiledColumn => filename:srcLine:srcColumn"
// as a source map.
export function encodeSourceMap(textMap: string[]): SDK.SourceMap.SourceMapV3 {
  let mappings = '';
  const sources: string[] = [];
  const names: string[] = [];

  const state = {
    line: -1,
    column: 0,
    srcFile: 0,
    srcLine: 0,
    srcColumn: 0,
    srcName: 0,
  };

  for (const mapping of textMap) {
    const match = mapping.match(mappingRE);
    if (!match) {
      throw 'Cannot parse mapping';
    }

    const lastState = Object.assign({}, state);
    state.line = Number(match[1]);
    state.column = Number(match[2]);
    const hasSource = match[3] !== undefined;
    const hasName = hasSource && (match[6] !== undefined);
    if (hasSource) {
      state.srcFile = addString(sources, match[3]);
      state.srcLine = Number(match[4]);
      state.srcColumn = Number(match[5]);
      if (hasName) {
        state.srcName = addString(names, match[6]);
      }
    }

    if (state.line < lastState.line) {
      throw 'Line numbers must be increasing';
    }

    const isNewLine = state.line !== lastState.line;

    if (isNewLine) {
      // Fixup for the first mapping.
      if (lastState.line === -1) {
        lastState.line = 0;
      }
      // Insert as many semicolons as necessary.
      mappings += ';'.repeat(state.line - lastState.line);
      lastState.column = 0;
    } else {
      mappings += ',';
    }

    const toEncode = [state.column - lastState.column];
    if (hasSource) {
      toEncode.push(
          state.srcFile - lastState.srcFile, state.srcLine - lastState.srcLine, state.srcColumn - lastState.srcColumn);
      if (hasName) {
        toEncode.push(state.srcName - lastState.srcName);
      }
    }
    mappings += encodeVlqList(toEncode);
  }

  return {
    mappings,
    sources,
    names,
    version: 3,
    file: undefined,
    sections: undefined,
    sourceRoot: undefined,
    sourcesContent: undefined,
  };

  function addString(array: string[], s: string) {
    const index = array.indexOf(s);
    if (index >= 0) {
      return index;
    }
    array.push(s);
    return array.length - 1;
  }
}
