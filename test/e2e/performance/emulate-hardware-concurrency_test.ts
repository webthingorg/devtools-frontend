// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getBrowserAndPages} from '../../conductor/puppeteer-state.js';
import {nonNull, waitForAria, waitForFunction} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {navigateToPerformanceTab, openCaptureSettings} from '../helpers/performance-helpers.js';

async function waitForChangedConcurrency(lastConcurrency: number|undefined) {
  const {target} = getBrowserAndPages();
  return waitForFunction(async () => {
    const newConcurrency = await target.evaluate('navigator.hardwareConcurrency');
    if (newConcurrency !== lastConcurrency) {
      return newConcurrency;
    }
    return undefined;
  });
}

describe('The Performance panel', () => {
  it('can emulate navigator.hardwareConcurrency', async () => {
    await navigateToPerformanceTab('empty');
    await openCaptureSettings('.timeline-settings-pane');

    let concurrency = await waitForChangedConcurrency(undefined);

    const input = await waitForAria('Hardware concurrency');
    const initialValue = Number(await input.evaluate(input => {
      return (input as HTMLInputElement).value;
    }));

    assert.deepEqual(initialValue, concurrency);

    await input.click({clickCount: 3});
    await input.type(`${initialValue + 1}`);
    concurrency = await waitForChangedConcurrency(concurrency);
    assert.deepEqual(concurrency, initialValue + 1);

    const button = nonNull(await waitForAria('Reset concurrency'));
    await button.click();

    concurrency = await waitForChangedConcurrency(concurrency);
    assert.deepEqual(concurrency, initialValue);
  });
});
