// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {WasmDisassembly} from '../../../../front_end/common/WasmDisassembly.js';

describe('WasmDisassembly', () => {
  const BYTECODE_OFFSETS = [0, 2, 3, 5, 7, 10, 11, 12, 13, 15, 18, 20, 24, 25, 26, 30, 31, 34, 80, 81, 83, 89, 90];

  it('maps line numbers to bytecode offsets correctly', () => {
    const disassembly = new WasmDisassembly(BYTECODE_OFFSETS);
    for (const [lineNumber, bytecodeOffset] of BYTECODE_OFFSETS.entries()) {
      assert.strictEqual(disassembly.lineNumberToBytecodeOffset(lineNumber), bytecodeOffset);
    }
  });

  it('maps bytecode offsets to line numbers correctly', () => {
    const disassembly = new WasmDisassembly(BYTECODE_OFFSETS);
    for (const [lineNumber, bytecodeOffset] of BYTECODE_OFFSETS.entries()) {
      assert.strictEqual(disassembly.bytecodeOffsetToLineNumber(bytecodeOffset), lineNumber);
    }
  });
});
