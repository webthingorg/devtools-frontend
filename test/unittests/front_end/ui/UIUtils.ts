// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {getURLWithReferrer} from '/front_end/ui/UIUtils.js';

describe('getURLWithReferrer', () => {
  it('correctly adds referrer info to URLs', () => {
    assert.equal(
        getURLWithReferrer('https://www.domain.com/route'),
        'https://www.domain.com/route?utm_source=devtools'
    );
    assert.equal(
        getURLWithReferrer('https://www.domain.com/route#anchor'),
        'https://www.domain.com/route?utm_source=devtools#anchor'
    );
    assert.equal(
        getURLWithReferrer('https://www.domain.com/route?key=value'),
        'https://www.domain.com/route?key=value&utm_source=devtools'
    );
    assert.equal(
        getURLWithReferrer('https://www.domain.com/route?key=value#anchor'),
        'https://www.domain.com/route?key=value&utm_source=devtools#anchor'
    );
  });
});
