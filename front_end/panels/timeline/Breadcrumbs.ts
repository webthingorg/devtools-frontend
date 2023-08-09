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

  getTraceWindow(): Trace.Types.Timing.TraceWindow {
    return this.#window;
  }
}

export class Breadcrumbs {
  readonly #initialBreadcrumb: Breadcrumb;

  constructor(initialTraceWindow: Trace.Types.Timing.TraceWindow) {
    this.#initialBreadcrumb = new Breadcrumb(initialTraceWindow);
  }

  // instead we can keep track of the last child to fasten adding a new one
  addNewBreadcrumb(newBreadcrumbTraceWindow: Trace.Types.Timing.TraceWindow): void {
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.getChild() !== null) {
      const iterChild = breadcrumbsIter.getChild();
      if (iterChild !== null) {
        breadcrumbsIter = iterChild;
      }
    }

    breadcrumbsIter.addChild(new Breadcrumb(newBreadcrumbTraceWindow));
  }

  removeBreadcrumbChildren(newLastBreadcrumb: Trace.Types.Timing.TraceWindow): void {
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.getTraceWindow() !== newLastBreadcrumb) {
      const iterChild = breadcrumbsIter.getChild();
      if (iterChild !== null) {
        breadcrumbsIter = iterChild;
      }
    }

    breadcrumbsIter.removeChild();
  }

  getBreacrumbsTraceWindows(): Trace.Types.Timing.TraceWindow[] {
    const allBreadcrumbs: Trace.Types.Timing.TraceWindow[] = [this.#initialBreadcrumb.getTraceWindow()];
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.getChild() !== null) {
      const iterChild = breadcrumbsIter.getChild();
      if (iterChild !== null) {
        allBreadcrumbs.push(iterChild.getTraceWindow());
        breadcrumbsIter = iterChild;
      }
    }

    return allBreadcrumbs;
  }
}
