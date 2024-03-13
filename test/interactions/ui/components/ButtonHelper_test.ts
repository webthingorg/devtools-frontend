// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {loadComponentDocExample, preloadForCodeCoverage} from '../../../../test/interactions/helpers/shared.js';
import {click, hover, waitFor} from '../../../../test/shared/helper.js';
import {describe, itScreenshot} from '../../../../test/shared/mocha-extensions.js';
import {assertElementScreenshotUnchanged} from '../../../shared/screenshots.js';

async function openButtonHelperPage() {
  await loadComponentDocExample('button-helper/basic.html');
}

describe('button helper screenshots test', () => {
  preloadForCodeCoverage('button-helper/basic.html');

  itScreenshot('default states are displayed correctly', async () => {
    await openButtonHelperPage();
    const container = await waitFor('#container');
    await assertElementScreenshotUnchanged(container, 'button-helper/buttons-page.png');
  });

  itScreenshot('primary button with icon hover state is displayed correctly', async () => {
    await openButtonHelperPage();
    const container = await waitFor('#container');
    const buttonDiv = await waitFor('#div-0', container);

    await hover('button', {
      root: buttonDiv,
    });

    await assertElementScreenshotUnchanged(container, 'button-helper/primary-button-with-icon-hovered.png');
  });

  itScreenshot('outlined button with icon hover state is displayed correctly', async () => {
    await openButtonHelperPage();
    const container = await waitFor('#container');
    const buttonDiv = await waitFor('#div-3', container);

    await click('button', {
      root: buttonDiv,
    });

    await assertElementScreenshotUnchanged(container, 'button-helper/outlined-button-with-icon-hovered.png');
  });

  itScreenshot('text button with icon hover state is displayed correctly', async () => {
    await openButtonHelperPage();
    const container = await waitFor('#container');
    const buttonDiv = await waitFor('#div-6', container);

    await click('button', {
      root: buttonDiv,
    });

    await assertElementScreenshotUnchanged(container, 'button-helper/text-button-with-icon-hovered.png');
  });

  itScreenshot('text button with icon hover state is displayed correctly', async () => {
    await openButtonHelperPage();
    const container = await waitFor('#container');
    const buttonDiv = await waitFor('#div-12', container);

    await click('button', {
      root: buttonDiv,
    });

    await assertElementScreenshotUnchanged(container, 'button-helper/icon-button-hovered.png');
  });
});
