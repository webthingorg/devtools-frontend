// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {
  $,
  $textContent,
  assertNotNullOrUndefined,
  click,
  waitFor,
  waitForFunction,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {getColorSwatch, goToResourceAndWaitForStyleSection} from '../helpers/elements-helpers.js';

interface OverlayElement extends Element {
  transitionPromise?: Promise<void>;
}

describe('ColorPicker', () => {
  it('scrolls to the bottom when previewing palettes', async () => {
    await goToResourceAndWaitForStyleSection('elements/css-variables-many.html');

    const swatch = await getColorSwatch(/* parent*/ undefined, 0);
    await click(swatch);

    const panel = await waitFor('.palette-panel');
    await click('.spectrum-palette-switcher');
    await waitForFunction(() => panel.isIntersectingViewport({threshold: 1}));

    const palette = await waitForFunction(async () => await $textContent('CSS Variables') ?? undefined);

    // Need to wait for the spectrum overlay to disappear (i.e., finish its transition) for it to not eat our next click
    const overlay = await $('.spectrum-overlay');
    assertNotNullOrUndefined(overlay);
    await overlay.evaluate((overlay: OverlayElement) => {
      if (overlay.transitionPromise) {
        throw new Error('transitionend listener has already been installed');
      }
      overlay.transitionPromise = new Promise<void>(resolve => {
        const handler = () => {
          overlay.removeEventListener('transitionend', handler);
          resolve();
        };
        overlay.addEventListener('transitionend', handler);
      });
    });
    await click(palette);
    await overlay.evaluate((overlay: OverlayElement) => {
      if (!overlay.transitionPromise) {
        throw new Error('transitionend listener has not been installed');
      }
      return overlay.transitionPromise;
    });

    await click('.spectrum-palette-switcher');
    await waitForFunction(() => panel.isIntersectingViewport({threshold: 1}));
  });
});
