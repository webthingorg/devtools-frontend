// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {click, getBrowserAndPages, goToResource, waitFor, waitForFunction, waitForMany} from '../../shared/helper.js';

export async function playMediaFile(media: string) {
  const {target} = getBrowserAndPages();
  await goToResource(`media/${media}`);

  // Need to click play manually - autoplay policy prevents it otherwise.
  return new Promise<void>(async resolve => {
    await target.exposeFunction('resolve', resolve);
    await target.evaluate(() => {
      const videoElement = document.getElementsByName('media')[0] as HTMLVideoElement;
      videoElement.addEventListener('play', () => {
        resolve();
      });
      // Just in case autoplay started before we could attach an event listener.
      if (!videoElement.paused || videoElement.readyState > 2) {
        resolve();
      } else {
        void videoElement.play();
      }
    });
  });
}

export async function getPlayerButton() {
  return await waitFor('.player-entry-player-title');
}

export async function getPlayerErrors(count: number) {
<<<<<<< HEAD
<<<<<<< HEAD
  await click(await waitFor('.player-entry-player-title'));
  await click(await waitFor('#tab-messages'));
  return await waitForMany('.media-message-error', count);
=======
  await waitFor('.player-entry-player-title');

  if (count > 0) {
    throw 'we were able to click on the messages!';
  } else {
    await click(await waitFor('#tab-messages'));
    await waitFor('.media-messages-body');
    return await waitForMany('.media-message-error', count);
  }
>>>>>>> 632bdc690 (errors)
=======
  await click(await waitFor('.player-entry-player-title'));
  await click(await waitFor('#tab-messages'));
  return await waitForMany('.media-message-error', count);
>>>>>>> 8dc1299c5 (its alive!)
}

export async function getPlayerButtonText() {
  const playerEntry = await getPlayerButton();
  return await playerEntry.evaluate(element => element.textContent as string);
}

export async function waitForPlayerButtonTexts(count: number) {
  return waitForFunction(async () => {
    return await waitForMany('.player-entry-player-title', count);
  });
}
