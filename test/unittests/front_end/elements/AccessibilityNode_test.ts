
// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ElementsModule from '../../../../front_end/elements/elements.js';
import {assertShadowRoot, renderElementIntoDOM} from '../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';

const {assert} = chai;

const makeAXNode = (overrides: {}) => {
  const tree = new ElementsModule.AccessibilityTree.AccessibilityTree();
  const axNode: ElementsModule.AccessibilityTreeUtils.AXNode = {
    id: '0',
    parent: null,
    role: 'WebArea',
    name: '',
    ignored: false,
    numChildren: 0,
    children: [],
    hasUnloadedChildren: false,
    parentAXTree: tree,
    ...overrides,
  };

  return axNode;
};

describeWithEnvironment('AccessibilityTree', async () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../front_end/elements/elements.js');
  });

  function assertAXNodeContent(component: HTMLElement, expectedContent: string): void {
    assertShadowRoot(component.shadowRoot);
    const content = Array.from(component.shadowRoot.querySelectorAll('span')).map(span => span.textContent).join('');
    assert.strictEqual(content, expectedContent);
  }

  it('renders AXNode WebArea', async () => {
    const webArea = makeAXNode({role: 'button'});
    // eslint-disable-next-line no-console
    console.log(webArea);
    const component = new Elements.AccessibilityNode.AccessibilityNode();
    renderElementIntoDOM(component);
    component.data = {
      axNode: webArea,
    };
    assertAXNodeContent(component, 'WebArea');
  });
});
