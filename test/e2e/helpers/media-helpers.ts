// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {$, getBrowserAndPages, resourcesPath, waitFor} from '../../shared/helper.js';

export async function playMediaFile(media: string) {
  const {target} = getBrowserAndPages();
  await target.goto(`${resourcesPath}/media/${media}`);

  // Need to click play manually - autoplay policy prevents it otherwise.
  return new Promise(async (resolve, reject) => {
    target.on('console', msg => {
      if (msg.text() === 'play') {
        resolve('play');
      } else {
        reject(msg.text());
      }
    });

    await target.evaluate(() => {
      const videoElement = document.getElementsByName('media')[0] as HTMLVideoElement;
      videoElement.addEventListener('play', () => {
        console.log('play');
      });

      // Just in case autoplay started before we could attach an event listener.
      if (!videoElement.paused || videoElement.readyState > 2) {
        console.log('play');
      } else {
        videoElement.play();
      }
    });
  });
}

export async function getPlayerButton() {
  await waitFor('.player-entry-tree-element');
  return await $('.player-entry-tree-element');
}

export async function getPlayerButtonText() {
  const playerEntry = await getPlayerButton();
  return await playerEntry.evaluate(E => E.textContent);
}
