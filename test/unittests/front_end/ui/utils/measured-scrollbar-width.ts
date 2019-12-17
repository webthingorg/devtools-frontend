// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import { measuredScrollbarWidth } from '../../../../../front_end/ui/utils/measured-scrollbar-width.js';

describe('measuredScrollbarWidth', () => {
  it('provides a default value', () => {
    const expectedDefaultWidth = 16;
    assert.equal(measuredScrollbarWidth(), expectedDefaultWidth);
  });

  it('calculates specific widths correctly', () => {
    const width = 20;

    // Enforce custom width on scrollbars to test.
    const style = document.createElement('style');
    style.textContent = `::-webkit-scrollbar {
      -webkit-appearance: none;
      width: ${width}px;
    }`;
    document.head.appendChild(style);
    assert.equal(measuredScrollbarWidth(document), width);

    // Tidy up.
    style.remove();
  });
});
