// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {describe, it} from 'mocha';

import {click, getBrowserAndPages, resourcesPath, waitFor} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('The Animations Panel', async () => {
  it('Listens for animation in webpage', async () => {
    const {target} = getBrowserAndPages();

    // Open panel and wait for content
    await openPanelViaMoreTools('Animations');
    await waitFor('div[aria-label="Animations panel"]');

    // Navigate to a website with an animation
    const targetUrl = `${resourcesPath}/animations/default.html`;
    await target.goto(targetUrl);

    const first_animation_preview_selector = '.animation-buffer-preview[aria-label="Animation Preview 1"]';
    await waitFor(first_animation_preview_selector);
    await click(first_animation_preview_selector);
  });
});
