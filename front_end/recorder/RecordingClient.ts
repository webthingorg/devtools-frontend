// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

interface ComputedAccessibleNode {
  role: string;
  name: string;
}

declare global {
  interface HTMLElement {
    role: string;
    ariaLabel: string|null;
  }

  interface Window {
    _isReplaying: boolean;
    getComputedAccessibleNode(element: Element): Promise<ComputedAccessibleNode>;
  }
}

export async function getSelector(node: HTMLElement): Promise<string> {
  // const { name } = await window.getComputedAccessibleNode(node);
  // if (name) {
  //   return 'aria/' + name;
  // }

  if (node.id) {
    return '#' + node.id;
  }

  return '';
}

export function setupRecordingClient(): void {
  async function getSelector(node: HTMLElement): Promise<string> {
    // const { name } = await window.getComputedAccessibleNode(node);
    // if (name) {
    //   return 'aria/' + name;
    // }

    if (node.id) {
      return '#' + node.id;
    }

    return '';
  }

  window.addEventListener('click', async (e: MouseEvent) => {
    if (window._isReplaying) {
      return;
    }

    const target = e.target;
    if (!target) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const selector = await getSelector(target as HTMLElement);
    window.addStep(JSON.stringify({type: 'click', selector}));
  }, true);
}
