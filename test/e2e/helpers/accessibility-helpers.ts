// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


import {goToResource} from '../../shared/helper.js';
import {navigateToAccessibilityPane, navigateToElementsTab} from './elements-helpers.js';

export const loadAccessibilityPanel = async () => {
  await goToResource('elements/ax-breadcrumbs.html');
  // Do we need to navigate to the elements tab before attempting to open the
  // accessibility pane?
  await navigateToElementsTab();
  await navigateToAccessibilityPane();
};
