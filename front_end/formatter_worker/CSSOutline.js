// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {parseCSS} from './CSSRuleParser.js';

/** @typedef {{title: string, subtitle: undefined, line: number, column: number}} */
// @ts-ignore typedef
export let Item;

/**
 * @param {string} content
 * @param {function({chunk: !Array<!Item>, isLastChunk: boolean}):void} chunkCallback
 */
export function cssOutline(content, chunkCallback) {
  return parseCSS(content, ({chunk: rules, isLastChunk}) => {
    const chunk = rules.map(rule => {
      const title = 'selectorText' in rule ? rule.selectorText : rule.atRule;
      const line = rule.lineNumber;
      const column = rule.columnNumber;
      return {title, subtitle: undefined, line, column};
    });
    chunkCallback({chunk, isLastChunk});
  });
}
