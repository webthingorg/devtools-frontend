// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../../../../../front_end/core/platform/platform.js';
import * as Elements from '../../../../../front_end/panels/elements/elements.js';
import * as CodeMirror from '../../../../../front_end/third_party/codemirror.next/codemirror.next.js';

const cssParser = CodeMirror.css.cssLanguage.parser;

function textFragments(nodes: Node[]): Array<string|null> {
  return nodes.map(n => n.textContent);
}

describe('PropertyParser', () => {
  it('parses text', async () => {
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.parsePropertyValue('var(--v)', [])), ['var', '(', '--v', ')']);
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.parsePropertyValue(
            '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)', [])),
        [
          '2px', 'var', '(',       '--double', ',', 'var', '(',   '--fallback', ',', 'black',
          ')',   ')',   '#32a1ce', 'rgb',      '(', '124', '125', '21',         '0', ')',
        ]);
  });

  it('reproduces the input if nothing matched', async () => {
    const property = '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)';
    const rule = `*{--property: ${property};}`;
    const tree = cssParser.parse(rule).topNode;
    const ast = new Elements.PropertyParser.SyntaxTree(property, rule, tree);
    const matchedResult = Elements.PropertyParser.BottomUpTreeMatching.walk(ast, true, []);
    const context = {ast, matchedResult};
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.Renderer.render(tree, context)),
        [
          '*',     '{', '--property', ':',       '2px', 'var', '(',   '--double', ',',  'var', '(', '--fallback', ',',
          'black', ')', ')',          '#32a1ce', 'rgb', '(',   '124', '125',      '21', '0',   ')', ';',          '}',
        ],
        Elements.PropertyParser.Printer.walk(ast, true).get());
  });

  it('correctly renders subtrees', async () => {
    const property = '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)';
    const rule = `*{--property: ${property};}`;
    const tree = cssParser.parse(rule).topNode.firstChild?.firstChild?.nextSibling?.firstChild?.nextSibling;
    Platform.assertNotNullOrUndefined(tree);
    const ast = new Elements.PropertyParser.SyntaxTree(property, rule, tree);
    const matchedResult = Elements.PropertyParser.BottomUpTreeMatching.walk(ast, true, []);
    const context = {ast, matchedResult};
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.Renderer.render(tree, context)),
        [
          '--property', ':', '2px', 'var',     '(',   '--double', ',',   'var', '(',  '--fallback', ',',
          'black',      ')', ')',   '#32a1ce', 'rgb', '(',        '124', '125', '21', '0',          ')',
        ],
        Elements.PropertyParser.Printer.walk(ast, true).get());
  });
});
