// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import type {ElementHandle} from 'puppeteer';
import {expectError} from '../../conductor/events.js';
import {
  $,
  $$,
  click,
  enableExperiment,
  getTestServerPort,
  step,
  typeText,
  waitFor,
  waitForAria,
  waitForElementWithTextContent,
  waitForFunction,
  getBrowserAndPages,
  getResourcesPath,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {CONSOLE_TAB_SELECTOR, focusConsolePrompt} from '../helpers/console-helpers.js';
import {triggerLocalFindDialog} from '../helpers/memory-helpers.js';
import {
  getAllRequestNames,
  navigateToNetworkTab,
  selectRequestByName,
  waitForSomeRequestsToAppear,
} from '../helpers/network-helpers.js';

const SIMPLE_PAGE_REQUEST_NUMBER = 2;
const SIMPLE_PAGE_URL = `requests.html?num=${SIMPLE_PAGE_REQUEST_NUMBER}`;

describe('The Network Request view', async () => {
  async function assertOutlineMatches(expectedPatterns: string[], outline: ElementHandle<Element>[]) {
    const regexpSpecialChars = /[-\/\\^$*+?.()|[\]{}]/g;
    const errors = [];
    for (const item of outline) {
      const actualText = await item.evaluate(el => el.textContent || '');
      const expectedPattern = expectedPatterns.shift();
      if (expectedPattern) {
        if (!actualText.match(new RegExp(expectedPattern.replace(regexpSpecialChars, '\\$&').replace(/%/g, '.*')))) {
          errors.push(`${expectedPattern} != ${actualText}`);
        }
        // assert.match(actualText, new RegExp(expectedPattern.replace(regexpSpecialChars, '\\$&').replace(/%/g, '.*')));
      } else {
        // assert.fail('Unexpected text: ' + actualText);
        errors.push(`Unexpected text:  ${actualText}`);
      }
    }
    assert.strictEqual('', errors.join('\n'));
  }

  it('shows request headers and payload', async () => {
    await navigateToNetworkTab('headers-and-payload.html');

    await waitForSomeRequestsToAppear(2);

    await selectRequestByName('image.svg?id=42&param=a%20b');

    const networkView = await waitFor('.network-item-view');
    const headersTabHeader = await waitFor('[aria-label=Headers][role="tab"]', networkView);
    await click(headersTabHeader);
    await waitFor('[aria-label=Headers][role=tab][aria-selected=true]', networkView);
    const headersView = await waitFor('.request-headers-view');
    const headersOutline = await $$('[role=treeitem]:not(.hidden)', headersView);
    const expectedHeadersContent = [
      'General',
      [
        'Request URL: https://localhost:%/test/e2e/resources/network/image.svg?id=42&param=a%20b',
        'Request Method: POST',
        'Status Code: 200 OK',
        'Remote Address: [::1]:%',
        'Referrer Policy: strict-origin-when-cross-origin',
      ],
      'Response Headers (7)View source',
      [
        'Cache-Control: max-age=%',
        'Connection: keep-alive',
        'Content-Type: image/svg+xml; charset=utf-8',
        'Date: %',
        'Keep-Alive: timeout=5',
        'Transfer-Encoding: chunked',
        'Vary: Origin',
      ],
      'Request Headers (17)View source',
      [
        'accept: */*',
        'Accept-Encoding: gzip, deflate, br',
        'Accept-Language: en-US',
        'Connection: keep-alive',
        'Content-Length: 32',
        'content-type: application/x-www-form-urlencoded;charset=UTF-8',
        'Host: localhost:%',
        'Origin: https://localhost:%',
        'Referer: https://localhost:%/test/e2e/resources/network/headers-and-payload.html',
        'sec-ch-ua',
        'sec-ch-ua-mobile: ?0',
        'sec-ch-ua-platform',
        'Sec-Fetch-Dest: empty',
        'Sec-Fetch-Mode: cors',
        'Sec-Fetch-Site: same-origin',
        'User-Agent: Mozilla/5.0 %',
        'x-same-domain: 1',
      ],
    ].flat();

    await assertOutlineMatches(expectedHeadersContent, headersOutline);

    const payloadTabHeader = await waitFor('[aria-label=Payload][role="tab"]', networkView);
    await click(payloadTabHeader);
    await waitFor('[aria-label=Payload][role=tab][aria-selected=true]', networkView);
    const payloadView = await waitFor('.request-payload-view');
    const payloadOutline = await $$('[role=treeitem]:not(.hidden)', payloadView);
    const expectedPayloadContent = [
      'Query String Parameters (2)view sourceview URL-encoded',
      ['id: 42', 'param: a b'],
      'Form Data (4)view sourceview URL-encoded',
      [
        'foo: alpha',
        'bar: beta:42:0',
        'baz: ',
        '(empty)',
      ],
    ].flat();

    await assertOutlineMatches(expectedPayloadContent, payloadOutline);
  });
});
