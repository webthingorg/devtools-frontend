// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export default class AXBreadcrumbsPane extends Accessibility.AccessibilitySubPane {
  /**
   * @param {!Accessibility.AccessibilitySidebarView} axSidebarView
   */
  constructor(axSidebarView) {
    super(ls`Accessibility Tree`);

    this.element.classList.add('ax-subpane');
    UI.ARIAUtils.markAsTree(this.element);
    this.element.tabIndex = -1;

    this._axSidebarView = axSidebarView;

    /** @type {?Accessibility.AXBreadcrumb} */
    this._preselectedBreadcrumb = null;
    /** @type {?Accessibility.AXBreadcrumb} */
    this._inspectedNodeBreadcrumb = null;

    this._hoveredBreadcrumb = null;
    this._rootElement = this.element.createChild('div', 'ax-breadcrumbs');
    this._axNode = null;

    this._rootElement.addEventListener('keydown', this._onKeyDown.bind(this), true);
    this._rootElement.addEventListener('mousemove', this._onMouseMove.bind(this), false);
    this._rootElement.addEventListener('mouseleave', this._onMouseLeave.bind(this), false);
    this._rootElement.addEventListener('click', this._onClick.bind(this), false);
    this._rootElement.addEventListener('contextmenu', this._contextMenuEventFired.bind(this), false);
    this._rootElement.addEventListener('focusout', this._onFocusOut.bind(this), false);
    this.registerRequiredCSS('accessibility/axBreadcrumbs.css');
  }

  /**
   * @override
   */
  focus() {
    if (this._inspectedNodeBreadcrumb) {
      this._inspectedNodeBreadcrumb.nodeElement().focus();
    } else {
      this.element.focus();
    }
  }

  /**
   * @param {?Accessibility.AccessibilityNode} axNode
   * @override
   */
  setAXNode(axNode) {
    this._axNode = axNode;
    const hadFocus = this.element.hasFocus();
    super.setAXNode(axNode);

    this._rootElement.removeChildren();

    if (!axNode) {
      return;
    }

    const ancestorChain = [];
    let ancestor = axNode;
    while (ancestor) {
      ancestorChain.push(ancestor);
      ancestor = ancestor.parentNode();
    }
    ancestorChain.reverse();

    for (let i = 0; i < ancestorChain.length; i++) {
      let ancestor = ancestorChain[i];
      if (ancestor.role().value == 'generic') {
        let j = i + 1;
        let count = 0;
        while (j < ancestorChain.length && ancestorChain[j].role().value == 'generic') {
          ancestorChain[j].setHidden(true);
          count++;
          j++;
        }
        ancestor.setExpanded(false);
        ancestor.setNumberOfCollapsedDescendants(count + 1);
      }
    }

    axNode.setAncestorChain(ancestorChain);
    let breadcrumb = this._buildAncestorBreadcrumbs(axNode, false);
    this._inspectedNodeBreadcrumb = breadcrumb;
    this._inspectedNodeBreadcrumb.setPreselected(true, hadFocus);
    this._setPreselectedBreadcrumb(this._inspectedNodeBreadcrumb);
  }

  /**
   * @param {!Accessibility.AccessibilityNode} axNode
   * @return {!Accessibility.AXBreadcrumb} breadcrumb
   */
  _buildAncestorBreadcrumbs(axNode) {
    let ancestorChain = axNode.ancestorChain();
    let depth = 0;
    let breadcrumb = null;
    let parent = null;
    let descendant = null;
    let node = null;
    for (descendant of ancestorChain) {
      if (descendant.hidden()) {
        continue;
      }
      breadcrumb = new Accessibility.AXBreadcrumb(descendant, depth, (descendant === axNode));
      if (parent) {
        parent.appendChild(breadcrumb);
      } else {
        this._rootElement.appendChild(breadcrumb.element());
      }
      parent = breadcrumb;
      depth++;
    }

    return breadcrumb;
  }

  _rebuildBreadcrumbsFromGivenNode(axNode) {
    let start = this._axNode.ancestorChain().indexOf(axNode);
    for (let i = start; i < this._axNode.ancestorChain().length; i++) {
    }
  }

  addInspectedNodeDescendants(axNode) {
    /**
     * @param {!Accessibility.AXBreadcrumb} parentBreadcrumb
     * @param {!Accessibility.AccessibilityNode} axNode
     * @param {number} localDepth
     */
    function append(parentBreadcrumb, axNode) {
      let localDepth = parentBreadcrumb.depth();
      const childBreadcrumb = new Accessibility.AXBreadcrumb(axNode, localDepth, false);
      parentBreadcrumb.appendChild(childBreadcrumb);

      // In most cases there will be no children here, but there are some special cases.
      for (const child of axNode.children()) {
        if (expandChildren)
          child.setHidden(false);
        append(childBreadcrumb, child, localDepth + 1);
      }
    }

    for (const child of axNode.children()) {
      append(this._inspectedNodeBreadcrumb, child);
    }
  }

  /**
   * @override
   */
  willHide() {
    this._setPreselectedBreadcrumb(null);
  }

  /**
   * @param {!Event} event
   */
  _onKeyDown(event) {
    if (!this._preselectedBreadcrumb) {
      return;
    }
    if (!event.composedPath().some(element => element === this._preselectedBreadcrumb.element())) {
      return;
    }
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      return;
    }

    let handled = false;
    if ((event.key === 'ArrowUp' || event.key === 'ArrowLeft') && !event.altKey) {
      handled = this._preselectPrevious();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowRight') && !event.altKey) {
      handled = this._preselectNext();
    } else if (isEnterKey(event)) {
      handled = this._inspectDOMNode(this._preselectedBreadcrumb.axNode());
    }

    if (handled) {
      event.consume(true);
    }
  }

  /**
   * @return {boolean}
   */
  _preselectPrevious() {
    const previousBreadcrumb = this._preselectedBreadcrumb.previousBreadcrumb();
    if (!previousBreadcrumb) {
      return false;
    }
    this._setPreselectedBreadcrumb(previousBreadcrumb);
    return true;
  }

  /**
   * @return {boolean}
   */
  _preselectNext() {
    const nextBreadcrumb = this._preselectedBreadcrumb.nextBreadcrumb();
    if (!nextBreadcrumb) {
      return false;
    }
    this._setPreselectedBreadcrumb(nextBreadcrumb);
    return true;
  }

  /**
   * @param {?Accessibility.AXBreadcrumb} breadcrumb
   */
  _setPreselectedBreadcrumb(breadcrumb) {
    if (breadcrumb === this._preselectedBreadcrumb) {
      return;
    }
    const hadFocus = this.element.hasFocus();
    if (this._preselectedBreadcrumb) {
      this._preselectedBreadcrumb.setPreselected(false, hadFocus);
    }

    if (breadcrumb) {
      this._preselectedBreadcrumb = breadcrumb;
    } else {
      this._preselectedBreadcrumb = this._inspectedNodeBreadcrumb;
    }
    this._preselectedBreadcrumb.setPreselected(true, hadFocus);
    if (!breadcrumb && hadFocus) {
      SDK.OverlayModel.hideDOMNodeHighlight();
    }
  }

  /**
   * @param {!Event} event
   */
  _onMouseLeave(event) {
    this._setHoveredBreadcrumb(null);
  }

  /**
   * @param {!Event} event
   */
  _onMouseMove(event) {
    const breadcrumbElement = event.target.enclosingNodeOrSelfWithClass('ax-breadcrumb');
    if (!breadcrumbElement) {
      this._setHoveredBreadcrumb(null);
      return;
    }
    const breadcrumb = breadcrumbElement.breadcrumb;
    if (!breadcrumb.isDOMNode()) {
      return;
    }
    this._setHoveredBreadcrumb(breadcrumb);
  }

  /**
   * @param {!Event} event
   */
  _onFocusOut(event) {
    if (!this._preselectedBreadcrumb || event.target !== this._preselectedBreadcrumb.nodeElement()) {
      return;
    }
    this._setPreselectedBreadcrumb(null);
  }

  /**
   * @param {!Event} event
   */
  _onClick(event) {
    const breadcrumbElement = event.target.enclosingNodeOrSelfWithClass('ax-breadcrumb');
    if (!breadcrumbElement) {
      this._setHoveredBreadcrumb(null);
      return;
    }
    const breadcrumb = breadcrumbElement.breadcrumb;
    if (breadcrumb.inspected()) {
      // If the user is clicking the inspected breadcrumb, they probably want to
      // focus it.
      breadcrumb.nodeElement().focus();
      return;
    }
    if (!breadcrumb.isDOMNode()) {
      return;
    }
    this._inspectDOMNode(breadcrumb.axNode());
  }

  /**
   * @param {?Accessibility.AXBreadcrumb} breadcrumb
   */
  _setHoveredBreadcrumb(breadcrumb) {
    if (breadcrumb === this._hoveredBreadcrumb) {
      return;
    }

    if (this._hoveredBreadcrumb) {
      this._hoveredBreadcrumb.setHovered(false);
    }

    if (breadcrumb) {
      breadcrumb.setHovered(true);
    } else if (this.node()) {
      // Highlight and scroll into view the currently inspected node.
      this.node().domModel().overlayModel().nodeHighlightRequested(this.node().id);
    }

    this._hoveredBreadcrumb = breadcrumb;
  }

  /**
   * @param {!Accessibility.AccessibilityNode} axNode
   * @return {boolean}
   */
  _inspectDOMNode(axNode) {
    if (!axNode.isDOMNode()) {
      return false;
    }

    axNode.deferredDOMNode().resolve(domNode => {
      this._axSidebarView.setNode(domNode, true /* fromAXTree */);
      Common.Revealer.reveal(domNode, true /* omitFocus */);
    });

    return true;
  }

  /**
   * @param {!Event} event
   */
  _contextMenuEventFired(event) {
    const breadcrumbElement = event.target.enclosingNodeOrSelfWithClass('ax-breadcrumb');
    if (!breadcrumbElement) {
      return;
    }

    const axNode = breadcrumbElement.breadcrumb.axNode();
    if (!axNode.isDOMNode() || !axNode.deferredDOMNode()) {
      return;
    }

    const contextMenu = new UI.ContextMenu(event);
    contextMenu.viewSection().appendItem(ls`Scroll into view`, () => {
      axNode.deferredDOMNode().resolvePromise().then(domNode => {
        if (!domNode) {
          return;
        }
        domNode.scrollIntoView();
      });
    });

    contextMenu.appendApplicableItems(axNode.deferredDOMNode());
    contextMenu.show();
  }
}

