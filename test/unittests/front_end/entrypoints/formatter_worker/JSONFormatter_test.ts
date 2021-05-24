// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as FormatterWorker from '../../../../../front_end/entrypoints/formatter_worker/formatter_worker.js';

function formatJSON(text: string): string {
  return FormatterWorker.FormatterWorker.format('application/json', text, '  ').content;
}

describe('JSONFormatter', () => {
  it('formats simple json objects correctly', () => {
    const formattedCode = formatJSON('{"people":[{"firstName":"Joe","lastName":"Jackson","age":28}]}');
    const expectedCode =
        '{\n    "people": [\n        {\n            "firstName": "Joe",\n            "lastName": "Jackson",\n            "age": 28\n        }\n    ]\n}';
    assert.strictEqual(formattedCode, expectedCode);
  });
  it('formats arrays correctly', () => {
    const formattedCode = formatJSON('{"people":["Joe", "Jane", "Jack"]}');
    const expectedCode = '{\n    "people": [\n        "Joe",\n        "Jane",\n        "Jack"\n    ]\n}';
    assert.strictEqual(formattedCode, expectedCode);
  });
  it('formats nested json objects correctly', () => {
    const formattedCode = formatJSON('{"people":[{"firstName":"Joe","siblings":{"sister": "Jane"}}]}');
    const expectedCode =
        '{\n    "people": [\n        {\n            "firstName": "Joe",\n            "siblings": {\n                "sister": "Jane"\n            }\n        }\n    ]\n}';
    assert.strictEqual(formattedCode, expectedCode);
  });
  it('does NOT create a new line break on empty objects or arrays', () => {
    const formattedCode = formatJSON('{"employees":[{"emptyObj":{}},[]]}');
    const expectedCode =
        '{\n    "employees": [\n        {\n            "emptyObj": {}\n        },\n        []\n    ]\n}';
    assert.strictEqual(formattedCode, expectedCode);
  });
  it('formats nesting levels correctly on more complex json files', () => {
    const formattedCode = formatJSON(
        '{"ddd":0,"ind":2,"ty":3,"nm":"Null 2","parent":1,"sr":1,"ks":{"o":{"a":0,"k":0,"ix":11},"p":{"a":0,"k":[634,587.5,0],"ix":2},"s":{"a":1,"k":[{"i":{"x":[0.638,0.638,0.616],"y":[1,1,1]},"o":{"x":[0.811,0.811,0.153],"y":[0,0,0]},"n":["0p638_1_0p811_0","0p638_1_0p811_0","0p616_1_0p153_0"],"t":30,"s":[0,0,100],"e":[103,103,100]},{"t":46.0000018736184}],"ix":6}},"ao":0,"ip":0,"op":9890.00040282796,"st":0,"bm":0}');
    const expectedCode =
        '{\n    "ddd": 0,\n    "ind": 2,\n    "ty": 3,\n    "nm": "Null 2",\n    "parent": 1,\n    "sr": 1,\n    "ks": {\n        "o": {\n            "a": 0,\n            "k": 0,\n            "ix": 11\n        },\n        "p": {\n            "a": 0,\n            "k": [\n                634,\n                587.5,\n                0\n            ],\n            "ix": 2\n        },\n        "s": {\n            "a": 1,\n            "k": [\n                {\n                    "i": {\n                        "x": [\n                            0.638,\n                            0.638,\n                            0.616\n                        ],\n                        "y": [\n                            1,\n                            1,\n                            1\n                        ]\n                    },\n                    "o": {\n                        "x": [\n                            0.811,\n                            0.811,\n                            0.153\n                        ],\n                        "y": [\n                            0,\n                            0,\n                            0\n                        ]\n                    },\n                    "n": [\n                        "0p638_1_0p811_0",\n                        "0p638_1_0p811_0",\n                        "0p616_1_0p153_0"\n                    ],\n                    "t": 30,\n                    "s": [\n                        0,\n                        0,\n                        100\n                    ],\n                    "e": [\n                        103,\n                        103,\n                        100\n                    ]\n                },\n                {\n                    "t": 46.0000018736184\n                }\n            ],\n            "ix": 6\n        }\n    },\n    "ao": 0,\n    "ip": 0,\n    "op": 9890.00040282796,\n    "st": 0,\n    "bm": 0\n}';
    assert.strictEqual(formattedCode, expectedCode);
  });
});
