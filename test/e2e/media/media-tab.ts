// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {$, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';
import {openPanelViaMoreTools} from '../helpers/settings-helpers.js';

function shouldRunTest() {
  const features = process.env['CHROME_FEATURES'];
  return features !== undefined && features.includes('MediaInspectorLogging');
}

async function playMediaFile(media: string) {
  const {target} = getBrowserAndPages();
  await target.goto(`${resourcesPath}/media/${media}`);

  // Need to click play manually - autoplay policy prevents it otherwise.
  await target.click('[name="media"]');
}

async function getPlayerButton() {
  await waitFor('.player-entry-tree-element');
  return await $('.player-entry-tree-element');
}

describe('Media Tab', () => {
  beforeEach(async () => {
    await resetPages({'enabledExperiments': ['mediaInspector']});
  });

  it('ensures video playback adds entry', async () => {
    if (!shouldRunTest()) {
      return;
    }

    await playMediaFile('fisch.webm');
    await openPanelViaMoreTools('Media');
    const playerEntry = await getPlayerButton();
    const entryName = await playerEntry.evaluate(E => E.textContent);

    // Names are glitched right now, and display 32-character unguessable tokens.
    assert.equal(entryName.length, 32);
  });
});
