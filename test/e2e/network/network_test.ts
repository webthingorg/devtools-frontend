// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type * as puppeteer from 'puppeteer-core';

import {$textContent, goTo, reloadDevTools, step, typeText, waitFor, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  clearTimeWindow,
  getAllRequestNames,
  getNumberOfRequests,
  getSelectedRequestName,
  navigateToNetworkTab,
  selectRequestByName,
  setCacheDisabled,
  setPersistLog,
  setTimeWindow,
  waitForSelectedRequestChange,
  waitForSomeRequestsToAppear,
} from '../helpers/network-helpers.js';

const SIMPLE_PAGE_REQUEST_NUMBER = 10;
const SIMPLE_PAGE_URL = `requests.html?num=${SIMPLE_PAGE_REQUEST_NUMBER}`;

async function openMoreFiltersDropdown() {
  const filterDropdown = await waitFor('[aria-label="Show/hide only requests dropdown"]');
  const filterButton = await waitFor('.toolbar-button', filterDropdown);
  await filterButton.click();
  return filterButton;
}

async function getFilter(label: string) {
  const filter = await $textContent(label);

  if (!filter) {
    assert.fail('Could not find this filter. Make sure the dropdown is open.');
  }
  return filter;
}

async function checkOpacityCheckmark(filter: puppeteer.ElementHandle, opacity: string) {
  const checkmarkOpacity = await filter.$eval('.checkmark', element => {
    return window.getComputedStyle(element).getPropertyValue('opacity');
  });

  return checkmarkOpacity === opacity;
}

async function getCategoryXHRFilter() {
  const filters = await waitFor('.filter-bitset-filter');
  const categoryXHRFilter = await $textContent('Fetch/XHR', filters);
  if (!categoryXHRFilter) {
    assert.fail('Could not find category XHR filter to click.');
  }
  return categoryXHRFilter;
}

describe('The Network Tab', async function() {
  // The tests here tend to take time because they wait for requests to appear in the request panel.
  this.timeout(5000);

  beforeEach(async () => {
    await navigateToNetworkTab('empty.html');
    await setCacheDisabled(true);
    await setPersistLog(false);
  });

  it('displays requests', async () => {
    await navigateToNetworkTab(SIMPLE_PAGE_URL);

    // Wait for all the requests to be displayed + 1 to account for the page itself.
    await waitForSomeRequestsToAppear(SIMPLE_PAGE_REQUEST_NUMBER + 1);

    const expectedNames = [];
    for (let i = 0; i < SIMPLE_PAGE_REQUEST_NUMBER; i++) {
      expectedNames.push(`image.svg?id=${i}`);
    }
    expectedNames.push(SIMPLE_PAGE_URL);

    const names = (await getAllRequestNames()).sort();
    assert.deepStrictEqual(names, expectedNames, 'The right request names should appear in the list');
  });

  it('can select requests', async () => {
    await navigateToNetworkTab(SIMPLE_PAGE_URL);

    let selected = await getSelectedRequestName();
    assert.isNull(selected, 'No request should be selected by default');

    await selectRequestByName(SIMPLE_PAGE_URL);
    await waitForSelectedRequestChange(selected);

    selected = await getSelectedRequestName();
    assert.strictEqual(selected, SIMPLE_PAGE_URL, 'Selecting the first request should work');

    const lastRequestName = `image.svg?id=${SIMPLE_PAGE_REQUEST_NUMBER - 1}`;
    await selectRequestByName(lastRequestName);
    await waitForSelectedRequestChange(selected);

    selected = await getSelectedRequestName();
    assert.strictEqual(selected, lastRequestName, 'Selecting the last request should work');
  });

  it('can persist requests', async () => {
    await navigateToNetworkTab(SIMPLE_PAGE_URL);

    // Wait for all the requests to be displayed + 1 to account for the page itself, and get their names.
    await waitForSomeRequestsToAppear(SIMPLE_PAGE_REQUEST_NUMBER + 1);
    const firstPageRequestNames = (await getAllRequestNames()).sort();

    await setPersistLog(true);

    // Navigate to a new page, and wait for the same requests to still be there.
    await goTo('about:blank');
    await waitForSomeRequestsToAppear(SIMPLE_PAGE_REQUEST_NUMBER + 1);
    let secondPageRequestNames: (string|null)[] = [];
    await waitForFunction(async () => {
      secondPageRequestNames = await getAllRequestNames();
      return secondPageRequestNames.length === SIMPLE_PAGE_REQUEST_NUMBER + 1;
    });
    secondPageRequestNames.sort();

    assert.deepStrictEqual(secondPageRequestNames, firstPageRequestNames, 'The requests were persisted');
  });

  it('persists filters across a reload', async () => {
    await navigateToNetworkTab(SIMPLE_PAGE_URL);
    let filterInput = await waitFor('.filter-input-field.text-prompt');
    filterInput.focus();
    await typeText('foo');
    let categoryXHRFilter = await getCategoryXHRFilter();
    await categoryXHRFilter.click();

    await reloadDevTools({selectedPanel: {name: 'network'}});
    filterInput = await waitFor('.filter-input-field.text-prompt');
    const filterText = await filterInput.evaluate(x => (x as HTMLElement).innerText);
    assert.strictEqual(filterText, 'foo');

    categoryXHRFilter = await getCategoryXHRFilter();
    const xhrHasSelectedClass = await categoryXHRFilter.evaluate(x => x.classList.contains('selected'));
    assert.isTrue(xhrHasSelectedClass);
  });

  it('can show only third-party requests', async () => {
    await navigateToNetworkTab('third-party-resources.html');
    await waitForSomeRequestsToAppear(3);

    await openMoreFiltersDropdown();

    const thirdPartFilter = await getFilter('3rd-party requests');

    let names = await getAllRequestNames();

    await step('verify the dropdown state and the requests when 3rd-part filter is selected', async () => {
      await thirdPartFilter.click();
      assert.isTrue(await checkOpacityCheckmark(thirdPartFilter, '1'));

      names = await getAllRequestNames();
      assert.deepEqual(1, names.length);
      assert.deepStrictEqual(names, ['external_image.svg'], 'The right request names should appear in the list');
    });

    await step('verify the dropdown state and the requests when 3rd-party filter is deselected', async () => {
      await thirdPartFilter.click();
      assert.isTrue(await checkOpacityCheckmark(thirdPartFilter, '0'));

      names = await getAllRequestNames();
      assert.deepEqual(3, names.length);
      assert.deepStrictEqual(
          names, ['third-party-resources.html', 'image.svg', 'external_image.svg'],
          'The right request names should appear in the list');
    });

  });

  it('should continue receiving new requests after timeline filter is cleared', async () => {
    await navigateToNetworkTab('infinite-requests.html');
    await waitForSomeRequestsToAppear(2);

    await setTimeWindow();
    // After the time filter is set, only visible request is the html page.
    assert.strictEqual(await getNumberOfRequests(), 1);
    await clearTimeWindow();
    const numberOfRequestsAfterFilter = await getNumberOfRequests();
    // Time filter is cleared so the number of requests must be greater than 1.
    assert.isTrue(numberOfRequestsAfterFilter > 1);

    // After some time we expect new requests to come so it must be
    // that the number of requests increased.
    await waitForSomeRequestsToAppear(numberOfRequestsAfterFilter + 1);
  });
});
