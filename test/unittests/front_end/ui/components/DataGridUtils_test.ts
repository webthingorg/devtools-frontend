// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {nextRowIndex} from '../../../../../front_end/ui/components/DataGridUtils.js';

const {assert} = chai;

describe('DataGridUtils', () => {
  describe('nextRowIndex', () => {
    describe('for ArrowDown', () => {
      it('returns the first row if none is selected', () => {
        const nextIndex = nextRowIndex(5, null, 'ArrowDown');
        assert.strictEqual(nextIndex, 0);
      });

      it('returns the next row down if it exists', () => {
        const nextIndex = nextRowIndex(2, 0, 'ArrowDown');
        assert.strictEqual(nextIndex, 1);
      });

      it('does not move the index if it is at the last row', () => {
        const nextIndex = nextRowIndex(2, 1, 'ArrowDown');
        assert.strictEqual(nextIndex, 1);
      });
    });

    describe('for ArrowUp', () => {
      it('does nothing if no row is currently selected', () => {
        const nextIndex = nextRowIndex(5, null, 'ArrowUp');
        assert.strictEqual(nextIndex, null);
      });

      it('returns the next row up if it exists', () => {
        const nextIndex = nextRowIndex(2, 1, 'ArrowUp');
        assert.strictEqual(nextIndex, 0);
      });

      it('does not move the index if it is at the first row', () => {
        const nextIndex = nextRowIndex(2, 0, 'ArrowUp');
        assert.strictEqual(nextIndex, 0);
      });
    });
  });
});