export class AXBreadcrumb {
  /**
   * @param {!Accessibility.AccessibilityNode} axNode
   * @param {number} depth
   * @param {boolean} inspected
   */
  constructor(axNode, depth, inspected) {
    /** @type {!Accessibility.AccessibilityNode} */
    this._axNode = axNode;

    this._element = createElementWithClass('div', 'ax-breadcrumb');
    this._element.breadcrumb = this;

    this._nodeElement = createElementWithClass('div', 'ax-node');
    UI.ARIAUtils.markAsTreeitem(this._nodeElement);
    this._nodeElement.tabIndex = -1;
    this._element.appendChild(this._nodeElement);
    this._nodeWrapper = createElementWithClass('div', 'wrapper');
    this._nodeElement.appendChild(this._nodeWrapper);
    this._depth = depth;

    this._selectionElement = createElementWithClass('div', 'selection fill');
    this._nodeElement.appendChild(this._selectionElement);

    this._childrenGroupElement = createElementWithClass('div', 'children');
    UI.ARIAUtils.markAsGroup(this._childrenGroupElement);
    this._element.appendChild(this._childrenGroupElement);

    /** @type !Array<!Accessibility.AXBreadcrumb> */
    this._children = [];
    this._hovered = false;
    this._preselected = false;
    this._parent = null;

    this._inspected = inspected;
    this._nodeElement.classList.toggle('inspected', inspected);

    this._nodeElement.style.paddingLeft = (16 * depth + 4) + 'px';

    if (this._axNode.ignored()) {
      this._appendIgnoredNodeElement();
    } else {
      this._appendRoleElement(this._axNode.role());
      if (this._axNode.name() && this._axNode.name().value) {
        this._nodeWrapper.createChild('span', 'separator').textContent = '\xA0';
        this._appendNameElement(/** @type {string} */ (this._axNode.name().value));
      }
    }

    if (this._axNode.numberOfCollapsedDescendants() > 0) {
      this._generic_counter =
          new AXBreadcrumbCounter(this, this._axNode.numberOfCollapsedDescendants(), this._nodeWrapper);
      const counterElement = createElementWithClass('span', 'monospace');
    }

    if (this._axNode.hasOnlyUnloadedChildren()) {
      this._nodeElement.classList.add('children-unloaded');
    }

    if (!this._axNode.isDOMNode()) {
      this._nodeElement.classList.add('no-dom-node');
    }
  }

