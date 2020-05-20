// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {getBrowserAndPages} from '../../shared/helper.js';
import {getAllRequestNames, getSelectedRequestName, navigateToNetworkTab, selectRequest, waitForSelectedRequestChange, waitForSomeRequests} from '../helpers/network-helper.js';

const SIMPLE_PAGE_REQUEST_NUMBER = 10;
const SIMPLE_PAGE_URL = `requests.html?num=${SIMPLE_PAGE_REQUEST_NUMBER}`;

describe('The Network Tab', async () => {
  it('displays requests', async () => {
    const {target} = getBrowserAndPages();
    await navigateToNetworkTab(target, SIMPLE_PAGE_URL);

    // Wait for all the requets to be displayed + 1 to account for the page itself.
    await waitForSomeRequests(SIMPLE_PAGE_REQUEST_NUMBER + 1);

    const expectedNames = [SIMPLE_PAGE_URL];
    for (let i = 0; i < SIMPLE_PAGE_REQUEST_NUMBER; i++) {
      expectedNames.push(`image.svg?id=${i}`);
    }

    const names = await getAllRequestNames();
    assert.deepStrictEqual(names, expectedNames, 'The right request names should appear in the list');
  });

  it('can select requests', async () => {
    const {target} = getBrowserAndPages();
    await navigateToNetworkTab(target, SIMPLE_PAGE_URL);

    let selected = await getSelectedRequestName();
    assert.isUndefined(selected, 'No request should be selected by default');

    await selectRequest(0);
    await waitForSelectedRequestChange(selected);

    selected = await getSelectedRequestName();
    assert.strictEqual(selected, SIMPLE_PAGE_URL, 'Selecting the first request should work');

    await selectRequest(10);
    await waitForSelectedRequestChange(selected);

    selected = await getSelectedRequestName();
    assert.strictEqual(selected, 'image.svg?id=9', 'Selecting the last request should work');
  });
});
