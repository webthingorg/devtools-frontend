// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Explain from '../../../../../front_end/panels/explain/explain.js';

const {assert} = chai;

describe('Explain', () => {
  it('should be available if bindings are defined', async () => {
    assert(!Explain.isAvailable('devtools://app.html?'));
    assert(!Explain.isAvailable('devtools://app.html?enableAida=false'));
    assert(Explain.isAvailable('devtools://app.html?enableAida=true'));
  });
});
