// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import '/front_end/common/common-legacy.js';
import {ListModel} from '/front_end/ui/ListModel.js';

describe('ListModel', () => {
  after(() => {
    // Clean up polluted globals.
    // TODO(https://crbug.com/1006759): These need removing once the ESM migration is complete.
    const globalObj = (self as any);
    delete globalObj.Common;
  });

  it('can be instantiated correctly without a list of items', () => {
    const listModel = new ListModel();
    assert.equal(listModel.length, 0, 'length of list model should be 0');
  });

  it('supports various list operations', () => {
    const model = new ListModel();

    model.replaceAll([0, 1, 2]);
    assert.deepEqual([...model], [0, 1, 2]);

    model.replaceRange(0, 1, [5, 6, 7]);
    assert.deepEqual([...model], [5, 6, 7, 1, 2]);

    model.insert(model.length, 10);
    assert.deepEqual([...model], [5, 6, 7, 1, 2, 10]);

    model.remove(model.length - 1);
    assert.deepEqual([...model], [5, 6, 7, 1, 2]);

    model.remove(4);
    assert.deepEqual([...model], [5, 6, 7, 1]);

    model.insert(1, 8);
    assert.deepEqual([...model], [5, 8, 6, 7, 1]);

    model.replaceAll([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    assert.deepEqual([...model], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    model.replaceRange(7, 8, [27]);
    assert.deepEqual([...model], [0, 1, 2, 3, 4, 5, 6, 27, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    model.replaceRange(18, 20, [28, 29]);
    assert.deepEqual([...model], [0, 1, 2, 3, 4, 5, 6, 27, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 28, 29]);

    model.replaceRange(1, 4, [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]);
    assert.deepEqual([...model], [0, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 4, 5, 6, 27, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 28, 29]);

    model.replaceRange(0, 29, []);
    assert.deepEqual([...model], [29]);
  });
});
