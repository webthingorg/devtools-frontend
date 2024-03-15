// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as AnnotationsManager from './annotations_manager.js';

describe('AnnotationsManager', () => {
  it('correctly generates an entry hash', async () => {
    const manager = AnnotationsManager.AnnotationsManager.AnnotationsManager.instance();
    assert.exists(manager);
  });
});
