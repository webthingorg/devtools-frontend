// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import {SyntaxHighlighter} from '/front_end/ui/SyntaxHighlighter.js';

describe('SyntaxHighlighter', () => {
  it('can be instantiated correctly', () => {
    const syntaxHighlighter = new SyntaxHighlighter('TestMimeType', true);
    const result = syntaxHighlighter.createSpan('TestContent', 'TestClass');
    assert.equal(
        result.outerHTML, '<span class="cm-TestClass">TestContent</span>', 'span was not created successfully');
  });

  // TODO continue writing tests here or use another describe block
});
