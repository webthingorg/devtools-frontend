// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, goToResource, waitFor, waitForFunction} from '../../shared/helper.js';

import {openPanelViaMoreTools} from './settings-helpers.js';

export async function waitForAnimationsPanelToLoad() {
  // Open panel and wait for content
  await openPanelViaMoreTools('Animations');
  await waitFor('div[aria-label="Animations panel"]');
  await waitFor('div.animations-timeline');
}

export async function navigateToSiteWithAnimation() {
  // Navigate to a website with an animation
  await goToResource('animations/default.html');
}

export const waitForMutation = async () => {
  const element = await waitFor('body');
  let elementContent = await element.evaluate(e => e.outerHTML);
  let stoppedMutating = 0;
  await waitForFunction(async () => {
    const newElementContent = await element.evaluate(e => e.outerHTML);
    // find faster way to compare
    if (elementContent === newElementContent) {
      stoppedMutating++;
    } else {
      stoppedMutating = 0;
    }
    if (stoppedMutating > 10) {
      return true;
    }
    elementContent = newElementContent;
    return false;
  });
};

export async function waitForAnimationContent() {
  const firstAnimationPreviewSelector = '.animation-buffer-preview[aria-label="Animation Preview 1"]';
  await waitFor(firstAnimationPreviewSelector);
  await waitForMutation();
  await click(firstAnimationPreviewSelector);
  await waitFor('.animation-node-row');
  await waitFor('svg.animation-ui');
}
