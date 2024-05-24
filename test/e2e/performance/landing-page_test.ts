// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {
  enableExperiment,
  getBrowserAndPages,
  goToResource,
  waitFor,
} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  navigateToPerformanceTab,
} from '../helpers/performance-helpers.js';

describe('The Performance panel landing page', () => {
  beforeEach(async () => {
    await enableExperiment('perf-panel-observations');
  });

  it('displays live metrics', async () => {
    const {target, frontend} = await getBrowserAndPages();

    await navigateToPerformanceTab();

    await target.bringToFront();
    await goToResource('performance/fake-website.html');
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await frontend.bringToFront();

    const liveLcpDataElem = await waitFor('.lcp-data');
    const lcpText = await liveLcpDataElem.evaluate(el => el.textContent) || '';
    assert.match(lcpText, /LCP:/);

    const liveClsDataElem = await waitFor('.cls-data');
    const clsText = await liveClsDataElem.evaluate(el => el.textContent) || '';
    assert.match(clsText, /CLS:/);
  });

  // The following test "works" but it requires some hacks to get around the fact that
  // only one of the frontend or target page can be visible at a given time. This could
  // theoretically happen in the real world.
  //
  // TODO: I believe we could patch the web-vitals library so that metrics are reported even
  // if the page his hidden.
  // eslint-disable-next-line rulesdir/check_test_definitions
  it.skip('displays live metrics after the page already loaded', async () => {
    const {target, frontend} = await getBrowserAndPages();

    await target.bringToFront();
    await goToResource('performance/fake-website.html');

    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    await frontend.evaluate(`
      (async () => {
        const {ViewManager} = await import('./ui/legacy/ViewManager.js');
        await ViewManager.instance().showView('timeline');
      })();
    `);

    await new Promise(r => {
      setTimeout(r, 1000);
    });

    await frontend.bringToFront();
    await navigateToPerformanceTab();

    const liveLcpDataElem = await waitFor('.lcp-data');
    const lcpText = await liveLcpDataElem.evaluate(el => el.textContent) || '';
    assert.match(lcpText, /LCP:/);

    const liveClsDataElem = await waitFor('.cls-data');
    const clsText = await liveClsDataElem.evaluate(el => el.textContent) || '';
    assert.match(clsText, /CLS:/);
  });
});
