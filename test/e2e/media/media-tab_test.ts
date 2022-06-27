// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {goToResource} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getPlayerButtonText,
  getPlayerErrors,
  playMediaFile,
  waitForPlayerButtonTexts
} from '../helpers/media-helpers.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

describe('Media Tab', () => {
  it('ensures video playback adds entry', async () => {
    await openPanelViaMoreTools('Media');
    await playMediaFile('fisch.webm');
    const entryName = await getPlayerButtonText();
    assert.strictEqual(entryName.length, 11);
  });

  it('ensures video playback adds entry for web worker', async () => {
    await openPanelViaMoreTools('Media');
    await goToResource('media/codec_worker.html');
    await waitForPlayerButtonTexts(4);
  });

  it('ensures that errors are rendered nicely', async () => {
    await openPanelViaMoreTools('Media');
    await goToResource('media/corrupt.html');
    const error_nodes = await getPlayerErrors(3);
    assert.include(error_nodes[2].text_content, 'PipelineStatus');
  });
});