  /**
   * @return {!Element}
   */
  element() {
    return this._element;
  }

  rebuildDescendantsChain() {
    let chain =
  }

  /**
   * @return {!Element}
   */
  nodeElement() {
    return this._nodeElement;
  }

  /**
   * @param {!Accessibility.AXBreadcrumb} breadcrumb
   */
  appendChild(breadcrumb) {
    this._children.push(breadcrumb);
    breadcrumb.setParent(this);
    this._nodeElement.classList.add('parent');
    UI.ARIAUtils.setExpanded(this._nodeElement, true);
    this._childrenGroupElement.appendChild(breadcrumb.element());
  }

  /**
   * @param {!Accessibility.AXBreadcrumb} breadcrumb
   */
  setParent(breadcrumb) {
    this._parent = breadcrumb;
  }

  /**
   * @return {boolean}
   */
  preselected() {
    return this._preselected;
  }

  /**
   * @param {boolean} preselected
   * @param {boolean} selectedByUser
   */
  setPreselected(preselected, selectedByUser) {
    if (this._preselected === preselected) {
      return;
    }
    this._preselected = preselected;
    this._nodeElement.classList.toggle('preselected', preselected);
    if (preselected) {
      this._nodeElement.setAttribute('tabIndex', 0);
    } else {
      this._nodeElement.setAttribute('tabIndex', -1);
    }
    if (this._preselected) {
      if (selectedByUser) {
        this._nodeElement.focus();
      }
      if (!this._inspected) {
        this._axNode.highlightDOMNode();
      } else {
        SDK.OverlayModel.hideDOMNodeHighlight();
      }
    }
  }

