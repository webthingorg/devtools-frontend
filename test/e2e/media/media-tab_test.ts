// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

<<<<<<< HEAD
<<<<<<< HEAD
import {goToResource, getBrowserAndPages} from '../../shared/helper.js';
=======
import {goToResource} from '../../shared/helper.js';
>>>>>>> 632bdc690 (errors)
=======
import {getBrowserAndPages, goToResource} from '../../shared/helper.js';
>>>>>>> 8dc1299c5 (its alive!)
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getPlayerButtonText,
  getPlayerErrors,
  playMediaFile,
  waitForPlayerButtonTexts,
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
<<<<<<< HEAD
<<<<<<< HEAD
    await goToResource(`media/corrupt.webm`);

=======
    await goToResource(`media/corrupt.webm`);


>>>>>>> 8dc1299c5 (its alive!)
    const {target} = getBrowserAndPages();
    await target.evaluate(() => {
      const videoElement = document.getElementsByName('media')[0] as HTMLVideoElement;
      void videoElement.play();
    });

<<<<<<< HEAD
    const errors = await getPlayerErrors(2);
    const errorContent = await errors[1].evaluate(el => el.textContent);
    assert.include(errorContent, 'PipelineStatus');
  });

=======
    await playMediaFile('corrupt.webm');
    const errorNodes = await getPlayerErrors(3);
    assert.include(errorNodes[2].toString(), 'PipelineStatus');
  });
>>>>>>> 632bdc690 (errors)
=======
    const errors = await getPlayerErrors(3);
    assert.include(errors[2].toString(), 'PipelineStatus');
  });

>>>>>>> 8dc1299c5 (its alive!)
});
