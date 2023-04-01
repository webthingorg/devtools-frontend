// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from '../../shared/mocha-extensions.js';
import {
  navigateToSiteWithAnimation,
  waitForAnimationContent,
  waitForAnimationsPanelToLoad,
} from '../helpers/animations-helpers.js';

describe('The Animations Panel', async () => {
  it.repeat(100, 'Listens for animation in webpage', async () => {
    await waitForAnimationsPanelToLoad();
    await navigateToSiteWithAnimation();
    await waitForAnimationContent();
  });
});