  /**
   * @param {boolean} hovered
   */
  setHovered(hovered) {
    if (this._hovered === hovered) {
      return;
    }
    this._hovered = hovered;
    this._nodeElement.classList.toggle('hovered', hovered);
    if (this._hovered) {
      this._nodeElement.classList.toggle('hovered', true);
      this._axNode.highlightDOMNode();
    }
  }

  /**
   * @return {!Accessibility.AccessibilityNode}
   */
  axNode() {
    return this._axNode;
  }

  /**
   * @return {boolean}
   */
  inspected() {
    return this._inspected;
  }

  /**
   * @return {boolean}
   */
  isDOMNode() {
    return this._axNode.isDOMNode();
  }

  /**
   * @return {?Accessibility.AXBreadcrumb}
   */
  nextBreadcrumb() {
    if (this._children.length) {
      return this._children[0];
    }
    const nextSibling = this.element().nextSibling;
    if (nextSibling) {
      return nextSibling.breadcrumb;
    }
    return null;
  }

  /**
   * @return {?Accessibility.AXBreadcrumb}
   */
  previousBreadcrumb() {
    const previousSibling = this.element().previousSibling;
    if (previousSibling) {
      return previousSibling.breadcrumb;
    }

    return this._parent;
  }

  /**
   * @return {integer}
   */
  depth() {
    return this._depth;
  }

  /**
   * @param {string} name
   */
  _appendNameElement(name) {
    const nameElement = createElement('span');
    nameElement.textContent = '"' + name + '"';
    nameElement.classList.add('ax-readable-string');
    this._nodeWrapper.appendChild(nameElement);
  }

  /**
   * @param {?Protocol.Accessibility.AXValue} role
   */
  _appendRoleElement(role) {
    if (!role) {
      return;
    }

    const roleElement = createElementWithClass('span', 'monospace');
    roleElement.classList.add(Accessibility.AXBreadcrumb.RoleStyles[role.type]);
    roleElement.setTextContentTruncatedIfNeeded(role.value || '');

    this._nodeWrapper.appendChild(roleElement);
  }

  _appendIgnoredNodeElement() {
    const ignoredNodeElement = createElementWithClass('span', 'monospace');
    ignoredNodeElement.textContent = ls`Ignored`;
    ignoredNodeElement.classList.add('ax-breadcrumbs-ignored-node');
    this._nodeWrapper.appendChild(ignoredNodeElement);
  }
}

class AXBreadcrumbCounter {
  /**
   * @param {!Accessibility.AXBreadcrumbsPane}
   * @param {int}
   * @param {node wrapper}
   */
  constructor(axBreadcrumb, axNode, count, wrapper) {
    this._enclosingBreadcrumbs = axBreadcrumb;
    this._axNode = axNode;
    this._count = count;
    this._expanded = false;
    this._nodeWrapper = wrapper;

    // Construct the actual element
    this._counterElement = createElementWithClass('span', 'monospace');
    this._counterElement.setTextContentTruncatedIfNeeded(this._count || '');
    this._counterElement.classList.add('generic-container-counter');
    this._nodeWrapper.appendChild(this._counterElement);

    this._counterElement.addEventListener('click', this._onClick.bind(this), false);
  }

  setExpanded(expanded) {
    this._expanded = expanded;
  }

  getExpanded() {
    return this._expanded;
  }

  _onClick() {
    let ancestorChain = this._parentAXNode.ancestorChain();
    if (this._expanded) {
      console.log('should close this element list');
    } else {
      console.log('should expand this list');
    }

    // invert the hiding on the generic containers.
    for (let i = 0; i < ancestorChain.length; i++) {
      let ancestor = ancestorChain[i];
      ancestor.setHidden(!ancestor.hidden());
    }

    this._expanded = !(this._expanded);
    event.stopPropagation();

    this._enclosingBreadcrumb._buildAncestorBreadcrumbs(this._axNode);
  }
}

/** @type {!Object<string, string>} */
export const RoleStyles = {
  internalRole: 'ax-internal-role',
  role: 'ax-role',
};

/* Legacy exported object */
self.Accessibility = self.Accessibility || {};

/* Legacy exported object */
Accessibility = Accessibility || {};

/**
 * @constructor
 */
Accessibility.AXBreadcrumbsPane = AXBreadcrumbsPane;

/**
 * @constructor
 */
Accessibility.AXBreadcrumb = AXBreadcrumb;

/** @type {!Object<string, string>} */
Accessibility.AXBreadcrumb.RoleStyles = RoleStyles;
