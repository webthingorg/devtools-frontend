// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {ShortcutTreeNode} from '../../../../front_end/ui/ShortcutRegistry.js';

describe('ShortcutRegistry', () => {
  it('can be instantiated without issues', () => {
    const node = new ShortcutTreeNode(0, 0);
    assert.strictEqual(node.actions().size, 0, 'node should not have any actions upon instantiation');
  });
});
