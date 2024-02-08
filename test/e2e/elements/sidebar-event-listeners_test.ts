// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {getBrowserAndPages} from '../../conductor/puppeteer-state.js';
import {waitFor} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getDisplayedEventListenerNames,
  getEventListenerProperties,
  getFirstNodeForEventListener,
  loadEventListenersAndSelectButtonNode,
  openEventListenersPaneAndWaitForListeners,
} from '../helpers/event-listeners-helpers.js';

describe('Event listeners in the elements sidebar', async () => {
  beforeEach(async () => {
    await loadEventListenersAndSelectButtonNode();
  });

  it('lists the active event listeners on the page', async done => {
    setTimeout(done, 9000);
    // eslint-disable-line no-console
    console.log('before all');
    await openEventListenersPaneAndWaitForListeners();
    // eslint-disable-line no-console
    console.log('after open pane, wait for listeners');

    const eventListenerNames = await getDisplayedEventListenerNames();
    // eslint-disable-line no-console
    console.log('after get names');
    assert.deepEqual(eventListenerNames, ['click', 'custom event', 'hover']);
    // eslint-disable-line no-console
    console.log('after assert');
  });

  it('shows the event listener properties when expanding it', async done => {
    setTimeout(done, 9000);
    // eslint-disable-line no-console
    console.log('start');
    const {frontend} = getBrowserAndPages();
    // eslint-disable-line no-console
    console.log('after get browser and pages');
    await openEventListenersPaneAndWaitForListeners();
    // eslint-disable-line no-console
    console.log('after pane and listeners');
    const {
      firstListenerText,
      listenerSelector,
    } = await getFirstNodeForEventListener('[aria-label="click, event listener"]');
    // eslint-disable-line no-console
    console.log('after get node for listener');

    // check that we have the right event for the right element
    // we can't use assert.strictEqual() as the text also includes the "Remove" button
    assert.include(firstListenerText, 'button#test-button');

    // we have to use keyboard navigation here to expand
    // the event, as single click reveals it in the elements
    // tree and double click triggers the "Remove" button on
    // some platforms.
    await frontend.keyboard.press('ArrowRight');  // select
    // eslint-disable-line no-console
    console.log('after 1st arrow right');
    await frontend.keyboard.press('ArrowRight');  // expand
    // eslint-disable-line no-console
    console.log('after 2nd arrow right');
    await waitFor(`${listenerSelector}[aria-expanded="true"]`);
    // eslint-disable-line no-console
    console.log('after listener selection');

    const clickEventPropertiesSelector = `${listenerSelector} + ol .name-and-value`;
    const propertiesOutput = await getEventListenerProperties(clickEventPropertiesSelector);
    // eslint-disable-line no-console
    console.log('after  listener properties');

    assert.deepEqual(propertiesOutput, [
      ['useCapture', 'false'],
      ['passive', 'false'],
      ['once', 'false'],
      ['handler', '() => {}'],
    ]);
    // eslint-disable-line no-console
    console.log('end');
  });

  it('shows custom event listeners and their properties correctly', async done => {
    setTimeout(done, 9000);
    // eslint-disable-line no-console
    console.log('before all');
    const {frontend} = getBrowserAndPages();
    await openEventListenersPaneAndWaitForListeners();
    // eslint-disable-line no-console
    console.log('after open pain, wait for listeners');
    const {
      firstListenerText,
      listenerSelector,
    } = await getFirstNodeForEventListener('[aria-label="custom event, event listener"]');
    // eslint-disable-line no-console
    console.log('after get first node');

    // check that we have the right event for the right element
    // we can't use assert.strictEqual() as the text also includes the "Remove" button
    assert.include(firstListenerText, 'body');

    // we have to use keyboard navigation here to expand
    // the event, as single click reveals it in the elements
    // tree and double click triggers the "Remove" button on
    // some platforms.
    await frontend.keyboard.press('ArrowRight');  // select
    // eslint-disable-line no-console
    console.log('after right press');
    await frontend.keyboard.press('ArrowRight');  // expand
    // eslint-disable-line no-console
    console.log('after another right press');
    await waitFor(`${listenerSelector}[aria-expanded="true"]`);
    // eslint-disable-line no-console
    console.log('after listener select');

    const customEventProperties = `${listenerSelector} + ol .name-and-value`;
    const propertiesOutput = await getEventListenerProperties(customEventProperties);
    // eslint-disable-line no-console
    console.log('after event listener properties');

    assert.deepEqual(propertiesOutput, [
      ['useCapture', 'true'],
      ['passive', 'false'],
      ['once', 'true'],
      ['handler', '() => console.log(\'test\')'],
    ]);
    // eslint-disable-line no-console
    console.log('end');
  });
});
