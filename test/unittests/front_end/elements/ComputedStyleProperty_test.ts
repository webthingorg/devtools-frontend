// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {ComputedStyleProperty} from '../../../../front_end/elements/ComputedStyleProperty.js';
import {assertShadowRoot, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describe('ComputedStyleProperty', () => {
  it('renders inherited vs. non-inherited property correctly', () => {
    const component = new ComputedStyleProperty();
    renderElementIntoDOM(component);
    const data = {
      inherited: true,
      expanded: false,
      onNavigateToSource: () => {},
    };
    component.data = data;

    assertShadowRoot(component.shadowRoot);
    const inheritedSlots = Array.from(component.shadowRoot.querySelectorAll('.inherited slot'));
    assert.deepEqual(
        inheritedSlots.map(slot => slot.getAttribute('name')),
        [
          'property-name',
          'property-value',
        ],
        'should contain name and value slots under .inherited selector');

    data.inherited = false;
    component.data = data;
    const nonInheritedSlots = Array.from(component.shadowRoot.querySelectorAll('details summary slot'));
    assert.deepEqual(
        nonInheritedSlots.map(slot => slot.getAttribute('name')),
        [
          'property-name',
          'property-value',
        ],
        'should contain name and value slots under details summary selector');
  });

  it('renders expanded vs. collapsed property correctly', () => {
    const component = new ComputedStyleProperty();
    renderElementIntoDOM(component);
    const data = {
      inherited: false,
      expanded: true,
      onNavigateToSource: () => {},
    };
    component.data = data;

    assertShadowRoot(component.shadowRoot);
    const detailsElement = component.shadowRoot.querySelector('details');
    if (!detailsElement) {
      assert.fail('non-inherited property should be wrapped in a <details> element');
      return;
    }
    const summaryElement = component.shadowRoot.querySelector('summary');
    if (!summaryElement) {
      assert.fail('non-inherited property should contain a <summary> element');
      return;
    }

    assert.isTrue(detailsElement.open, 'details tag should be open when the property is expanded');

    data.expanded = false;
    component.data = data;
    assert.isFalse(detailsElement.open, 'details tag should not be open when the property is collapsed');

    summaryElement.click();
    assert.isTrue(component.isExpanded(), 'component should be expanded after clicking while closed');
    assert.isTrue(detailsElement.open, 'details tag should be open after clicking while closed');
  });

  it('renders a clickable goto icon when it contains traces', () => {
    const component = new ComputedStyleProperty();
    renderElementIntoDOM(component);
    let isClicked = false;
    const data = {
      inherited: false,
      expanded: false,
      onNavigateToSource: () => {
        isClicked = true;
      },
    };
    component.data = data;

    assertShadowRoot(component.shadowRoot);
    const goto: HTMLElement|null = component.shadowRoot.querySelector('.goto');
    assert.exists(goto);
    goto !.click();
    assert.isTrue(isClicked, 'goto icon should be clickable');
  });
});
