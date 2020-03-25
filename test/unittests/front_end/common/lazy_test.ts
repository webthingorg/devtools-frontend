// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {lazy} from '/front_end/common/lazy.js';

describe('lazy', () => {
  it('evaluates callback once', () => {
    const initializeArrayOnce = lazy(() => new Array());
    const arrayOne: any = initializeArrayOnce();
    const arrayTwo: any = initializeArrayOnce();

    assert.equal(arrayOne, arrayTwo);
    assert.notEqual(new Array(), arrayOne);
  });
});
