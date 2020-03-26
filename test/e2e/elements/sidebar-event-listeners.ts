// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assert} from 'chai';
import {describe, it} from 'mocha';

import {doubleClick, getBrowserAndPages, resetPages, resourcesPath} from '../../shared/helper.js';
import {assertContentOfSelectedElementsNode, getAndAssertTextOnEventListenerNode, getDisplayedEventListenerNames, getEventListenerProperties, openEventListenersPaneAndWaitForListeners, waitForElementsStyleSection} from '../helpers/elements-helpers.js';

describe('Event listeners in the elements sidebar', async () => {
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

  it('lists the active event listeners on the page', async () => {
    await openEventListenersPaneAndWaitForListeners();

    const eventListenerNames = await getDisplayedEventListenerNames();
    assert.deepEqual(eventListenerNames, ['click', 'custom event', 'hover']);
  });

  it('shows the event listener properties when expanding it', async () => {
    await openEventListenersPaneAndWaitForListeners();

    const clickEventSelector =
        await getAndAssertTextOnEventListenerNode('[aria-label="click, event listener"]', 'button#test-button');

    // we have to double click on the event to expand it
    // as single click reveals it in the elements tree
    await doubleClick(clickEventSelector);

    const clickEventPropertiesSelector = `${clickEventSelector} + ol .name-and-value`;
    const propertiesOutput = await getEventListenerProperties(clickEventPropertiesSelector);

    assert.deepEqual(propertiesOutput, [
      ['useCapture', 'false'],
      ['passive', 'false'],
      ['once', 'false'],
      ['handler', '() => {}'],
    ]);
  });

  it('shows custom event listeners and their properties correctly', async () => {
    await openEventListenersPaneAndWaitForListeners();

    const bodyEventSelector =
        await getAndAssertTextOnEventListenerNode('[aria-label="custom event, event listener"]', 'body');

    // we have to double click on the event to expand it
    // as single click reveals it in the elements tree
    await doubleClick(bodyEventSelector);

    const customEventProperties = `${bodyEventSelector} + ol .name-and-value`;
    const propertiesOutput = await getEventListenerProperties(customEventProperties);

    assert.deepEqual(propertiesOutput, [
      ['useCapture', 'true'],
      ['passive', 'false'],
      ['once', 'true'],
      ['handler', '() => console.log(\'test\')'],
    ]);
  });
});
