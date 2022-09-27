// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getBrowserAndPages, goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getPlayerButtonText,
  getPlayerErrors,
  playMediaFile,
  waitForPlayerButtonTexts,
} from '../helpers/media-helpers.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('Media Tab', () => {
  // Flaky on windows
  it.skipOnPlatforms(['win32'], '[crbug.com/1368558] ensures video playback adds entry', async () => {
    await openPanelViaMoreTools('Media');
    await playMediaFile('fisch.webm');
    const entryName = await getPlayerButtonText();
    assert.strictEqual(entryName.length, 11, `Unexpected name ${entryName}, expected length 11`);
  });

  it('ensures video playback adds entry for web worker', async () => {
    await openPanelViaMoreTools('Media');
    await goToResource('media/codec_worker.html');
    await waitForPlayerButtonTexts(4);
  });

  it('ensures that errors are rendered nicely', async () => {
    await openPanelViaMoreTools('Media');
    await goToResource('media/corrupt.webm');
    const {target} = getBrowserAndPages();
    await target.evaluate(() => {
      const videoElement = document.getElementsByName('media')[0] as HTMLVideoElement;
      void videoElement.play();
    });
    const errors = await getPlayerErrors(2);
    const errorContent = await errors[1].evaluate(el => el.textContent);
    assert.include(errorContent, 'PipelineStatus');
  });
});
