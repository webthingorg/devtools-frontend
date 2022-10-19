// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../core/platform/platform.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';

export type ElementId = string;

// The group nodes are represented by the summary tag DOM nodes.
const SUMMARY_ELEMENT_SELECTOR = 'summary';
const BREAKPOINT_ITEM_SELECTOR = '.breakpoint-item';

/**
 * This is a custom lit-html directive that lets us track the DOM nodes that Lit
 * creates and maps them to the ElementId that was given to us. This means we
 * can navigate between real DOM node and ElementId easily in code.
 */
class TrackDOMNodeToElementId extends LitHtml.Directive.Directive {
  constructor(partInfo: LitHtml.Directive.PartInfo) {
    super(partInfo);

    if (partInfo.type !== LitHtml.Directive.PartType.ATTRIBUTE) {
      throw new Error('TrackDOMNodeToTreeNode directive must be used as an attribute.');
    }
  }

  update(part: LitHtml.Directive.ElementPart, [weakMap, id]: LitHtml.Directive.DirectiveParameters<this>): void {
    const elem = part.element;
    if (!(elem instanceof HTMLElement)) {
      throw new Error('trackTreeNodeToDOMNode must be used on <li> elements.');
    }
    weakMap.set(elem, id);
  }

  /*
   * Because this directive doesn't render anything, there's no implementation
   * here for the render method. But we need it to state the params the
   * directive takes so the update() method's types are correct. Unfortunately
   * we have to pass any as the generic type because we can't define this class
   * using a generic - the generic gets lost when wrapped in the directive call
   * below.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(_weakmap: WeakMap<HTMLElement, ElementId>, _treeNode: ElementId): void {
  }
}

export const trackDOMNodeToElementId = LitHtml.Directive.directive(TrackDOMNodeToElementId);

const domNodeIsBreakpoinItemNode = (domNode: HTMLElement): boolean => {
  return domNode.getAttribute('role') === 'treeitem';
};

const domNodeIsGroupNode = (domNode: HTMLElement): boolean => {
  return !domNodeIsBreakpoinItemNode(domNode);
};

const groupIsExpanded = (detailsElement: HTMLDetailsElement): boolean => {
  return detailsElement.getAttribute('open') !== null;
};

const getFirstBreakpointItemInGroup = (detailsElement: HTMLDetailsElement): HTMLElement|null => {
  return detailsElement.querySelector<HTMLElement>(BREAKPOINT_ITEM_SELECTOR);
};

const getLastBreakpoinItemInGroup = (detailsElement: HTMLDetailsElement): HTMLElement|null => {
  return detailsElement.querySelector<HTMLDivElement>(`${BREAKPOINT_ITEM_SELECTOR}:last-child`);
};

const getNextGroupNode = (detailsElement: HTMLDetailsElement): HTMLElement|null => {
  const nextDetailsElement = getNextDetailsElement(detailsElement);
  if (nextDetailsElement && nextDetailsElement instanceof HTMLDetailsElement) {
    return nextDetailsElement?.querySelector<HTMLElement>('summary');
  }
  return null;
};

const getCurrentGroupNode = (detailsElement: HTMLDetailsElement): HTMLElement|null => {
  return detailsElement.querySelector<HTMLElement>(SUMMARY_ELEMENT_SELECTOR);
};

const getNextDetailsElement = (detailsElement: HTMLDetailsElement): HTMLDetailsElement|null => {
  // To get to the next details element, we need to access `nextElementSibling` twice, as we
  // need to step over a horizontal divider :
  // <details></details> <hr/> <details></details>
  const dividerElement = detailsElement.nextElementSibling;
  const nextDetailsElement = dividerElement?.nextElementSibling;
  if (nextDetailsElement && nextDetailsElement instanceof HTMLDetailsElement) {
    return nextDetailsElement;
  }
  return null;
};

const getPreviousDetailsElement = (detailsElement: HTMLDetailsElement): HTMLDetailsElement|null => {
  // To get to the next details element, we need to access `previousElementSibling` twice, as we
  // need to step over a horizontal divider :
  // <details></details> <hr/> <details></details>
  const dividerElement = detailsElement.previousElementSibling;
  const previousDetailsElement = dividerElement?.previousElementSibling;
  if (previousDetailsElement && previousDetailsElement instanceof HTMLDetailsElement) {
    return previousDetailsElement;
  }
  return null;
};

export async function findNextNodeForKeyboardNavigation(
    target: HTMLElement, key: Platform.KeyboardUtilities.ArrowKey,
    setGroupExpandedStateCallback: (detailsElement: HTMLDetailsElement, expanded: boolean) =>
        Promise<unknown>): Promise<HTMLElement|null> {
  const detailsElement = target.parentElement;
  if (!detailsElement || !(detailsElement instanceof HTMLDetailsElement)) {
    throw new Error('The selected nodes should be direct children of an HTMLDetails element.');
  }

  let nextNode: HTMLElement|null = null;
  switch (key) {
    case Platform.KeyboardUtilities.ArrowKey.LEFT: {
      if (domNodeIsGroupNode(target)) {
        // On a group node, collapse if expanded.
        if (groupIsExpanded(detailsElement)) {
          await setGroupExpandedStateCallback(detailsElement, false);
        }
      } else {
        // On a breakpoint item node, navigate up to the group node.
        return getCurrentGroupNode(detailsElement);
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.RIGHT: {
      if (domNodeIsGroupNode(target)) {
        // On a group node, expand if collapsed, and otherwise navigate
        // to the first breakpoint item in this group.
        if (groupIsExpanded(detailsElement)) {
          return getFirstBreakpointItemInGroup(detailsElement);
        }
        await setGroupExpandedStateCallback(detailsElement, true);
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.DOWN: {
      if (domNodeIsGroupNode(target)) {
        if (groupIsExpanded(detailsElement)) {
          // If the current node is an expanded group node, navigating down
          // should lead to the first breakpoint item within the group.
          nextNode = getFirstBreakpointItemInGroup(detailsElement);
        } else {
          // If the current node is a collapsed group, go to the next
          // group if existent.
          nextNode = getNextGroupNode(detailsElement);
        }
      } else {
        // If the current node is a breakpoint item, try to get the next
        // breakpoint item if available, otherwise the next group.
        const nextSibling = target.nextElementSibling;
        if (nextSibling && nextSibling instanceof HTMLDivElement) {
          nextNode = nextSibling;
        } else {
          nextNode = getNextGroupNode(detailsElement);
        }
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.UP: {
      if (domNodeIsGroupNode(target)) {
        const previousDetailsElement = getPreviousDetailsElement(detailsElement);
        if (previousDetailsElement) {
          // If the current node is a group node, navigating upwards will either
          // navigate to the last breakpoint item of the previous group (if expanded),
          // and otherwise navigate to the group node.
          if (groupIsExpanded(previousDetailsElement)) {
            nextNode = getLastBreakpoinItemInGroup(previousDetailsElement);
          } else {
            nextNode = getCurrentGroupNode(previousDetailsElement);
          }
        }
      } else {
        // If the current node is a breakpoint item, going up should get
        // the previous sibling, which can be both a group node (summary tag), or
        // a breakpoint item.
        const previousSibling = target.previousElementSibling;
        if (previousSibling instanceof HTMLElement) {
          nextNode = previousSibling;
        }
      }
      break;
    }
  }
  return nextNode;
}
