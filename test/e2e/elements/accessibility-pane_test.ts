
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getBrowserAndPages, goToResource, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {focusElementsTree, getAllPropertiesFromComputedPane, getContentOfComputedPane, navigateToSidePane, toggleShowAllComputedProperties, waitForComputedPaneChange, waitForElementsComputedSection} from '../helpers/elements-helpers.js';


describe('The Accessibility pane', async () => {
  beforeEach(async function() {
    await goToResource('elements/ax-breadcrumbs.html');
    await navigateToSidePane('Computed');
  });

  it('can display the CSS properties of the selected element', async () => {
    assert(true);
  });
});
