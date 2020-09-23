// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {getBrowserAndPages, resetPages, timeout} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';

const keys = [
  'Escape',
  'Enter',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
];

describe('Fuzzer', async () => {
  it('Random clicks', async () => {
    let stop = false;
    const targetUrl = 'https://v8.dev';
    const {frontend, target} = getBrowserAndPages();

    target.on('error', () => {
      console.error('Target page crashed!');
      stop = true;
    });
    frontend.on('error', () => {
      console.error('Frontend crashed!');
      stop = true;
    });
    // We click on a lot of links to e.g. web.dev articles.
    frontend.on('popup', newPage => {
      newPage.close();
    });

    const actions = [];

    await target.goto(targetUrl);

    // Don't hardcode.
    const width = 1280;
    const height = 780;
    for (let i = 0; !stop; i++) {
      const shouldClick = Math.random() > 0.2;
      if (shouldClick) {
        const xPos = Math.floor(Math.random() * width);
        const yPos = Math.floor(Math.random() * height);
        await frontend.mouse.click(xPos, yPos);
        actions.push({x: xPos, y: yPos});
      } else {
        const key = keys[Math.floor(Math.random() * keys.length)];
        await frontend.keyboard.press(key);
        actions.push({key});
      }
      await timeout(20);
    }

    await resetPages();
    // await target.goto(targetUrl);

    // for (const action of actions) {
    //   if (action.x) {
    //     await frontend.mouse.click(action.x, action.y);
    //   }
    //   if (action.key) {
    //     await frontend.keyboard.press(action.key);
    //   }
    //   await timeout(20);
    // }

    // await frontend.mouse.click(20, 20);
    // await timeout(5000);
  });
});
