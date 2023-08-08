// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Trace from '../../models/trace/trace.js';

export class Breadcrumb {
  readonly #window: Trace.Types.Timing.TraceWindow;
  #child: Breadcrumb|null = null;

  constructor(window: Trace.Types.Timing.TraceWindow) {
    this.#window = window;
  }

  addChild(child: Breadcrumb): void {
    this.#child = child;
  }

  removeChild(): void {
    this.#child = null;
  }

  getChild(): Breadcrumb|null {
    return this.#child;
  }
}

export class Breadcrumbs {
  readonly #initialBreadcrumb: Breadcrumb;

  constructor(initialBreadcrumb: Breadcrumb) {
    this.#initialBreadcrumb = initialBreadcrumb;
  }

  // instead we can keep track of the last child to fasten adding a new one
  addNewBreadcrumb(newChild: Breadcrumb): void {
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.getChild() !== null) {
      const iterChild = breadcrumbsIter.getChild();
      if (iterChild !== null) {
        breadcrumbsIter = iterChild;
      }
    }

    breadcrumbsIter.addChild(newChild);
  }

  removeBreadcrumbChildren(newLastBreadcrumb: Breadcrumb): void {
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter !== newLastBreadcrumb) {
      const iterChild = breadcrumbsIter.getChild();
      if (iterChild !== null) {
        breadcrumbsIter = iterChild;
      }
    }

    breadcrumbsIter.removeChild();
  }
}
