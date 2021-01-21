// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../front_end/elements/elements.js';
import {assertShadowRoot, dispatchClickEvent, renderElementIntoDOM} from '../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';

const {assert} = chai;

interface MakeAXNodeOptions extends Partial<ElementsModule.AccessibilityTreeUtils.AXNode> {
  attributes?: {[x: string]: string}
}

const makeAXNode = (overrides: MakeAXNodeOptions = {}) => {
  const axNode: ElementsModule.AccessibilityTreeUtils.AXNode = {
    id: '',
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

  describe('render node text', () => {
    it('returns WebArea for root node', async () => {
      const node = makeAXNode({role: 'WebArea'});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assertAXNodeContent(component, 'WebArea');
    });

    it('returns the node role and name', () => {
      const node = makeAXNode({role: 'button', name: 'Click Me'});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assertAXNodeContent(component, 'button\xA0"Click Me"');
    });

    it('ignored node displays as Ignored', () => {
      const node = makeAXNode({role: 'presentation', ignored: true});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assertAXNodeContent(component, 'Ignored');
    });
  });

  describe('unloaded children', () => {
    it('returns expanded = false', () => {
      const node = makeAXNode({role: 'paragraph', name: 'text', hasOnlyUnloadedChildren: true});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assert.strictEqual(component.getExpanded(), false);
      assert.isFalse(component.classList.contains('expanded'));
    });

    it('returns no children', () => {
      const node = makeAXNode({role: 'paragraph', name: 'text', hasOnlyUnloadedChildren: true});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assert.strictEqual(node.numChildren, 0);
      assert.strictEqual(component.children.length, 0);
    });
  });

  describe('ancestor chain of a parent with one child', () => {
    it('parent button has one text child', () => {
      const childNode = makeAXNode({role: 'text', name: 'me'});
      const parentNode = makeAXNode({
        role: 'button',
        name: 'click',
        children: [childNode],
        numChildren: 1,
      });
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assert.strictEqual(parentNode.children.length, 1);
      assert.isTrue(component.classList.contains('parent'));
    });
  });

  describe('click behaviour of accessibility nodes', () => {
    it('expanded class is toggled on click', () => {
      const node = makeAXNode({role: 'paragraph', name: 'text', numChildren: 1});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assert.strictEqual(component.getExpanded(), true);
      assert.isTrue(component.classList.contains('expanded'));

      dispatchClickEvent(component);
      assert.strictEqual(component.getExpanded(), false);
      assert.isFalse(component.classList.contains('expanded'));

      dispatchClickEvent(component);
      assert.strictEqual(component.getExpanded(), true);
      assert.isTrue(component.classList.contains('expanded'));
    });
  });
});
