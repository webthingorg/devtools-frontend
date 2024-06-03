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
    await enableExperiment('timeline-observations');
  });

  // Flaky on mac
  it('displays live metrics', async () => {
    const {target, frontend} = await getBrowserAndPages();

    await navigateToPerformanceTab();

    await target.bringToFront();

    const targetSession = await target.createCDPSession();
    await targetSession.send('PerformanceTimeline.enable', {eventTypes: ['largest-contentful-paint']});
    const lcpPromise = new Promise<void>(resolve => {
      targetSession.on('PerformanceTimeline.timelineEventAdded', (data) => {
        if (data.event.lcpDetails) {
          resolve();
        }
      });
    });

    await goToResource('performance/fake-website.html');
    await lcpPromise;
    await target.click('div.container');
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await frontend.bringToFront();

    const liveLcpDataElem = await waitFor('.lcp-data');
    const lcpText = await liveLcpDataElem.evaluate(el => el.textContent) || '';
    assert.match(lcpText, /LCP:/);

    const liveClsDataElem = await waitFor('.cls-data');
    const clsText = await liveClsDataElem.evaluate(el => el.textContent) || '';
    assert.match(clsText, /CLS:/);

    const liveInpDataElem = await waitFor('.inp-data');
    const inpText = await liveInpDataElem.evaluate(el => el.textContent) || '';
    assert.match(inpText, /INP:/);
  });

  // Flaky on mac
  it.skipOnPlatforms(['mac'], '[crbug.com/344543189] displays live metrics after the page already loaded', async () => {
    const {target, frontend} = await getBrowserAndPages();

    await target.bringToFront();
    await goToResource('performance/fake-website.html');
    await target.click('div.container');
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await target.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    const session = await target.createCDPSession();
    try {
      await session.send('Runtime.enable');
      const executionContextPromise = new Promise(r => session.once('Runtime.executionContextCreated', r));

      // Switch to the performance panel using internal JS because the inspector tab
      // is hidden at this point in the test.
      await frontend.evaluate(`
        (async () => {
          const UI = await import('./ui/legacy/legacy.js');
          await UI.ViewManager.ViewManager.instance().showView('timeline');
        })();
      `);

      // An execution context will be created once the web vitals library has been injected
      await executionContextPromise;

      await frontend.bringToFront();

      const liveLcpDataElem = await waitFor('.lcp-data');
      const lcpText = await liveLcpDataElem.evaluate(el => el.textContent) || '';
      assert.match(lcpText, /LCP:/);

      const liveClsDataElem = await waitFor('.cls-data');
      const clsText = await liveClsDataElem.evaluate(el => el.textContent) || '';
      assert.match(clsText, /CLS:/);

      const liveInpDataElem = await waitFor('.inp-data');
      const inpText = await liveInpDataElem.evaluate(el => el.textContent) || '';
      assert.match(inpText, /INP:/);
    } finally {
      await session.detach();
    }
  });
});
