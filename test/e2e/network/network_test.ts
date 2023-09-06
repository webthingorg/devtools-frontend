// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import type * as puppeteer from 'puppeteer-core';

import {
  $textContent,
  goTo,
  reloadDevTools,
  step,
  typeText,
  waitFor,
  waitForFunction,
} from '../../shared/helper.js';
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

async function openRequestTypeDropdown() {
  const filterDropdown = await waitFor('[aria-label="Resource types to include"]');
  const filterButton = await waitFor('.toolbar-button', filterDropdown);
  await filterButton.click();
  return filterButton;
}

async function getCategoryTypeFilter(label: string) {
  const categoryTypeFilter = await $textContent(label);

  if (!categoryTypeFilter) {
    assert.fail('Could not find this category filter. Make sure the "Request types" dropdown is open.');
  }
  return categoryTypeFilter;
}

async function getThirdPartyFilter() {
  const filters = await waitFor('.filter-bar');
  const thirdPartyFilter = await $textContent('3rd-party requests', filters);
  if (!thirdPartyFilter) {
    assert.fail('Could not find category third-party filter to click.');
  }
  return thirdPartyFilter;
}

async function checkOpacityChekmark(categoryTypeFilter: puppeteer.ElementHandle, opacity: string) {
  const checkmarkOpacity = await categoryTypeFilter.$eval('.checkmark', element => {
    return window.getComputedStyle(element).getPropertyValue('opacity');
  });

  return checkmarkOpacity === opacity;
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

    await openRequestTypeDropdown();

    let categoryXHRFilter = await getCategoryTypeFilter('Fetch/XHR');
    assert.isTrue(await checkOpacityChekmark(categoryXHRFilter, '0'));

    await categoryXHRFilter.click();

    await reloadDevTools({selectedPanel: {name: 'network'}});
    filterInput = await waitFor('.filter-input-field.text-prompt');
    const filterText = await filterInput.evaluate(x => (x as HTMLElement).innerText);
    assert.strictEqual(filterText, 'foo');

    await openRequestTypeDropdown();

    categoryXHRFilter = await getCategoryTypeFilter('Fetch/XHR');

    assert.isTrue(await checkOpacityChekmark(categoryXHRFilter, '1'));
  });

  it('unchecks all filters and the all option is checked automatically - by checkmark opacity', async () => {
    await navigateToNetworkTab(SIMPLE_PAGE_URL);
    await waitForSomeRequestsToAppear(SIMPLE_PAGE_REQUEST_NUMBER);

    await openRequestTypeDropdown();

    const categoryXHRFilter = await getCategoryTypeFilter('Fetch/XHR');
    const categoryAllFilter = await getCategoryTypeFilter('All');

    let names = await getAllRequestNames();

    await step('verify the initial state when the "All" filter is selected', async () => {
      assert.isTrue(await checkOpacityChekmark(categoryXHRFilter, '0'));

      assert.deepEqual(11, names.length);
      assert.isTrue(names.includes('requests.html?num=10'));
    });

    await step('verify the dropdown state and the requests when XHR filter is selected', async () => {
      await categoryXHRFilter.click();

      assert.isTrue(await checkOpacityChekmark(categoryXHRFilter, '1'));
      assert.isTrue(await checkOpacityChekmark(categoryAllFilter, '0'));

      names = await getAllRequestNames();
      assert.deepEqual(10, names.length);
      assert.isFalse(names.includes('requests.html?num=10'));
    });

    await step('verify the dropdown state and the requests when XHR filter is deselected', async () => {
      await categoryXHRFilter.click();

      assert.isTrue(await checkOpacityChekmark(categoryXHRFilter, '0'));
      assert.isTrue(await checkOpacityChekmark(categoryAllFilter, '1'));

      names = await getAllRequestNames();
      assert.deepEqual(11, names.length);
      assert.isTrue(names.includes('requests.html?num=10'));
    });
  });

  it('can show only third-party requests', async () => {
    await navigateToNetworkTab('third-party-resources.html');

    let names = await getAllRequestNames();
    /* assert.deepStrictEqual(names, [], 'The right request names should appear in the list'); */
    const thirdPartyFilter = await getThirdPartyFilter();
    await thirdPartyFilter.click();

    names = await getAllRequestNames();
    assert.deepStrictEqual(names, ['external_image.svg'], 'The right request names should appear in the list');
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
