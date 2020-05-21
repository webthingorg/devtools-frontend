// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from 'puppeteer';

import {click, resourcesPath, waitFor} from '../../shared/helper.js';
import {openPanelViaMoreTools} from './settings-helpers.js';

const ANIMATIONS_PANE_SELECTOR = 'div[aria-label="Animations panel"]';

export async function waitForAnimationsPanelToLoad() {
  // Open panel and wait for content
  await openPanelViaMoreTools('Animations');
  await waitFor(ANIMATIONS_PANE_SELECTOR);
}

export async function navigateToSiteWithAnimation(target: puppeteer.Page) {
  // Navigate to a website with an animation
  const targetUrl = `${resourcesPath}/animations/default.html`;
  await target.goto(targetUrl);
}

export async function waitForAnimationContent() {
  const first_animation_preview_selector = '.animation-buffer-preview[aria-label="Animation Preview 1"]';
  const animation_timeline_buffer_children_selector = '.animation-timeline-buffer';

  await waitFor(animation_timeline_buffer_children_selector);
  await waitFor(first_animation_preview_selector);
  await click(first_animation_preview_selector);

  await waitFor('.animation-node-row');
  await waitFor('svg.animation-ui');
}
