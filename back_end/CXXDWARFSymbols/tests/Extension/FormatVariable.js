// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// REQUIRES: wasm_plugin
// RUN: node %s 2> /dev/null | FileCheck %s

const Test = require('../NodeTests.js');

const Input = [
  {'method': 'addRawModule', 'params': {'rawModuleId': '0', 'rawModule': {'url': '%(unit_inputs)s/global.wasm'}}}, {
    'method': 'sourceLocationToRawLocation',
    'params': {'sourceLocation': {'rawModuleId': '0', 'sourceFile': 'global.c', 'lineNumber': 11, 'columnNumber': 10}}
  },
  {'method': 'rawLocationToSourceLocation', 'params': {'rawLocation': {'rawModuleId': '0', 'codeOffset': 58}}},
  {'method': 'listVariablesInScope', 'params': {'rawLocation': {'rawModuleId': '0', 'codeOffset': 58}}},
  {'method': 'evaluateVariable', 'params': {'name': 'I', 'location': {'rawModuleId': '0', 'codeOffset': 58}}}
];

// CHECK-LABEL: addRawModule
// CHECK: ["global.c"]

// CHECK-LABEL: sourceLocationToRawLocation
// CHECK-DAG: "codeOffet":58
// CHECK-DAG: "sourceFile":"global.c"

// CHECK-LABEL: rawLocationToSourceLocation
// CHECK: "lineNumber":11

// CHECK-LABEL: listVariablesInScope
// CHECK-DAG: "name":"I"
// CHECK-DAG: "scope":"GLOBAL"
// CHECK-DAG: "type":"int"

// CHECK-LABEL: evaluateVariable
// CHECK: Reading 4 bytes from offset 1024
// CHECK: Result at: {{[0-9]+}}
// CHECK: Result: {"type":"int32_t","name":"I","value":"256"}
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
    console.log(method);
    console.log(JSON.stringify(result));
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
