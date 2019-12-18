// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {Icon} from '/front_end/ui/Icon.js';

describe('Icon', () => {
  it('can create an empty instance without issues', () => {
    const icon = Icon.create();
    assert.equal(icon.outerHTML, '<span is="ui-icon"></span>', 'icon was not created correctly');
  });

  // TODO continue writing tests here or use another describe block
});
