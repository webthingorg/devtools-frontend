// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../front_end/platform/platform.js';

const {assert} = chai;

describe('ArrayUtilities', () => {
  describe('removeElement', () => {
    it('removes elements', () => {
      const testCases = [
        {input: [], expectedFirstOnlyTrue: [], expectedFirstOnlyFalse: []},
        {input: [1], expectedFirstOnlyTrue: [1], expectedFirstOnlyFalse: [1]},
        {
          input: [1, 2, 3, 4, 5, 4, 3, 2, 1],
          expectedFirstOnlyTrue: [1, 3, 4, 5, 4, 3, 2, 1],
          expectedFirstOnlyFalse: [1, 3, 4, 5, 4, 3, 1],
        },
        {input: [2, 2, 2, 2, 2], expectedFirstOnlyTrue: [2, 2, 2, 2], expectedFirstOnlyFalse: []},
        {input: [2, 2, 2, 1, 2, 2, 3, 2], expectedFirstOnlyTrue: [2, 2, 1, 2, 2, 3, 2], expectedFirstOnlyFalse: [1, 3]},
      ];

      for (const testCase of testCases) {
        const actualFirstOnlyTrue = [...testCase.input];

        Platform.ArrayUtilities.removeElement(actualFirstOnlyTrue, 2, true);
        assert.deepStrictEqual(actualFirstOnlyTrue, testCase.expectedFirstOnlyTrue, 'Removing firstOnly (true) failed');

        const actualFirstOnlyFalse = [...testCase.input];
        Platform.ArrayUtilities.removeElement(actualFirstOnlyFalse, 2, false);
        assert.deepStrictEqual(
            actualFirstOnlyFalse, testCase.expectedFirstOnlyFalse, 'Removing firstOnly (false) failed');
      }
    });
  });

  describe('binaryIndexOf', () => {
    it('calculates the correct binary index', () => {
      const fixtures = [
        [],
        [1],
        [1, 10],
        [1, 10, 11, 12, 13, 14, 100],
        [-100, -50, 0, 50, 100],
        [-100, -14, -13, -12, -11, -10, -1],
      ];

      function testArray(array: number[]) {
        function comparator(a: number, b: number) {
          return a < b ? -1 : (a > b ? 1 : 0);
        }

        for (let i = -100; i <= 100; ++i) {
          const reference = array.indexOf(i);
          const actual = Platform.ArrayUtilities.binaryIndexOf(array, i, comparator);
          assert.strictEqual(reference, actual);
        }
      }

      for (const fixture of fixtures) {
        testArray(fixture);
      }
    });
  });
});
