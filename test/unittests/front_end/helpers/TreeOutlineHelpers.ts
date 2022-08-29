// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Wait for a certain number of children are rendered. We need this as the
 * component uses LitHtml's until directive, which is async and not within the
 * render coordinator's control.
 */
export async function waitForRenderedTreeNodeCount(shadowRoot: ShadowRoot, expectedNodeCount: number): Promise<void> {
  const actualNodeCount = shadowRoot.querySelectorAll('li[role="treeitem"]').length;
  if (actualNodeCount === expectedNodeCount) {
    return;
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(async () => {
      await waitForRenderedTreeNodeCount(shadowRoot, expectedNodeCount);
      resolve();
    });
  });
}

export interface VisibleTreeNodeFromDOM<T> {
  renderedKey: T;
  children?: VisibleTreeNodeFromDOM<T>[];
}

/**
 * Converts the nodes into a tree structure that we can assert against.
 */
export function visibleNodesToTree<T>(
    shadowRoot: ShadowRoot, parseNode: (arg0: HTMLLIElement) => T): VisibleTreeNodeFromDOM<T>[] {
  const tree: VisibleTreeNodeFromDOM<T>[] = [];

  function buildTreeNode(node: HTMLLIElement): VisibleTreeNodeFromDOM<T> {
    const item: VisibleTreeNodeFromDOM<T> = {
      renderedKey: parseNode(node),
    };

    if (node.getAttribute('aria-expanded') && node.getAttribute('aria-expanded') === 'true') {
      item.children = [];
      const childNodes = node.querySelectorAll<HTMLLIElement>(':scope > ul[role="group"]>li');
      for (const child of childNodes) {
        item.children.push(buildTreeNode(child));
      }
    }

    return item;
  }
  const rootNodes = shadowRoot.querySelectorAll<HTMLLIElement>('ul[role="tree"]>li');
  for (const root of rootNodes) {
    tree.push(buildTreeNode(root));
  }
  return tree;
}

export function treeNodeKeyText(node: HTMLLIElement) {
  const keyNode = node.querySelector('[data-node-key]');
  if (!keyNode) {
    throw new Error('Found tree node without a key within it.');
  }
  return JSON.parse(keyNode.getAttribute('data-node-key') || '');
}
