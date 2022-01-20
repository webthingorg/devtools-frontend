// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as assert from 'assert';
import ts from 'typescript';
import * as WebIDL2 from 'webidl2';

import {clearState, parseTSFunction, postProcess, walkRoot} from './helpers.js';

describe('Array', function() {
  this.afterEach(() => {
    clearState();
  });

  it('should produce correct signatures for Console IDL', function() {
    WebIDL2
        .parse(`
[Exposed=(Window,Worker,Worklet)]
namespace console {
  undefined assert(optional boolean condition = false, any... data);
  undefined table(optional any tabularData, optional sequence<DOMString> properties);
  undefined count(optional DOMString label = "default");
  undefined groupEnd();
};
`).forEach(walkRoot);
    const output = postProcess(/* dryRun: */ true);
    const expected = `export const NativeFunctions = [
  {
    "name": "assert",
    "signatures": [
      [
        "?condition",
        "...data"
      ]
    ]
  },
  {
    "name": "table",
    "signatures": [
      [
        "?tabularData",
        "?properties"
      ]
    ]
  },
  {
    "name": "count",
    "signatures": [
      [
        "?label"
      ]
    ]
  }
];`;
    assert.equal(output, expected);
  });
  it('should produce correct signatures for typescript typings', function() {
    const program = ts.createProgram(
        [
          new URL('test.d.ts', import.meta.url).pathname,
        ],
        {noLib: true, types: []});

    for (const file of program.getSourceFiles()) {
      ts.forEachChild(file, node => {
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
          for (const member of node.members) {
            if (member.kind === ts.SyntaxKind.MethodSignature) {
              parseTSFunction(member, node);
            }
          }
        }
        if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
          parseTSFunction(node, {name: {text: 'Window'}});
        }
      });
    }
    const output = postProcess(/* dryRun: */ true);
    const expected = `export const NativeFunctions = [
  {
    "name": "at",
    "signatures": [
      [
        "index"
      ]
    ]
  },
  {
    "name": "diffSig",
    "signatures": [
      [
        "oneSig"
      ]
    ],
    "receiver": "Array"
  },
  {
    "name": "diffSig",
    "signatures": [
      [
        "twoSig"
      ]
    ],
    "receiver": "ReadonlyArray"
  }
];`;
    assert.equal(output, expected);
  });
});
