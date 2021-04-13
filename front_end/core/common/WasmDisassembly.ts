// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Metadata to map between bytecode offsets and line numbers in the
 * disassembly for WebAssembly modules.
 */
/* eslint-disable rulesdir/no_underscored_properties */

export class WasmDisassembly {
  _offsets: number[];
  _functionBodyOffsets: {
    start: number;
    end: number;
  }[];
  constructor(offsets: number[], functionBodyOffsets: {
    start: number;
    end: number;
  }[]) {
    this._offsets = offsets;
    this._functionBodyOffsets = functionBodyOffsets;
  }

  /** @return {number} */
  get lineNumbers() {
    return this._offsets.length;
  }

  bytecodeOffsetToLineNumber(bytecodeOffset: number): number {
    let l = 0, r: number = this._offsets.length - 1;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      const offset = this._offsets[m];
      if (offset < bytecodeOffset) {
        l = m + 1;
      }
      else if (offset > bytecodeOffset) {
        r = m - 1;
      }
      else {
        return m;
      }
    }
    return l;
  }

  lineNumberToBytecodeOffset(lineNumber: number): number {
    return this._offsets[lineNumber];
  }

  /** an iterable enumerating all the non-breakable line numbers in the disassembly
     */
  *nonBreakableLineNumbers(): Iterable<number> {
    let lineNumber = 0;
    let functionIndex = 0;
    while (lineNumber < this.lineNumbers) {
      if (functionIndex < this._functionBodyOffsets.length) {
        const offset = this.lineNumberToBytecodeOffset(lineNumber);
        if (offset >= this._functionBodyOffsets[functionIndex].start) {
          lineNumber = this.bytecodeOffsetToLineNumber(this._functionBodyOffsets[functionIndex++].end);
          continue;
        }
      }
      yield lineNumber++;
    }
  }
}
