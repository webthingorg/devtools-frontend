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
  it('parses text', () => {
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.parsePropertyValue('var(--v)', [])), ['var', '(', '--v', ')']);
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.parsePropertyValue(
            '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)', [])),
        [
          '2px', ' ', 'var',     '(', '--double', ',', ' ',   'var', '(',   '--fallback', ',',  ' ', 'black', ')',
          ')',   ' ', '#32a1ce', ' ', 'rgb',      '(', '124', ' ',   '125', ' ',          '21', ' ', '0',     ')',
        ]);
  });

  it('reproduces the input if nothing matched', () => {
    const property = '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)';
    const rule = `*{--property: ${property};}`;
    const tree = cssParser.parse(rule).topNode;
    const ast = new Elements.PropertyParser.SyntaxTree(property, rule, tree);
    const matchedResult = Elements.PropertyParser.BottomUpTreeMatching.walk(ast, true, []);
    const context = {ast, matchedResult};
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.Renderer.render(tree, context)).join(''), rule,
        Elements.PropertyParser.Printer.walk(ast, true).get());
  });

  it('correctly renders subtrees', () => {
    const property = '2px var(--double, var(--fallback, black)) #32a1ce rgb(124 125 21 0)';
    const rule = `*{--property: ${property};}`;
    const tree = cssParser.parse(rule).topNode.firstChild?.firstChild?.nextSibling?.firstChild?.nextSibling;
    Platform.assertNotNullOrUndefined(tree);
    const ast = new Elements.PropertyParser.SyntaxTree(property, rule, tree);
    const matchedResult = Elements.PropertyParser.BottomUpTreeMatching.walk(ast, true, []);
    const context = {ast, matchedResult};
    assert.deepStrictEqual(
        textFragments(Elements.PropertyParser.Renderer.render(tree, context)).join(''), `--property: ${property}`,
        Elements.PropertyParser.Printer.walk(ast, true).get());
  });

  it('parses comments', () => {
    const property = '/* color: red */blue/* color: red */';
    const ast = Elements.PropertyParser.tokenizePropertyValue(property);
    Platform.assertNotNullOrUndefined(ast);
    const topNode = ast.tree.parent?.parent?.parent?.parent;
    Platform.assertNotNullOrUndefined(topNode);
    assert.strictEqual(
        Elements.PropertyParser.Printer.walk(ast.subtree(topNode), true).get(),
        ` StyleSheet: *{--property: /* color: red */blue/* color: red */;}
| RuleSet: *{--property: /* color: red */blue/* color: red */;}
|| UniversalSelector: *
|| Block: {--property: /* color: red */blue/* color: red */;}
||| {
||| Declaration: --property: /* color: red */blue
|||| VariableName: --property
|||| :
|||| Comment: /* color: red */
|||| ValueName: blue
||| Comment: /* color: red */
||| ;
||| }`);
  });

  it('renders trailing comments', () => {
    const property = '/* color: red */ blue /* color: red */';
    assert.strictEqual(textFragments(Elements.PropertyParser.parsePropertyValue(property, [])).join(''), property);
  });

  it('renders malformed comments', () => {
    const property = 'red /* foo: bar';
    assert.strictEqual(textFragments(Elements.PropertyParser.parsePropertyValue(property, [])).join(''), property);
  });
});
