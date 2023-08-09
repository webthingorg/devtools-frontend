// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Trace from '../../models/trace/trace.js';

export interface Breadcrumb {
  window: Trace.Types.Timing.TraceWindow;
  child: Breadcrumb|null;
}

export class Breadcrumbs {
  readonly #initialBreadcrumb: Breadcrumb;
  #lastBreadcrumb: Breadcrumb;

  constructor(initialTraceWindow: Trace.Types.Timing.TraceWindow) {
    this.#initialBreadcrumb = {
      window: initialTraceWindow,
      child: null,
    };
    this.#lastBreadcrumb = this.#initialBreadcrumb;
  }

  addNewBreadcrumb(newBreadcrumbTraceWindow: Trace.Types.Timing.TraceWindow): void {
    const newBreadcrumb = {
      window: newBreadcrumbTraceWindow,
      child: null,
    };
    this.#lastBreadcrumb.child = newBreadcrumb;
    this.#lastBreadcrumb = newBreadcrumb;
  }

  removeBreadcrumbChildren(newLastBreadcrumb: Trace.Types.Timing.TraceWindow): void {
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.window !== newLastBreadcrumb) {
      const iterChild = breadcrumbsIter.child;
      if (iterChild !== null) {
        breadcrumbsIter = iterChild;
      }
    }

    breadcrumbsIter.child = null;
  }

  getBreacrumbsTraceWindows(): Trace.Types.Timing.TraceWindow[] {
    const allBreadcrumbs: Trace.Types.Timing.TraceWindow[] = [this.#initialBreadcrumb.window];
    let breadcrumbsIter: Breadcrumb = this.#initialBreadcrumb;

    while (breadcrumbsIter.child !== null) {
      const iterChild = breadcrumbsIter.child;
      if (iterChild !== null) {
        allBreadcrumbs.push(iterChild.window);
        breadcrumbsIter = iterChild;
      }
    }

    return allBreadcrumbs;
  }
}
