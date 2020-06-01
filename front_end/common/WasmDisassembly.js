
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Metadata to map between bytecode offsets and line numbers in the
 * disassembly for WebAssembly modules.
 */
export class WasmDisassembly {
  /**
   * @param {!Array<number>} offsets mapping of line numbers to bytecode offsets
   */
  constructor(offsets) {
    this._offsets = offsets;
  }

  /**
   * @param {number} bytecodeOffset
   * @return {number}
   */
  bytecodeOffsetToLineNumber(bytecodeOffset) {
    let l = 0, r = this._offsets.length - 1;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      const offset = this._offsets[m];
      if (offset < bytecodeOffset) {
        l = m + 1;
      } else if (offset > bytecodeOffset) {
        r = m - 1;
      } else {
        return m;
      }
    }
    return l;
  }

  /**
   * @param {number} lineNumber
   * @return {number}
   */
  lineNumberToBytecodeOffset(lineNumber) {
    return this._offsets[lineNumber];
  }
}
