
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {describe, it} from '../../shared/mocha-extensions.js';
import {loadAccessibilityPanel} from '../helpers/accessibility-helpers.js';


describe('The Accessibility pane', async () => {
  beforeEach(async function() {
    loadAccessibilityPanel();
  });

  it('can display the accessibility tree', async () => {
    // Some test that iterates over the accessibility tree and counts the number
    // of nodes, asserts things about the roles etc.
    assert(true);
  });
});
