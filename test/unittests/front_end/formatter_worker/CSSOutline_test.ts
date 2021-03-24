// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as FormatterWorker from '../../../../front_end/formatter_worker/formatter_worker.js';

type Item = {
  title: string,
  subtitle?: string, line: number, column: number,
};

function cssOutline(text: string): Promise<Item[]> {
  return new Promise(resolve => {
    const items: Item[] = [];
    FormatterWorker.CSSOutline.cssOutline(text, ({chunk, isLastChunk}) => {
      items.push(...chunk);
      if (isLastChunk) {
        resolve(items);
      }
    });
  });
}

describe('CSSOutline', () => {
  it('handles empty style sheets', async () => {
    const items = await cssOutline('');
    assert.deepEqual(items, []);
  });
});
