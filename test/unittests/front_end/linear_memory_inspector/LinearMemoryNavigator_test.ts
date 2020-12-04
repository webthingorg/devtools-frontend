// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as LinearMemoryInspector from '../../../../front_end/linear_memory_inspector/linear_memory_inspector.js';
import {assertElement, assertElements, assertShadowRoot, getElementWithinComponent, getEventPromise, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

export const NAVIGATOR_ADDRESS_SELECTOR = '[data-input]';
export const NAVIGATOR_PAGE_BUTTON_SELECTOR = '[data-button=page-navigation]';
export const NAVIGATOR_HISTORY_BUTTON_SELECTOR = '[data-button=history-navigation]';
export const NAVIGATOR_REFRESH_BUTTON_SELECTOR = '[data-button=refresh-requested]';

describe('LinearMemoryNavigator', () => {
  let component: LinearMemoryInspector.LinearMemoryNavigator.LinearMemoryNavigator;

  beforeEach(renderNavigator);

  function renderNavigator() {
    component = new LinearMemoryInspector.LinearMemoryNavigator.LinearMemoryNavigator();
    renderElementIntoDOM(component);

    component.data = {
      address: '20',
      valid: true,
      mode: LinearMemoryInspector.LinearMemoryNavigator.Mode.Submitted,
      error: undefined,
    };
  }

  async function assertNavigationEvents(eventType: string) {
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    const pageNavigationButtons = shadowRoot.querySelectorAll(`[data-button=${eventType}]`);
    assertElements(pageNavigationButtons, HTMLButtonElement);
    assert.lengthOf(pageNavigationButtons, 2);

    const navigation = [];
    for (const button of pageNavigationButtons) {
      const eventPromise =
          getEventPromise<LinearMemoryInspector.LinearMemoryNavigator.PageNavigationEvent>(component, eventType);
      button.click();
      const event = await eventPromise;
      navigation.push(event.data);
    }

    assert.deepEqual(navigation, [
      LinearMemoryInspector.LinearMemoryNavigator.Navigation.Backward,
      LinearMemoryInspector.LinearMemoryNavigator.Navigation.Forward,
    ]);
  }

  it('renders navigator address', async () => {
    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    const input = shadowRoot.querySelector(NAVIGATOR_ADDRESS_SELECTOR);
    assertElement(input, HTMLInputElement);
    assert.strictEqual(input.value, '20');
  });

  it('re-renders address on address change', async () => {
    component.data = {
      address: '16',
      valid: true,
      mode: LinearMemoryInspector.LinearMemoryNavigator.Mode.Submitted,
      error: undefined,
    };

    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    const input = shadowRoot.querySelector(NAVIGATOR_ADDRESS_SELECTOR);
    assertElement(input, HTMLInputElement);
    assert.strictEqual(input.value, '16');
  });

  it('sends event when clicking on refresh', async () => {
    const eventPromise = getEventPromise<LinearMemoryInspector.LinearMemoryNavigator.RefreshRequestedEvent>(
        component, 'refresh-requested');

    const shadowRoot = component.shadowRoot;
    assertShadowRoot(shadowRoot);
    const refreshButton = shadowRoot.querySelector(NAVIGATOR_REFRESH_BUTTON_SELECTOR);
    assertElement(refreshButton, HTMLButtonElement);
    refreshButton.click();

    assert.isNotNull(await eventPromise);
  });

  it('sends events when clicking previous and next page', async () => {
    await assertNavigationEvents('history-navigation');
  });

  it('sends events when clicking undo and redo', async () => {
    await assertNavigationEvents('page-navigation');
  });

  it('shows tooltip on hovering over address', async () => {
    const input = getElementWithinComponent(component, NAVIGATOR_ADDRESS_SELECTOR, HTMLInputElement);
    assert.strictEqual(input.title, 'Enter address');
  });

  it('shows tooltip with invalid address on hovering over address', async () => {
    const error = 'Address is invalid';
    component.data = {
      address: '60',
      valid: false,
      mode: LinearMemoryInspector.LinearMemoryNavigator.Mode.Submitted,
      error,
    };
    const input = getElementWithinComponent(component, NAVIGATOR_ADDRESS_SELECTOR, HTMLInputElement);
    assert.strictEqual(input.title, error);
  });
});
