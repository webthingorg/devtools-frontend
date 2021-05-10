// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as LitHtml from '../../../../../front_end/ui/lit-html/lit-html.js';

const templateArray = (value: string[]): TemplateStringsArray => {
  // We assume here it's okay to lose the `raw` value from the TemplateStringsArray
  // for the purposes of testing.
  return value as unknown as TemplateStringsArray;
};

describe('Static', () => {
  it('does not flatten template strings with no statics or values', () => {
    const example1 = LitHtml.flattenTemplate`No update needed`;
    assert.deepStrictEqual(example1.strings, templateArray(['No update needed']));
    assert.deepStrictEqual(example1.valueMap, []);
  });

  it('does not flatten template strings with just values', () => {
    const example1 = LitHtml.flattenTemplate`Just ${1} value`;
    assert.deepStrictEqual(example1.strings, templateArray(['Just ', ' value']));
    assert.deepStrictEqual(example1.valueMap, [true]);
  });

  it('does flatten template strings with statics', () => {
    const tag = LitHtml.literal`div`;
    const example1 = LitHtml.flattenTemplate`<${tag}>Foo</${tag}>`;
    assert.deepStrictEqual(example1.strings, templateArray(['<div>Foo</div>']));
    assert.deepStrictEqual(example1.valueMap, [false, false]);
  });

  it('does flatten template strings with statics but leaves values alone', () => {
    const tag = LitHtml.literal`div`;
    const name = 'Everyone!';
    const example1 = LitHtml.flattenTemplate`<${tag}>Hello, ${name}!</${tag}>`;
    assert.deepStrictEqual(example1.strings, templateArray(['<div>Hello, ', '!</div>']));
    assert.deepStrictEqual(example1.valueMap, [false, true, false]);
  });

  it('ignores data values', () => {
    const tag = LitHtml.literal`div`;
    const name = 'everyone!';
    const example1 = LitHtml.flattenTemplate`<${tag} .data={{x: 1}}>Hello, ${name}!</${tag}>`;
    assert.deepStrictEqual(example1.strings, templateArray(['<div .data={{x: 1}}>Hello, ', '!</div>']));
    assert.deepStrictEqual(example1.valueMap, [false, true, false]);
  });

  it('flattens multiple values', () => {
    const tag = LitHtml.literal`div`;
    const message = 'Hello, everyone!';
    const example1 = LitHtml.flattenTemplate`<${tag}>${1}${2}${3}, ${message}! ${'Static value'}!</${tag}>`;
    assert.deepStrictEqual(example1.strings, templateArray(['<div>', '', '', ', ', '! ', '!</div>']));
    assert.deepStrictEqual(example1.valueMap, [false, true, true, true, true, true, false]);
  });
});
