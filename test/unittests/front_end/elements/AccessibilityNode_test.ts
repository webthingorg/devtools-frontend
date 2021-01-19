// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../front_end/elements/elements.js';
import {assertElement, assertElements, assertShadowRoot, dispatchClickEvent, doubleRaf, renderElementIntoDOM, waitForScrollLeft} from '../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';
import {withNoMutations} from '../helpers/MutationHelpers.js';

const {assert} = chai;

interface MakeAXNodeOptions extends Partial<ElementsModule.AccessibilityTreeUtils.AXNode> {
  attributes?: {[x: string]: string}
}

const makeAXNode = (overrides: MakeAXNodeOptions = {}) => {
  // make a fake test node here --> inject mock SDK.
  const axNode: ElementsModule.AccessibilityTreeUtils.AXNode = {
    id: '1',
    role: '',
    name: '',
    ignored: false,
    parent: null,
    children: [],
    numChildren: 0,
    hasOnlyUnloadedChildren: false,
    ...overrides,
  };
  return axNode;
};

describeWithEnvironment('AccessibilityTree', () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../front_end/elements/elements.js');
  });

  function assertAXNodeContent(component: HTMLElement, expected: string): void {
    assertShadowRoot(component.shadowRoot);
    const content = Array.from(component.shadowRoot.querySelectorAll('span')).map(span => span.textContent).join('');
    assert.strictEqual(content, expected);
  }

  describe('#determineNodeText', () => {
    it('returns WebArea for root node', async () => {
      const node = makeAXNode({role: 'WebArea'});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      // assert(false);
      assertAXNodeContent(component, 'WebArea');
    });

    it('returns the node role', () => {
      const node = makeAXNode({role: 'generic'});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assertAXNodeContent(component, 'generic');
    });
  });
});
