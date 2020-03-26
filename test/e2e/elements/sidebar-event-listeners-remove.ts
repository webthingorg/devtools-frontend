// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';
import {$, click, getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, getDisplayedEventListenerNames, openEventListenersPaneAndWaitForListeners, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

describe('Removing event listeners in the elements sidebar', async () => {
  beforeEach(async () => {
    await resetPages();

    const {target, frontend} = getBrowserAndPages();
    await target.goto(`${resourcesPath}/elements/sidebar-event-listeners.html`);
    await waitForElementsStyleSection();

    // Sanity check to make sure we have the correct node selected after opening a file
    await assertContentOfSelectedElementsNode('<body>\u200B');

    // Select the button that has the events and make sure it's selected
    await frontend.keyboard.press('ArrowRight');
    await assertContentOfSelectedElementsNode('<button id=\u200B"test-button">\u200Bhello world\u200B</button>\u200B');
  });

  it('shows "Remove" by each node for a given event', async () => {
    await openEventListenersPaneAndWaitForListeners();

    const clickListenerSelector = '[aria-label="click, event listener"]';
    await click(clickListenerSelector);

    const buttonClickEventSelector = `${clickListenerSelector} + ol>li`;
    const buttonClickEvent = await $(buttonClickEventSelector);
    const buttonClickEventText = await buttonClickEvent.evaluate(button => {
      return button.textContent;
    });

    // check that we have the right event for the right element
    // and that it has the "Remove" button within it
    assert.include(buttonClickEventText, 'button#test-button');
    assert.include(buttonClickEventText, 'Remove');

    const removeButtonSelector = `${buttonClickEventSelector} .event-listener-button`;
    await click(removeButtonSelector);

    // now we can check that the 'click' event is gone
    const eventListenerNames = await getDisplayedEventListenerNames();
    assert.deepEqual(eventListenerNames, ['custom event', 'hover']);
  });
});
