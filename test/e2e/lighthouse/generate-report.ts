// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import * as puppeteer from 'puppeteer';

import {$, click, getBrowserAndPages, resetPages, resourcesPath, waitFor} from '../../shared/helper.js';

export async function navigateToLighthouseTab(target: puppeteer.Page, testName: string) {
  await target.goto(`${resourcesPath}/lighthouse/${testName}.html`);
  await click('#tab-lighthouse');
  // Make sure the lighthouse start view is shown
  await waitFor('.lighthouse-start-view');
}

describe('The Application Tab', async () => {
  beforeEach(async () => {
    await resetPages();
  });

  it('shows a button to generate a new report', async () => {
    const {target} = getBrowserAndPages();
    await navigateToLighthouseTab(target, 'empty');

    const button = await $('.lighthouse-start-view .primary-button');
    const disabledProperty = await button.getProperty('disabled');
    const disabled = await disabledProperty.jsonValue();
    assert.isFalse(disabled, 'The Generate Report button should not be disabled.');
  });

  it('shows cookies even when navigating to an unreachable page', async () => {
    const {target} = getBrowserAndPages();
    await navigateToLighthouseTab(target, 'empty');

    await target.goto(`${resourcesPath}/unreachable.rawresponse`);

    const button = await $('.lighthouse-start-view .primary-button');
    const disabledProperty = await button.getProperty('disabled');
    const disabled = await disabledProperty.jsonValue();
    assert.isTrue(disabled, 'The Generate Report button should be disabled.');
  });
});
