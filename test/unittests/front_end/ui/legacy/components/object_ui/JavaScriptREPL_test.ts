// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ObjectUI from '../../../../../../../front_end/ui/legacy/components/object_ui/object_ui.js';

const {assert} = chai;

describe('JavaScriptREPL', () => {
  describe('wrapObjectLiteral', () => {
    const {wrapObjectLiteral} = ObjectUI.JavaScriptREPL.JavaScriptREPL;

    it('wraps simple object literals in parens', () => {
      assert.strictEqual(wrapObjectLiteral('{a: 10}'), '({a: 10})');
      assert.strictEqual(wrapObjectLiteral('{a: 10};'), '({a: 10})');
      assert.strictEqual(wrapObjectLiteral('\n { a: 10}\n;\n  ; '), '({a: 10})');
    });

    it('wraps nested object literals in parens', () => {
      assert.strictEqual(wrapObjectLiteral('{x: {y: {z: 1}}}'), '({x: {y: {z: 1}}})');
    });

    it('leaves object literals with syntax errors untouched', () => {
      assert.strictEqual(wrapObjectLiteral('{a: {}'), '{a: {}');
      assert.strictEqual(wrapObjectLiteral('{a: [}]};'), '{a: [}]};');
    });

    it('leaves blocks untouched', () => {
      assert.strictEqual(wrapObjectLiteral('{a = 10}'), '{a = 10}');
      assert.strictEqual(wrapObjectLiteral('{} + {}'), '{} + {}');
      assert.strictEqual(wrapObjectLiteral('{} + []'), '{} + []');
      assert.strictEqual(wrapObjectLiteral('{} + 2'), '{} + 2');
      assert.strictEqual(wrapObjectLiteral('{a: 1} + 2'), '{a: 1} + 2');
    });
  });
});
