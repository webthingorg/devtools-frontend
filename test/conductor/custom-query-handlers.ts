// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
* The following custom query all implement the same traversal logic and as such
* it would be nice if we could refactor this out instead of repeating ourselves.
* But because the handlers will be stringified and sent over the wire through
* CDP, we need the functions to be completely self-contained and not refer any
* names from the outer scope. This means that such a refactoring can only be
* achieved by using reflection, which we decided against.
*/
export const querySelectorShadowOne = (
    element: Element|Document|ShadowRoot,
    selector: string,
    ): Element|null => {
  let found: Element|null = null;
  const search = (root: Element|Document|ShadowRoot) => {
    const iter = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
    );
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        search(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (!found && currentNode.matches(selector)) {
        found = currentNode;
      }
    } while (!found && iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  search(element);
  return found;
};

export const querySelectorShadowAll = (
    element: Element|Document,
    selector: string,
    ): Element[] => {
  const result: Element[] = [];
  const collect = (root: Element|Document|ShadowRoot) => {
    const iter = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
    );
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        collect(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (currentNode.matches(selector)) {
        result.push(currentNode);
      }
    } while (iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  collect(element);
  return result;
};


export const querySelectorShadowTextOne = (
    element: Element|Document|ShadowRoot,
    text: string,
    ): Element|null => {
  let found: Element|null = null;
  const search = (root: Element|Document|ShadowRoot) => {
    const iter = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
    );
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        search(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (!found && currentNode.textContent === text) {
        found = currentNode;
      }
    } while (!found && iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  search(element);
  return found;
};

export const querySelectorShadowTextAll = (
    element: Element|Document,
    selector: string,
    ): Element[] => {
  const result: Element[] = [];
  const collect = (root: Element|Document|ShadowRoot) => {
    const iter = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
    );
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        collect(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (currentNode.textContent === selector) {
        result.push(currentNode);
      }
    } while (iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  collect(element);
  return result;
};
interface AriaProps {
  name?: string;
  role?: string;
}

export const ariaQueryOne = (element: Element|Document, selector: string): Element|null => {
  const s = selector.split('@');
  const ariaProps: AriaProps = s.length === 1 ? {name: s[0]} : {name: s[0], role: s[1]};
  const getAccessibleName = (element: Element): string =>
      element.hasAttribute('aria-label') ? element.getAttribute('aria-label') as string : element.textContent || '';
  const match = (element: Element): boolean => {
    if (ariaProps.role) {
      const computedRole = element.getAttribute('role') || element.getAttribute('type');
      if (ariaProps.role !== computedRole) {
        return false;
      }
    }
    if (ariaProps.name && ariaProps.name !== getAccessibleName(element)) {
      return false;
    }
    return true;
  };
  let found: Element|null = null;
  const search = (root: Element|ShadowRoot) => {
    const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        search(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (match(currentNode)) {
        found = currentNode;
      }
    } while (iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  search(element);
  return found;
};

export const ariaQueryAll = (element: Element|Document, selector: string): Element[]|NodeListOf<Element> => {
  const s = selector.split('@');
  const ariaProps: AriaProps = s.length === 1 ? {name: s[0]} : {name: s[0], role: s[1]};
  const getAccessibleName = (element: Element): string =>
      element.hasAttribute('aria-label') ? element.getAttribute('aria-label') as string : element.textContent || '';
  const match = (element: Element): boolean => {
    if (ariaProps.role) {
      const computedRole = element.getAttribute('role') || element.getAttribute('type');
      if (ariaProps.role !== computedRole) {
        return false;
      }
    }
    if (ariaProps.name && ariaProps.name !== getAccessibleName(element)) {
      return false;
    }
    return true;
  };
  const result: Element[] = [];
  const collect = (root: Element|ShadowRoot) => {
    const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    do {
      const currentNode = iter.currentNode as HTMLElement;
      if (currentNode.shadowRoot) {
        collect(currentNode.shadowRoot);
      }
      if (currentNode instanceof ShadowRoot) {
        continue;
      }
      if (match(currentNode)) {
        result.push(currentNode);
      }
    } while (iter.nextNode());
  };
  if (element instanceof Document) {
    element = element.documentElement;
  }
  collect(element);
  return result;
};
