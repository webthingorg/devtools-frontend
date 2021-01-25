// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../../third_party/lit-html/lit-html.js';

interface BaseTreeNode {
  key: string;
}
interface TreeNodeWithChildren extends BaseTreeNode {
  children: TreeNode[],
}

interface LeafNode extends BaseTreeNode {}

export type TreeNode = TreeNodeWithChildren|LeafNode;

export function isExpandableNode(node: TreeNode): node is TreeNodeWithChildren {
  return 'children' in node;
}

export const trackDOMNodeToTreeNode =
    LitHtml.directive((weakMap: WeakMap<HTMLLIElement, TreeNode>, treeNode: TreeNode) => {
      return (part: LitHtml.Part): void => {
        if (!(part instanceof LitHtml.AttributePart)) {
          throw new Error('Ref directive must be used as an attribute.');
        }

        const elem = part.committer.element;
        if (!(elem instanceof HTMLLIElement)) {
          throw new Error('trackTreeNodeToDOMNode must be used on <li> elements.');
        }
        weakMap.set(elem, treeNode);
      };
    });


const findNextParentSibling = (currentDOMNode: HTMLLIElement): HTMLLIElement|null => {
  // Else, we look for the current Node's parent, and then see if it has any siblings.
  // first parent = the <ul>, second parent = the <li> that is the parent node
  const currentDOMNodeParentListItem = currentDOMNode.parentElement?.parentElement;
  // If this is false, then we are done and can return null
  if (currentDOMNodeParentListItem && currentDOMNodeParentListItem instanceof HTMLLIElement) {
    const parentNodeSibling = currentDOMNodeParentListItem.nextElementSibling;
    // If this is false, we need to recurse
    if (parentNodeSibling && parentNodeSibling instanceof HTMLLIElement) {
      return parentNodeSibling;
    }
    return findNextParentSibling(currentDOMNodeParentListItem);
  }
  return null;
};

const getFirstChildOfExpandedTreeNode = (options: {
  currentDOMNode: HTMLLIElement,
  currentTreeNode: TreeNodeWithChildren,
}): HTMLLIElement => {
  const firstChild =
      options.currentDOMNode.querySelector<HTMLLIElement>(':scope > [role="group"] > [role="treeitem"]:first-child');
  if (!firstChild) {
    throw new Error('Could not find child of expanded node.');
  }
  return firstChild;
};

const getNextSiblingOfCurrentDOMNode = (currentDOMNode: HTMLLIElement): HTMLLIElement|null => {
  const currentNodeSibling = currentDOMNode.nextElementSibling;
  if (currentNodeSibling && currentNodeSibling instanceof HTMLLIElement) {
    return currentNodeSibling;
  }
  return null;
};
const getPreviousSiblingOfCurrentDOMNode = (currentDOMNode: HTMLLIElement): HTMLLIElement|null => {
  const currentNodeSibling = currentDOMNode.previousElementSibling;
  if (currentNodeSibling && currentNodeSibling instanceof HTMLLIElement) {
    return currentNodeSibling;
  }
  return null;
};

interface KeyboardNavigationOptions {
  currentDOMNode: HTMLLIElement;
  currentTreeNode: TreeNode;
  currentTreeNodeIsExpanded: boolean;
  direction: 'ArrowUp'|'ArrowDown'|'ArrowLeft'|'ArrowRight',
      setNodeExpandedState: (treeNode: TreeNode, expanded: boolean) => void,
}
export const findNextNodeForTreeOutlineKeyboardNavigation = (options: KeyboardNavigationOptions): HTMLLIElement => {
  const {
    currentDOMNode,
    currentTreeNode,
    currentTreeNodeIsExpanded,
    direction,
    setNodeExpandedState,
  } = options;
  if (!currentTreeNode) {
    return currentDOMNode;
  }

  if (direction === 'ArrowDown') {
    // If the node has expanded children, down takes you into that list.
    if (isExpandableNode(currentTreeNode) && currentTreeNodeIsExpanded) {
      return getFirstChildOfExpandedTreeNode({
        currentDOMNode,
        currentTreeNode,
      });
    }
    // If the node has a sibling, we go to that.
    const currentNodeSibling = getNextSiblingOfCurrentDOMNode(currentDOMNode);
    if (currentNodeSibling) {
      return currentNodeSibling;
    }

    // If the Node's parent has a sibling then we go to that.
    const parentSibling = findNextParentSibling(currentDOMNode);
    if (parentSibling) {
      return parentSibling;
    }
  } else if (direction === 'ArrowRight') {
    if (!isExpandableNode(currentTreeNode)) {
      // If the node cannot be expanded, we have nothing to do and we leave everything as is.
      return currentDOMNode;
    }

    // If the current node is expanded, move and focus into the child
    if (currentTreeNodeIsExpanded) {
      return getFirstChildOfExpandedTreeNode({
        currentDOMNode,
        currentTreeNode,
      });
    }
    // Else, we expand the Node but focus remains on the parent.
    setNodeExpandedState(currentTreeNode, true);
    return currentDOMNode;
  } else if (direction === 'ArrowUp') {
    // First see if there is a previous sibling
    const currentNodePreviousSibling = getPreviousSiblingOfCurrentDOMNode(currentDOMNode);
    if (currentNodePreviousSibling) {
      return currentNodePreviousSibling;
    }

    // Otherwise, let's go to the direct parent if there is one.
    const parentNode = currentDOMNode.parentElement?.parentElement;
    if (parentNode && parentNode instanceof HTMLLIElement) {
      return parentNode;
    }
  } else if (direction === 'ArrowLeft') {
    // If the node is expanded, we close it.
    if (isExpandableNode(currentTreeNode) && currentTreeNodeIsExpanded) {
      setNodeExpandedState(currentTreeNode, false);
      return currentDOMNode;
    }

    // Otherwise, let's go to the parent if there is one.
    const parentNode = currentDOMNode.parentElement?.parentElement;
    if (parentNode && parentNode instanceof HTMLLIElement) {
      return parentNode;
    }
  }

  // If we got here, there's no other option than to stay put.
  return currentDOMNode;
};
