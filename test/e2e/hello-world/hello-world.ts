// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {getElementLocation, getPages, resetPages, resourcesPath} from '../helper.js';

describe('Hello World', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('checks the console', async () => {
    const {target, frontend} = getPages();

    // Have the target load the page.
    await target.goto(`${resourcesPath}/pages/hello-world.html`);

    // Locate the button for switching to the console tab.
    const consoleTabButtonLocation = await getElementLocation({id: 'tab-console'});
    if (!consoleTabButtonLocation) {
      assert.fail('Unable to locate console tab button.');
    }

    // Click on the button and wait for the console to load.
    await frontend.mouse.click(consoleTabButtonLocation.x, consoleTabButtonLocation.y);
    await frontend.waitForSelector('div.console-group.console-group-messages');

    // Get the first message from the console.
    const msg = await frontend.evaluate(() => {
      const message = document.querySelector('#console-messages div.console-group.console-group-messages .source-code');
      return message.textContent;
    });

    assert.equal(msg, 'hello-world.html:11 Hello, World!');
  });
});
