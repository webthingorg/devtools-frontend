// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';

import {click} from '../../shared/helper.js';
import {describe, it} from '../../shared/mocha-extensions.js';
import {
  getDisplayedEventListenerNames,
  getFirstNodeForEventListener,
  loadEventListenersAndSelectButtonNode,
  openEventListenersPaneAndWaitForListeners,
} from '../helpers/event-listeners-helpers.js';

describe('Removing event listeners in the elements sidebar', async () => {
  beforeEach(async () => {
    await loadEventListenersAndSelectButtonNode();
  });

  it('shows "Remove" by each node for a given event', async done => {
    setTimeout(done, 9000);
    console.error('before all');
    await openEventListenersPaneAndWaitForListeners();
    console.error('after open pane, wait for listeners');
    const {
      firstListenerText,
      listenerSelector,
    } = await getFirstNodeForEventListener('[aria-label="click, event listener"]');
    console.error('after get first node for listener');

    // check that we have the right event for the right element
    // and that it has the "Remove" button within it
    assert.include(firstListenerText, 'button#test-button');
    assert.include(firstListenerText, 'Remove');
    console.error('after asserts');

    const removeButtonSelector = `${listenerSelector} .event-listener-button`;
    await click(removeButtonSelector);
    console.error('after click');

    // now we can check that the 'click' event is gone
    const eventListenerNames = await getDisplayedEventListenerNames();
    console.error('after displayed listener names');
    assert.deepEqual(eventListenerNames, ['custom event', 'hover']);
  });
});
