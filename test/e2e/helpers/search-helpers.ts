// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {$, $$, click, getBrowserAndPages, platform, waitFor} from '../../shared/helper.js';

const SEARCH_QUERY = '[aria-label="Search Query"]';
const SEARCH_RESULTS = '.search-results';
const SEARCH_FILE_RESULT = '.search-result';
const SEARCH_CHILDREN_RESULT = '.search-match-link';

export async function triggerFindDialog() {
  const {frontend} = getBrowserAndPages();

  switch (platform) {
    case 'mac':
      await frontend.keyboard.down('Meta');
      await frontend.keyboard.down('Alt');
      break;

    default:
      await frontend.keyboard.down('Control');
      await frontend.keyboard.down('Shift');
  }

  await frontend.keyboard.press('f');

  switch (platform) {
    case 'mac':
      await frontend.keyboard.up('Meta');
      await frontend.keyboard.up('Alt');
      break;

    default:
      await frontend.keyboard.up('Control');
      await frontend.keyboard.up('Shift');
  }

  await waitFor(SEARCH_QUERY);
}

export async function getInputElement() {
  return await $(SEARCH_QUERY);
}

export async function doSearchAndWaitForResults(text: string) {
  const query = await getInputElement();
  const inputElement = query.asElement();
  if (!inputElement) {
    assert.fail('Unable to find search input field');
    return;
  }

  const {frontend} = getBrowserAndPages();

  await inputElement.focus();
  await inputElement.type(text);
  await frontend.keyboard.press('Enter');

  const resultsContainer = await waitFor(SEARCH_RESULTS);
  await waitFor(SEARCH_FILE_RESULT, resultsContainer);
  return await $$(SEARCH_FILE_RESULT, resultsContainer);
}

export async function getMatchLinks() {
  return await $$(SEARCH_CHILDREN_RESULT, await $(SEARCH_RESULTS));
}

export async function doSearchAndClickMatchLinkAtIndex(text: string, index: number) {
  const results = await doSearchAndWaitForResults(text);
  if (!results) {
    assert.fail('Unable to find search results');
    return;
  }

  const links = await getMatchLinks();
  const link = [...(await links.getProperties())][index];
  if (!link || !link[1]) {
    assert.fail(`Unable to find search result at index ${index}`);
    return;
  }

  await click('.search-match-link', {root: link[1]});
  await waitFor('.panel[aria-label="sources"]');
}
