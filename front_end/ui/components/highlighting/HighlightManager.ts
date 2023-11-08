// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TextUtils from '../../../models/text_utils/text_utils.js';

import highlightingStyles from './highlighting.css.js';

class RangeWalker {
  #offset = 0;
  readonly #treeWalker: TreeWalker;
  #eof: boolean;

  constructor(readonly root: Node) {
    this.#treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    this.#eof = !this.#treeWalker.firstChild();
  }

  #next(): boolean {
    this.#offset += this.#treeWalker.currentNode.textContent?.length ?? 0;
    this.#eof = !this.#treeWalker.nextNode();
    return this.#eof;
  }

  #goToPosition(offset: number): Node|null {
    if (offset < this.#offset || this.#eof) {
      return null;
    }
    while (offset > this.#offset + (this.#treeWalker.currentNode.textContent?.length ?? 0)) {
      if (this.#next()) {
        return null;
      }
    }
    return this.#treeWalker.currentNode;
  }

  nextRange(start: number, length: number): Range|null {
    if (length <= 0 || this.#eof) {
      return null;
    }

    const startNode = this.#goToPosition(start);
    if (!startNode) {
      return null;
    }
    const offsetInStartNode = start - this.#offset;
    const endNode = this.#goToPosition(start + length);
    if (!endNode) {
      return null;
    }
    const offsetInEndNode = start + length - this.#offset;

    const range = new Range();
    range.setStart(startNode, offsetInStartNode);
    range.setEnd(endNode, offsetInEndNode);
    return range;
  }
}

let highlightManagerInstance: HighlightManager;
export class HighlightManager {
  // @ts-expect-error
  #highlights = new Highlight();

  constructor() {
    document.adoptedStyleSheets.push(highlightingStyles);
    // @ts-expect-error
    CSS.highlights.set('search-highlight', this.#highlights);
  }

  static instance(opts: {
    forceNew: boolean|null,
  }|undefined = {forceNew: null}): HighlightManager {
    const {forceNew} = opts;
    if (!highlightManagerInstance || forceNew) {
      highlightManagerInstance = new HighlightManager();
    }

    return highlightManagerInstance;
  }

  addHighlights(ranges: Range[]): void {
    ranges.forEach(this.addHighlight.bind(this));
  }

  removeHighlights(ranges: Range[]): void {
    ranges.forEach(this.removeHighlight.bind(this));
  }

  addHighlight(range: Range): void {
    this.#highlights.add(range);
  }

  removeHighlight(range: Range): void {
    this.#highlights.delete(range);
  }

  highlightOrderedTextRanges(root: Node, sourceRanges: TextUtils.TextRange.SourceRange[]): Range[] {
    const rangeWalker = new RangeWalker(root);
    const ranges =
        sourceRanges.map(range => rangeWalker.nextRange(range.offset, range.length)).filter(r => r && !r.collapsed) as
        Range[];
    this.addHighlights(ranges);
    return ranges;
  }

  highlightTextRanges(root: Node, ranges: TextUtils.TextRange.SourceRange[]): Range[] {
    return this.highlightTextRanges(root, TextUtils.TextRange.SourceRange.mergeRanges(ranges));
  }
}
