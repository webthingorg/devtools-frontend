// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as assert from 'assert';
import * as WebIDL2 from 'webidl2';

import {postProcess, walkRoot} from './helpers.js';

describe('Array', function() {
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
});
