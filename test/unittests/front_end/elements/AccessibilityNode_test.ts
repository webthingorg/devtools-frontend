// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../front_end/platform/platform.js';
import type * as ElementsModule from '../../../../front_end/elements/elements.js';
import {assertElement, assertShadowRoot, dispatchKeyDownEvent, dispatchMouseOverEvent, dispatchMouseLeaveEvent, renderElementIntoDOM} from '../helpers/DOMHelpers.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';
import {withNoMutations} from '../helpers/MutationHelpers.js';

const {assert} = chai;

const makeAXNode = (overrides: Partial<ElementsModule.AccessibilityTreeUtils.AXNode> = {}) => {
  const axNode: ElementsModule.AccessibilityTreeUtils.AXNode = {
    id: '',
    role: '',
    name: '',
    ignored: false,
    parent: null,
    axTree: null,
    hasChildren: () => false,
    children: async () => [],
    highlightNode: () => {},
    clearHighlight: () => {},
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
      const node = makeAXNode({role: 'WebArea', axTree: new Elements.AccessibilityTree.AccessibilityTree()});
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assertAXNodeContent(component, 'WebArea');
    });

    it('returns the node role and name', () => {
      const node = makeAXNode({
        role: 'button',
        name: 'Click Me',
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assertAXNodeContent(component, 'button\xA0"Click Me"');
    });

    it('ignored node displays as Ignored', () => {
      const node = makeAXNode({
        role: 'presentation',
        ignored: true,
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

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
      const node = makeAXNode({
        role: 'paragraph',
        name: 'text',
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assert.isFalse(component.classList.contains('expanded'));
    });

    it('returns no children', () => {
      const node = makeAXNode({
        role: 'paragraph',
        name: 'text',
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };
      assert.strictEqual(node.hasChildren(), false);
      assert.lengthOf(component.children, 0);
    });
  });

  describe('ancestor chain of a parent with one child', () => {
    it('parent button has one text child', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({role: 'text', name: 'me', axTree: tree});
      const parentNode = makeAXNode({
        role: 'button',
        name: 'click',
        children: async () => [childNode],
        hasChildren: () => true,
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assert.isTrue(component.classList.contains('parent'));
    });
  });

  describe('click behaviour of accessibility nodes', () => {
    it('expanded class is toggled on expand/collapse for a node with children', async () => {
      const childNode =
          makeAXNode({role: 'text', name: 'me', axTree: new Elements.AccessibilityTree.AccessibilityTree()});
      const node = makeAXNode({
        role: 'paragraph',
        name: 'text',
        children: async () => [childNode],
        hasChildren: () => true,
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assert.isFalse(component.classList.contains('expanded'));

      await component.expand();
      assert.isTrue(component.isExpanded);
      assert.isTrue(component.classList.contains('expanded'));

      component.collapse();
      assert.isFalse(component.classList.contains('expanded'));
    });

    it('expanded class is not present for a node without children', async () => {
      const node = makeAXNode({
        role: 'paragraph',
        name: 'text',
        children: async () => [],
        hasChildren: () => false,
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assert.isFalse(component.classList.contains('expanded'));

      await component.expand();
      assert.isFalse(component.classList.contains('expanded'));

      component.collapse();
      assert.isFalse(component.classList.contains('expanded'));
    });
  });

  describe('mouse behaviour of accessibility nodes', () => {
    it('node is highlighted on mouse hover', async () => {
      let highlightCalls = 0;
      let clearHightlightCalls = 0;
      const node = makeAXNode({
        role: 'paragraph',
        name: 'text',
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
        highlightNode: () => {
          highlightCalls++;
        },
        clearHighlight: () => {
          clearHightlightCalls++;
        },
      });
      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assert.strictEqual(highlightCalls, 0);
      assert.strictEqual(clearHightlightCalls, 0);
      assertShadowRoot(component.shadowRoot);
      await withNoMutations(component.shadowRoot, () => {
        dispatchMouseOverEvent(component);
        dispatchMouseLeaveEvent(component);
      });
      assert.strictEqual(highlightCalls, 1);
      assert.strictEqual(clearHightlightCalls, 1);
    });
  });

  describe('node focus', () => {
    it('focus is moved to the selected node', () => {
      const node = makeAXNode({
        role: 'generic',
        axTree: new Elements.AccessibilityTree.AccessibilityTree(),
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assertShadowRoot(component.shadowRoot);
      const nodeWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(nodeWrapper, HTMLDivElement);

      assert.isFalse(nodeWrapper.classList.contains('selected'));
      assert.isFalse(component.hasFocus());

      component.select();
      assert.isTrue(nodeWrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());
    });
  });

  describe('right arrow keyboard interaction', () => {
    it('opens a closed node and remains in focus', async () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({id: '2', role: 'text', name: 'me', axTree: tree});
      const parentNode = makeAXNode({
        id: '1',
        role: 'paragraph',
        name: 'text',
        hasChildren: () => true,
        children: async () => [childNode],
        axTree: tree,
      });

      tree.data = {
        rootNode: parentNode,
      };

      const rootComponent = tree.getNodeByAXID(parentNode.id);
      assertElement(rootComponent, Elements.AccessibilityNode.AccessibilityNode);
      assert.isFalse(rootComponent.classList.contains('expanded'));

      await rootComponent.expand();

      assert.isTrue(rootComponent.classList.contains('expanded'));
      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.LEFT});
      assert.isFalse(rootComponent.classList.contains('expanded'));
      await dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.RIGHT});
      assert.isTrue(rootComponent.classList.contains('expanded'));
    });

    it('keypress on an open node moves focus to the first child node', async () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({role: 'generic', axTree: tree});
      const parentNode = makeAXNode({
        role: 'WebArea',
        hasChildren: () => true,
        children: async () => [childNode],
        axTree: tree,
      });
      childNode.parent = parentNode;

      tree.data = {
        rootNode: parentNode,
      };

      const rootComponent = tree.getNodeByAXID(parentNode.id);
      assertElement(rootComponent, Elements.AccessibilityNode.AccessibilityNode);
      assert.isFalse(rootComponent.classList.contains('expanded'));
      rootComponent.select();
      assert.isTrue(rootComponent.hasFocus());

      rootComponent.select();
      const parentWrapper = rootComponent.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLElement);
      assert.isTrue(parentWrapper.classList.contains('selected'));
      assert.isTrue(rootComponent.hasFocus());

      await rootComponent.expand();

      assert.isTrue(rootComponent.classList.contains('expanded'));
      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.RIGHT});
      assert.isTrue(rootComponent.classList.contains('expanded'));

      assert.isFalse(rootComponent.hasFocus());
      const childComponent = tree.getNodeByAXID(childNode.id);
      assertElement(childComponent, HTMLElement);
      assert.isTrue(childComponent.hasFocus());
    });

    it('keypress on an end node does nothing', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({role: 'generic', axTree: tree});
      const parentNode = makeAXNode({
        role: 'WebArea',
        hasChildren: () => true,
        children: async () => [childNode],
        axTree: tree,
      });
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponent = component.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);

      assertShadowRoot(childComponent.shadowRoot);
      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);

      component.select();
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.RIGHT});
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());
    });
  });

  describe('left arrow keyboard interaction', () => {
    it('closes an open node', async () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({id: '2', role: 'text', name: 'me', axTree: tree});
      const parentNode = makeAXNode({
        id: '1',
        role: 'paragraph',
        name: 'text',
        hasChildren: () => true,
        children: async () => [childNode],
        axTree: tree,
      });

      tree.data = {
        rootNode: parentNode,
      };

      const rootComponent = tree.getNodeByAXID(parentNode.id);
      assertElement(rootComponent, Elements.AccessibilityNode.AccessibilityNode);
      assert.isFalse(rootComponent.classList.contains('expanded'));

      await rootComponent.expand();

      assert.isTrue(rootComponent.classList.contains('expanded'));
      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.LEFT});
      assert.isFalse(rootComponent.classList.contains('expanded'));
    });

    it('moves focus to the parent of a closed node', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({
        id: '2',
        role: 'generic',
        hasChildren: () => true,
        axTree: tree,
      });

      const parentNode = makeAXNode({
        id: '1',
        role: 'WebArea',
        children: async () => [childNode],
        hasChildren: () => true,
        axTree: tree,
      });
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponent = component.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);
      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);

      childComponent.select();
      childComponent.collapse();
      assert.isFalse(childComponent.classList.contains('expanded'));
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.LEFT});
      assert.isFalse(childWrapper.classList.contains('selected'));
      assert.isFalse(childComponent.hasFocus());
      assert.isTrue(parentWrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());
    });

    it('does nothing on a root node that is also an end node or closed node', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const node = makeAXNode({
        role: 'WebArea',
        axTree: tree,
      });

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      assertShadowRoot(component.shadowRoot);
      const wrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(wrapper, HTMLDivElement);

      component.select();
      assert.isTrue(wrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.LEFT});
      assert.isTrue(wrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());
    });
  });

  describe('down arrow keyboard interaction', () => {
    it('move focus to first child of expanded parent', async () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const firstChild = makeAXNode({role: 'generic', axTree: tree});
      const parentNode = makeAXNode({
        role: 'paragraph',
        name: 'text',
        hasChildren: () => true,
        children: async () => [firstChild],
        axTree: tree,
      });
      firstChild.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponent = component.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);
      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);

      component.select();
      await component.expand();
      assert.isTrue(component.classList.contains('expanded'));
      assert.isTrue(parentWrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.DOWN});
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());
      assert.isFalse(parentWrapper.classList.contains('selected'));
    });

    it('move focus to next child of same parent', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const firstChild = makeAXNode({id: '2', role: 'generic', axTree: tree});
      const secondChild = makeAXNode({id: '3', role: 'button', name: 'click me', axTree: tree});
      const parentNode = makeAXNode({
        id: '1',
        role: 'paragraph',
        name: 'text',
        children: async () => [firstChild, secondChild],
        hasChildren: () => true,
        axTree: tree,
      });
      firstChild.parent = parentNode;
      secondChild.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponents = component.shadowRoot.querySelectorAll('devtools-accessibility-node');
      const firstChildComponent = childComponents[0];
      assertElement(firstChildComponent, HTMLElement);
      assertShadowRoot(firstChildComponent.shadowRoot);
      const secondChildComponent = childComponents[1];
      assertElement(secondChildComponent, HTMLElement);
      assertShadowRoot(secondChildComponent.shadowRoot);

      const firstChildWrapper = firstChildComponent.shadowRoot.querySelector('.wrapper');
      assertElement(firstChildWrapper, HTMLDivElement);
      const secondChildWrapper = secondChildComponent.shadowRoot.querySelector('.wrapper');
      assertElement(secondChildWrapper, HTMLDivElement);

      firstChildComponent.select();
      assert.isTrue(firstChildWrapper.classList.contains('selected'));
      assert.isTrue(firstChildComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.DOWN});
      assert.isTrue(secondChildWrapper.classList.contains('selected'));
      assert.isTrue(secondChildComponent.hasFocus());
      assert.isFalse(firstChildWrapper.classList.contains('selected'));
      assert.isFalse(firstChildComponent.hasFocus());
      assert.isFalse(parentWrapper.classList.contains('selected'));
    });

    it('move focus to next child of next parent', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({id: '1', role: 'button', axTree: tree});
      const parentNode = makeAXNode({
        id: '2',
        role: 'generic',
        children: async () => [childNode],
        hasChildren: () => true,
        axTree: tree,
      });
      const nextParentNode = makeAXNode({id: '3', role: 'paragraph', axTree: tree});
      const grandparentNode = makeAXNode({
        id: '4',
        role: 'WebArea',
        children: async () => [parentNode, nextParentNode],
        hasChildren: () => true,
        axTree: tree,
      });
      parentNode.parent = grandparentNode;
      nextParentNode.parent = grandparentNode;
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: grandparentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const grandparentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(grandparentWrapper, HTMLDivElement);

      const parentComponents = component.shadowRoot.querySelectorAll('devtools-accessibility-node');
      const parentComponent = parentComponents[0];
      assertElement(parentComponent, HTMLElement);
      assertShadowRoot(parentComponent.shadowRoot);
      const nextParentComponent = parentComponents[1];
      assertElement(nextParentComponent, HTMLElement);
      assertShadowRoot(nextParentComponent.shadowRoot);

      const childComponent = parentComponent.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);

      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);
      const nextParentWrapper = nextParentComponent.shadowRoot.querySelector('.wrapper');
      assertElement(nextParentWrapper, HTMLDivElement);

      childComponent.select();
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.DOWN});
      assert.isTrue(nextParentWrapper.classList.contains('selected'));
      assert.isTrue(nextParentComponent.hasFocus());
    });
  });

  describe('up arrow keyboard interaction', () => {
    it('move focus to previous child of same parent', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const firstChild = makeAXNode({id: '2', role: 'generic', axTree: tree});
      const secondChild = makeAXNode({id: '3', role: 'button', name: 'click me', axTree: tree});
      const parentNode = makeAXNode({
        id: '1',
        role: 'paragraph',
        name: 'text',
        children: async () => [firstChild, secondChild],
        hasChildren: () => true,
        axTree: tree,
      });
      firstChild.parent = parentNode;
      secondChild.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponents = component.shadowRoot.querySelectorAll('devtools-accessibility-node');
      const firstChildComponent = childComponents[0];
      assertElement(firstChildComponent, HTMLElement);
      assertShadowRoot(firstChildComponent.shadowRoot);
      const secondChildComponent = childComponents[1];
      assertElement(secondChildComponent, HTMLElement);
      assertShadowRoot(secondChildComponent.shadowRoot);

      const firstChildWrapper = firstChildComponent.shadowRoot.querySelector('.wrapper');
      assertElement(firstChildWrapper, HTMLDivElement);
      const secondChildWrapper = secondChildComponent.shadowRoot.querySelector('.wrapper');
      assertElement(secondChildWrapper, HTMLDivElement);

      secondChildComponent.select();
      assert.isTrue(secondChildWrapper.classList.contains('selected'));
      assert.isTrue(secondChildComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.UP});
      assert.isTrue(firstChildWrapper.classList.contains('selected'));
      assert.isTrue(firstChildComponent.hasFocus());
      assert.isFalse(secondChildWrapper.classList.contains('selected'));
      assert.isFalse(secondChildComponent.hasFocus());
      assert.isFalse(parentWrapper.classList.contains('selected'));
    });

    it('move focus to last child of previous parent', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({id: '1', role: 'button', axTree: tree});
      const parentNode = makeAXNode({
        id: '2',
        role: 'generic',
        children: async () => [childNode],
        hasChildren: () => true,
        axTree: tree,
      });
      const nextParentNode = makeAXNode({id: '3', role: 'paragraph', axTree: tree});
      const grandparentNode = makeAXNode({
        id: '4',
        role: 'WebArea',
        children: async () => [parentNode, nextParentNode],
        hasChildren: () => true,
        axTree: tree,
      });
      parentNode.parent = grandparentNode;
      nextParentNode.parent = grandparentNode;
      childNode.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: grandparentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const grandparentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(grandparentWrapper, HTMLDivElement);

      const parentComponents = component.shadowRoot.querySelectorAll('devtools-accessibility-node');
      const parentComponent = parentComponents[0];
      assertElement(parentComponent, HTMLElement);
      assertShadowRoot(parentComponent.shadowRoot);
      const nextParentComponent = parentComponents[1];
      assertElement(nextParentComponent, HTMLElement);
      assertShadowRoot(nextParentComponent.shadowRoot);

      const childComponent = parentComponent.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);

      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);
      const nextParentWrapper = nextParentComponent.shadowRoot.querySelector('.wrapper');
      assertElement(nextParentWrapper, HTMLDivElement);

      nextParentComponent.select();
      assert.isTrue(nextParentWrapper.classList.contains('selected'));
      assert.isTrue(nextParentComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.UP});
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());
    });

    it('move focus to the parent', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const firstChild = makeAXNode({id: '1', role: 'generic', axTree: tree});
      const parentNode = makeAXNode({
        id: '2',
        role: 'paragraph',
        name: 'text',
        children: async () => [firstChild],
        hasChildren: () => true,
        axTree: tree,
      });
      firstChild.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponent = component.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);
      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);

      childComponent.select();
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: Platform.KeyboardUtilities.ArrowKey.UP});
      assert.isTrue(parentWrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());
      assert.isFalse(childWrapper.classList.contains('selected'));
    });
  });

  describe('home key interaction', () => {
    it('go to root node', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const firstChild = makeAXNode({id: '1', role: 'generic', axTree: tree});
      const parentNode = makeAXNode({
        id: '2',
        role: 'paragraph',
        name: 'text',
        children: async () => [firstChild],
        hasChildren: () => true,
        axTree: tree,
      });
      firstChild.parent = parentNode;

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: parentNode,
      };

      assertShadowRoot(component.shadowRoot);
      const parentWrapper = component.shadowRoot.querySelector('.wrapper');
      assertElement(parentWrapper, HTMLDivElement);

      const childComponent = component.shadowRoot.querySelector('devtools-accessibility-node');
      assertElement(childComponent, HTMLElement);
      assertShadowRoot(childComponent.shadowRoot);
      const childWrapper = childComponent.shadowRoot.querySelector('.wrapper');
      assertElement(childWrapper, HTMLDivElement);

      childComponent.select();
      assert.isTrue(childWrapper.classList.contains('selected'));
      assert.isTrue(childComponent.hasFocus());

      dispatchKeyDownEvent(tree, {key: 'Home'});
      assert.isTrue(parentWrapper.classList.contains('selected'));
      assert.isTrue(component.hasFocus());
      assert.isFalse(childWrapper.classList.contains('selected'));
    });

    it('stay on root node if already on root node', () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const node = makeAXNode({role: 'generic', axTree: tree});

      const component = new Elements.AccessibilityNode.AccessibilityNode();
      renderElementIntoDOM(component);
      component.data = {
        axNode: node,
      };

      component.select();
      assert.isTrue(component.hasFocus());

      dispatchKeyDownEvent(tree, {key: 'Home'});
      assert.isTrue(component.hasFocus());
    });
  });

  describe('enter key interaction', () => {
    it('open a closed node and close an open node', async () => {
      const tree = new Elements.AccessibilityTree.AccessibilityTree();
      const childNode = makeAXNode({id: '2', role: 'text', name: 'me', axTree: tree});
      const parentNode = makeAXNode({
        id: '1',
        role: 'paragraph',
        name: 'text',
        hasChildren: () => true,
        children: async () => [childNode],
        axTree: tree,
      });

      tree.data = {
        rootNode: parentNode,
      };

      const rootComponent = tree.getNodeByAXID(parentNode.id);
      assertElement(rootComponent, Elements.AccessibilityNode.AccessibilityNode);
      assert.isFalse(rootComponent.classList.contains('expanded'));

      await rootComponent.expand();

      assert.isTrue(rootComponent.classList.contains('expanded'));
      dispatchKeyDownEvent(tree, {key: 'Enter'});
      assert.isFalse(rootComponent.classList.contains('expanded'));
      await dispatchKeyDownEvent(tree, {key: 'Enter'});
      assert.isTrue(rootComponent.classList.contains('expanded'));
    });
  });
});
