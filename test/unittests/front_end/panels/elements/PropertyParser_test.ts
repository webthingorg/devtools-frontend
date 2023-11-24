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

function
matchSingleValue<MatchT extends Elements.PropertyParser.Match, MatcherT extends Elements.PropertyParser.Matcher, ArgTs>(
    property: string, matchType: abstract new (...args: ArgTs[]) => MatchT,
    matcherType: new (factory: Elements.PropertyParser.MatchFactory<typeof matchType>) => MatcherT):
    {ast: Elements.PropertyParser.SyntaxTree, match: MatchT|undefined, text: string} {
  const ast = Elements.PropertyParser.tokenizePropertyValue(property);
  Platform.assertNotNullOrUndefined(ast);

  const matchedResult =
      Elements.PropertyParser.BottomUpTreeMatching.walk(ast, true, [new matcherType(nilRenderer(matchType))]);
  const match = matchedResult.getMatch(ast.tree);

  return {
    ast,
    match: match instanceof matchType ? match : undefined,
    text: Elements.PropertyParser.Printer.walk(ast, true).get(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = (new (...args: any[]) => any)|(abstract new (...args: any[]) => any);
function nilRenderer<Base extends Constructor>(base: Base): Elements.PropertyParser.MatchFactory<Base> {
  return (...args: unknown[]) => {
    class Renderer extends base implements Elements.PropertyParser.Match {
      constructor(...args: unknown[]) {
        super(...args);
      }
      render(): Node[] {
        return [];
      }
    }
    return new Renderer(...args);
  };
}

describe('PropertyParser', () => {
  it('parses text', async () => {
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

  it('reproduces the input if nothing matched', async () => {
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

  it('correctly renders subtrees', async () => {
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

  it('parses comments', async () => {
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

  it('parses URLs', () => {
    const url = 'http://example.com';
    {
      const {match, text} =
          matchSingleValue(`url(${url})`, Elements.PropertyParser.URLMatch, Elements.PropertyParser.URLMatcher);
      Platform.assertNotNullOrUndefined(match);
      assert.strictEqual(match.url, url, text);
    }
    {
      const {match, text} =
          matchSingleValue(`url("${url}")`, Elements.PropertyParser.URLMatch, Elements.PropertyParser.URLMatcher);
      Platform.assertNotNullOrUndefined(match);
      assert.strictEqual(match.url, url, text);
    }
  });

  it('parses colors', () => {
    for (const fail of ['red-blue', '#f', '#foobar', '', 'rgbz(1 2 2)', 'tan(45deg)']) {
      const {match, text} =
          matchSingleValue(fail, Elements.PropertyParser.ColorMatch, Elements.PropertyParser.ColorMatcher);
      assert.isUndefined(match, text);
    }
    for (const succeed of ['red', 'rgb(0 0 0)', 'rgba(0 0 0)', '#fff', '#ffff', '#ffffff', '#ffffffff']) {
      const {match, text} =
          matchSingleValue(succeed, Elements.PropertyParser.ColorMatch, Elements.PropertyParser.ColorMatcher);
      Platform.assertNotNullOrUndefined(match, text);
      assert.strictEqual(match.text, succeed);
    }
  });
});
