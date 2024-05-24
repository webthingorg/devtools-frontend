// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../core/platform/platform.js';

import {ContentData} from './ContentData.js';

interface FunctionBodyOffset {
  start: number;
  end: number;
}

/**
 * Metadata to map between bytecode #offsets and line numbers in the
 * disassembly for WebAssembly modules.
 */
export class WasmDisassembly extends ContentData {
  readonly lines: string[];
  readonly #offsets: number[];
  #functionBodyOffsets: FunctionBodyOffset[];

  constructor(lines: string[], offsets: number[], functionBodyOffsets: FunctionBodyOffset[]) {
    super(lines.join('\n'), /* isBase64 */ false, 'text/x-wast', 'utf-8');
    if (lines.length !== offsets.length) {
      throw new Error('Lines and offsets don\'t match');
    }
    this.lines = lines;
    this.#offsets = offsets;
    this.#functionBodyOffsets = functionBodyOffsets;
  }

  get lineNumbers(): number {
    return this.#offsets.length;
  }

  bytecodeOffsetToLineNumber(bytecodeOffset: number): number {
    return Platform.ArrayUtilities.upperBound(
               this.#offsets, bytecodeOffset, Platform.ArrayUtilities.DEFAULT_COMPARATOR) -
        1;
  }

  lineNumberToBytecodeOffset(lineNumber: number): number {
    return this.#offsets[lineNumber];
  }

  /**
   * returns an iterable enumerating all the non-breakable line numbers in the disassembly
   */
  * nonBreakableLineNumbers(): Iterable<number> {
    let lineNumber = 0;
    let functionIndex = 0;
    while (lineNumber < this.lineNumbers) {
      if (functionIndex < this.#functionBodyOffsets.length) {
        const offset = this.lineNumberToBytecodeOffset(lineNumber);
        if (offset >= this.#functionBodyOffsets[functionIndex].start) {
          lineNumber = this.bytecodeOffsetToLineNumber(this.#functionBodyOffsets[functionIndex++].end) + 1;
          continue;
        }
      }
      yield lineNumber++;
    }
  }
}
