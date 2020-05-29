// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// RUN: NODE_PATH=/usr/local/google/home/pfaffe/Code/devtools/devtools-frontend/out/x64.debug/SymbolServer.stage2/bin node | FileCheck %s

const fs = require('fs');

global.fetch =
    function(source) {
  const path = source.replace('%(unit_inputs)s', '../../unittests/Inputs');
  console.log(`Loading module from ${path}`);
  return {arrayBuffer: () => new Uint8Array(fs.readFileSync(path, null)).buffer};
}

const Test = require('../NodeTests.js');

const Input = [
  {'method': 'addRawModule', 'params': {'rawModuleId': '0', 'rawModule': {'url': '%(unit_inputs)s/global.wasm'}}},
  {'method': 'listVariablesInScope', 'params': {'rawLocation': {'rawModuleId': '0', 'codeOffset': 55}}},
  {'method': 'evaluateVariable', 'params': {'name': 'I', 'location': {'rawModuleId': '0', 'codeOffset': 55}}}
];

var heap;

// void __getMemory(uint32_t offset, uint32_t size, void* result);
function proxyGetMemory(offset, size, result) {
  console.log('Reading ' + size + ' bytes from offset ' + offset + ' into ' + result);
  // Expecting size 4, so "read" 4 bytes from the engine:
  heap[result] = 0;
  heap[result + 1] = 1;
  heap[result + 2] = 0;
  heap[result + 3] = 0;
}

(async () => {
  const Plugin = await Test.getWasmPlugin();
  for (const {method, params} of Input) {
    const result = await Plugin.callMethod(method, params)
    console.log(result);
    if (!result) {
      break;
    }

    if (result.code) {
      const buf = Uint8Array.from(Test.decodeBase64(result.code));
      const module = new WebAssembly.Module(buf);
      const instance = Test.makeInstance(module, {getMemory: proxyGetMemory});
      heap = new Uint8Array(instance.exports.memory.buffer);
      const result_offset = instance.exports.wasm_format();
      console.log('Result at: ' + result_offset);
      console.log('Result: ' + Test.toString(heap, result_offset));
    }
  }
})();
