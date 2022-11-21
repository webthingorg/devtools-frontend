// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  getBrowserAndPages,
  goToResource,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getCurrentConsoleMessages,
  LOG_XML_HTTP_REQUESTS_SELECTOR,
  navigateToConsoleTab,
  toggleConsoleSetting,
  typeIntoConsoleAndWaitForResult,
} from '../helpers/console-helpers.js';

describe('The Console Tab', async () => {
  it('is able to log fetching when XMLHttpRequest Logging is enabled', async () => {
    await goToResource('../resources/console/console-fetch-logging.html');
    await navigateToConsoleTab();
    await toggleConsoleSetting(LOG_XML_HTTP_REQUESTS_SELECTOR);
    const expectedResults = [
      RegExp('Fetch finished loading: GET "https://localhost:[0-9]+/test/e2e/resources/console/xhr-exists.html".'),
      RegExp(
          'Fetch failed loading: GET "https://localhost:[0-9]+/test/e2e/resources/console/xhr-does-not-exist.html".'),
      RegExp('Fetch finished loading: POST "https://localhost:[0-9]+/test/e2e/resources/console/post-target.cgi".'),
      RegExp('Fetch failed loading: GET "http://localhost:8000/devtools/resources/xhr-exists.html".'),
    ];

    await typeIntoConsoleAndWaitForResult(getBrowserAndPages().frontend, 'await makeRequests();');

    const result = await getCurrentConsoleMessages();

    // Check that fetching is logged in the correct order
    let foundIdx = 0;
    for (let i = 0; i < expectedResults.length; i++) {
      const e = expectedResults[i];
      let found = false;

      for (let j = 0; j < result.length; j++) {
        const r = result[j];
        if (e.test(r)) {
          found = true;
          assert.isAtLeast(j, foundIdx, `${e} was not found in the correct order`);
          foundIdx = j;
          break;
        }
      }

      assert.isTrue(found, `${e} was not found`);
    }
  });

  it('does not log fetching when XMLHttpRequest Logging is disabled', async () => {
    await goToResource('../resources/console/console-fetch-logging.html');
    await navigateToConsoleTab();
    const expectedResults = [
      RegExp('Fetch finished loading: GET "https://localhost:[0-9]+/test/e2e/resources/console/xhr-exists.html".'),
      RegExp(
          'Fetch failed loading: GET "https://localhost:[0-9]+/test/e2e/resources/console/xhr-does-not-exist.html".'),
      RegExp('Fetch finished loading: POST "https://localhost:[0-9]+/test/e2e/resources/console/post-target.cgi".'),
      RegExp('Fetch failed loading: GET "http://localhost:8000/devtools/resources/xhr-exists.html".'),
    ];

    await typeIntoConsoleAndWaitForResult(getBrowserAndPages().frontend, 'await makeRequests();');

    const result = await getCurrentConsoleMessages();

    // Check that fetching is not logged
    for (let i = 0; i < expectedResults.length; i++) {
      const e = expectedResults[i];
      assert.isFalse(result.some(r => e.test(r)), `${e} was found when it was not expected`);
    }
  });
});
