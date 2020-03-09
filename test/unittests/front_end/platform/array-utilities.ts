// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ArrayUtilities} from '../../../../front_end/platform/platform.js';

const {assert} = chai;

describe('ArrayUtilities', () => {
  describe('removeElement', () => {
    it('removes elements', () => {
      const testArrays = [
        [],
        [],
        [],
        [1],
        [1],
        [1],
        [1, 2, 3, 4, 5, 4, 3, 2, 1],
        [1, 3, 4, 5, 4, 3, 2, 1],
        [1, 3, 4, 5, 4, 3, 1],
        [2, 2, 2, 2, 2],
        [2, 2, 2, 2],
        [],
        [2, 2, 2, 1, 2, 2, 3, 2],
        [2, 2, 1, 2, 2, 3, 2],
        [1, 3],
      ];

      for (let i = 0; i < testArrays.length; i += 3) {
        let actual = testArrays[i].slice(0);
        let expected = testArrays[i + 1];
        ArrayUtilities.removeElement(actual, 2, true);
        assert.deepStrictEqual(expected, actual, 'Removing firstOnly (true) failed');

        actual = testArrays[i].slice(0);
        expected = testArrays[i + 2];
        ArrayUtilities.removeElement(actual, 2, false);
        assert.deepStrictEqual(expected, actual, 'Removing firstOnly (false) failed');
      }
    });
  });
});
