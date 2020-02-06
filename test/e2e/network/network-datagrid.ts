// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {click, debuggerStatement, getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';

async function obtainNetworkTabFrontend(testName: string, callback?: (page: puppeteer.Page) => Promise<void>) {
  const {target, frontend} = getBrowserAndPages();

  // Have the target load the page.
  await target.goto(`${resourcesPath}/network/${testName}.html`);

  await click('#tab-network');
  // Obtain console messages that were logged
  await frontend.waitForSelector('.network-log-grid');

  if (callback) {
    await debuggerStatement(frontend);
    await callback(frontend);
  }
  await debuggerStatement(frontend);

  return frontend;
}

describe('The Network Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('shows Last-Modified', async () => {
    const frontend = await obtainNetworkTabFrontend('last-modified');

    // Open the contextmenu for all network column
    await click('.name-column', {clickOptions: {button: 'right'}});

    // Enable the Last-Modified column in the network datagrid
    await click(`[aria-label="Response Headers"]`);
    await click(`[aria-label="Last-Modified, unchecked"]`);

    // Wait for the column to show up
    await frontend.waitForSelector('.last-modified-column');

    const lastModifiedColumnValues = await frontend.evaluate(() => {
      return Array.from(document.querySelectorAll('.last-modified-column')).map(message => message.textContent);
    });

    assert.deepEqual(lastModifiedColumnValues, [
      `Last-Modified`,
      ``,
      `Sun, 26 Sep 2010 22:04:35 GMT`,
    ]);
  });
});
