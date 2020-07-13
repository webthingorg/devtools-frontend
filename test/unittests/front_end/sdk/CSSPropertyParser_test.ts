// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as SDK from '../../../../front_end/sdk/sdk.js';

describe('CSSPropertyParser', () => {
  it('should parse font-variation-settings', () => {
    const tests = [
      {
        value: '"wght" 10',
        expected: [{tag: 'wght', value: 10}],
      },
      {
        value: '"wght" wght',
        expected: [],
      },
      {
        value: '"wght" 10, "wdth" 20',
        expected: [{tag: 'wght', value: 10}, {tag: 'wdth', value: 20}],
      },
      {
        value: '"wght" 10, /* comment */ "wdth" 20 /* comment */',
        expected: [{tag: 'wght', value: 10}, {tag: 'wdth', value: 20}],
      },
      {
        value: '"wght" 5.5',
        expected: [{tag: 'wght', value: 5.5}],
      },
      {
        value: '"weight" 5.5',
        expected: [],
      },
    ];
    for (const test of tests) {
      assert.deepEqual(SDK.CSSPropertyParser.parseFontVariationSettings(test.value), test.expected);
    }
  });

  it('should parse font-family', () => {
    const tests = [
      {
        value: 'Arial',
        expected: ['Arial'],
      },
      {
        value: '"Some font"',
        expected: ['Some font'],
      },
      {
        value: 'Arial, serif',
        expected: ['Arial', 'serif'],
      },
      {
        value: '  Arial  , "Some font" , serif',
        expected: ['Arial', 'Some font', 'serif'],
      },
    ];
    for (const test of tests) {
      assert.deepEqual(SDK.CSSPropertyParser.parseFontFamily(test.value), test.expected);
    }
  });
});
