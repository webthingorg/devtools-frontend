// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {assertNotNullOrUndefined} from '../../../../../../../front_end/core/platform/platform.js';
import * as InlineEditor from '../../../../../../../front_end/ui/legacy/components/inline_editor/inline_editor.js';
import {assertShadowRoot, renderElementIntoDOM} from '../../../../helpers/DOMHelpers.js';
import {describeWithLocale} from '../../../../helpers/EnvironmentHelpers.js';

const {assert} = chai;

function assertSwatch(swatch: InlineEditor.AnimationNameSwatch.AnimationNameSwatch, expected: {
  animationName: string|null,
  isDefined: boolean,
}) {
  assertShadowRoot(swatch.shadowRoot);
  const container = swatch.shadowRoot.querySelector('span');
  assertNotNullOrUndefined(container);

  const link = container.querySelector('.css-var-link');
  assertNotNullOrUndefined(link);

  assert.strictEqual(
      container.getAttribute('title'), expected.animationName, 'The animation name appears as a tooltip');
  assert.strictEqual(
      link.classList.contains('undefined'), !expected.isDefined,
      'The link only has the class undefined when the property is undefined');
  assert.strictEqual(link.getAttribute('title'), expected.animationName, 'The link has the right tooltip');
  assert.strictEqual(link.textContent, expected.animationName, 'The link has the right text content');
}

describeWithLocale('AnimationNameSwatch', () => {
  it('can be instantiated successfully', () => {
    const component = new InlineEditor.AnimationNameSwatch.AnimationNameSwatch();
    renderElementIntoDOM(component);

    assert.instanceOf(component, HTMLElement, 'The swatch is an instance of HTMLElement');
  });

  it('renders a simple animation name', () => {
    const component = new InlineEditor.AnimationNameSwatch.AnimationNameSwatch();
    renderElementIntoDOM(component);
    component.data = {
      animationName: 'test',
      isDefined: true,
      onLinkActivate: () => {},
    };

    assertSwatch(component, {
      animationName: 'test',
      isDefined: true,
    });
  });

  it('renders a missing animation name', () => {
    const component = new InlineEditor.AnimationNameSwatch.AnimationNameSwatch();
    renderElementIntoDOM(component);
    component.data = {
      animationName: 'test',
      isDefined: false,
      onLinkActivate: () => {},
    };

    assertSwatch(component, {
      animationName: 'test',
      isDefined: false,
    });
  });
});
