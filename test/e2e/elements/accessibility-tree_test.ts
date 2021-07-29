// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {enableExperiment, goToResource, waitForAria} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {toggleAccessibilityPane, toggleAccessibilityTree} from '../helpers/elements-helpers.js';

describe('Accessibility Tree in the Elements Tab', async function() {
  beforeEach(async () => {
    await enableExperiment('fullAccessibilityTree');
  });

  it('displays the fuller accessibility tree', async () => {
    await goToResource('elements/accessibility-simple-page.html');
    await toggleAccessibilityPane();
    await toggleAccessibilityTree();
    await waitForAria('heading\xa0"Title" [role="treeitem"]');
    await waitForAria('link\xa0"cats" [role="treeitem"]');
  });
});
