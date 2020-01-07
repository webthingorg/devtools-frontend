// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {CSSShadowModel} from '../../../../front_end/inline_editor/CSSShadowModel.js';

describe('CSSShadowModel', () => {
  it('can be instantiated successfully', () => {
    const cssShadowModel = new CSSShadowModel(true);
    assert.isFalse(cssShadowModel.inset(), 'inset value was not set or retrieved correctly');
  });

  // TODO continue writing tests here or use another describe block
});
