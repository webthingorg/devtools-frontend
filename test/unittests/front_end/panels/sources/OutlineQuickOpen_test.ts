// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;

import * as CodeMirror from '../../../../../front_end/third_party/codemirror.next/codemirror.next.js';
import * as Sources from '../../../../../front_end/panels/sources/sources.js';

describe('OutlineQuickOpen', () => {
  describe('generates a correct JavaScript outline', () => {
    function javaScriptOutline(doc: string) {
      const extensions = [CodeMirror.javascript.javascript()];
      const state = CodeMirror.EditorState.create({doc, extensions});
      return Sources.OutlineQuickOpen.outline(state);
    }

    it('for empty scripts', () => {
      assert.isEmpty(javaScriptOutline(''));
    });

    it('for simple function statements', () => {
      assert.deepEqual(
          javaScriptOutline('function f() {}'),
          [
            {title: 'f', subtitle: '()', line: 0, column: 9},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('function func(param) { return param; }'),
          [
            {title: 'func', subtitle: '(param)', line: 0, column: 9},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('function foo(a, b, c) {}'),
          [
            {title: 'foo', subtitle: '(a, b, c)', line: 0, column: 9},
          ],
      );
    });

    it('for function statements with rest arguments', () => {
      assert.deepEqual(
          javaScriptOutline('function func(...rest) {}'),
          [
            {title: 'func', subtitle: '(...rest)', line: 0, column: 9},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('function foo(a, b, ...c) {}'),
          [
            {title: 'foo', subtitle: '(a, b, ...c)', line: 0, column: 9},
          ],
      );
    });

    it('for nested function statements', () => {
      assert.deepEqual(
          javaScriptOutline('function foo(){ function bar() {} function baz(a,b ,c) { }}'),
          [
            {title: 'foo', subtitle: '()', line: 0, column: 9},
            {title: 'bar', subtitle: '()', line: 0, column: 25},
            {title: 'baz', subtitle: '(a, b, c)', line: 0, column: 43},
          ],
      );
    });

    it('for async function statements', () => {
      assert.deepEqual(
          javaScriptOutline(
              'async function foo() { };\n' +
              'async function sum(x, y) { return x + y; }'),
          [
            {title: 'async foo', subtitle: '()', line: 0, column: 15},
            {title: 'async sum', subtitle: '(x, y)', line: 1, column: 15},
          ],
      );
    });

    it('for generator function statements', () => {
      assert.deepEqual(
          javaScriptOutline(
              'function* foo() { }\n' +
              'async function* bar(a,b){}'),
          [
            {title: '*foo', subtitle: '()', line: 0, column: 10},
            {title: 'async *bar', subtitle: '(a, b)', line: 1, column: 16},
          ],
      );
    });

    it('for function expressions in variable declarations', () => {
      assert.deepEqual(
          javaScriptOutline('const a = function(a,b) { }, b = function bar(c,d) { }'),
          [
            {title: 'a', subtitle: '(a, b)', line: 0, column: 6},
            {title: 'b', subtitle: '(c, d)', line: 0, column: 29},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('let a = function(a,b) { }, b = function bar(c,d) { }'),
          [
            {title: 'a', subtitle: '(a, b)', line: 0, column: 4},
            {title: 'b', subtitle: '(c, d)', line: 0, column: 27},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('var a = function(a,b) { }, b = function bar(c,d) { }'),
          [
            {title: 'a', subtitle: '(a, b)', line: 0, column: 4},
            {title: 'b', subtitle: '(c, d)', line: 0, column: 27},
          ],
      );
    });

    it('for function expressions in property assignments', () => {
      assert.deepEqual(
          javaScriptOutline(
              'a.b.c = function(d, e) { };\n' +
              'a.b[c] = function() { };\n' +
              'a.b[c].d = function() { };\n' +
              '(a || b).c = function() { };\n'),
          [
            {title: 'c', subtitle: '(d, e)', line: 0, column: 4},
            {title: 'd', subtitle: '()', line: 2, column: 7},
            {title: 'c', subtitle: '()', line: 3, column: 9},
          ],
      );
    });

    it('for function expressions in object literals', () => {
      assert.deepEqual(
          javaScriptOutline(
              'x = { run: function() { }, get count() { }, set count(value) { }};\n' +
              'var foo = { "bar": function() { }};\n' +
              'var foo = { 42: function() { }}\n'),
          [
            {title: 'run', subtitle: '()', line: 0, column: 6},
            {title: 'get count', subtitle: '()', line: 0, column: 31},
            {title: 'set count', subtitle: '(value)', line: 0, column: 48},
          ],
      );
    });

    it('for arrow functions in variable declarations', () => {
      assert.deepEqual(
          javaScriptOutline(
              'var a = x => x + 2;\n' +
              'var b = (x, y) => x + y'),
          [
            {title: 'a', subtitle: '(x)', line: 0, column: 4},
            {title: 'b', subtitle: '(x, y)', line: 1, column: 4},
          ],
      );
      assert.deepEqual(
          javaScriptOutline(
              'let x = (a,b) => a + b, y = a => { return a; };\n' +
              'const z = x => x'),
          [
            {title: 'x', subtitle: '(a, b)', line: 0, column: 4},
            {title: 'y', subtitle: '(a)', line: 0, column: 24},
            {title: 'z', subtitle: '(x)', line: 1, column: 6},
          ],
      );
    });

    it('for arrow functions in property assignments', () => {
      assert.deepEqual(
          javaScriptOutline(
              'a.b.c = (d, e) => d + e;\n' +
              'a.b[c] = () => { };\n' +
              'a.b[c].d = () => { };\n' +
              '(a || b).c = () => { };\n'),
          [
            {title: 'c', subtitle: '(d, e)', line: 0, column: 4},
            {title: 'd', subtitle: '()', line: 2, column: 7},
            {title: 'c', subtitle: '()', line: 3, column: 9},
          ],
      );
    });

    it('for arrow functions in object literals', () => {
      assert.deepEqual(
          javaScriptOutline(
              'const object = {\n' +
              '  foo: x => x,\n' +
              '  bar: (a, b) => { return a + b };\n' +
              '};'),
          [
            {title: 'foo', subtitle: '(x)', line: 1, column: 2},
            {title: 'bar', subtitle: '(a, b)', line: 2, column: 2},
          ],
      );
    });

    it('for async function expressions', () => {
      assert.deepEqual(
          javaScriptOutline(
              'const foo = async function() { };\n' +
              'var sum = async (x, y) => x + y;'),
          [
            {title: 'async foo', subtitle: '()', line: 0, column: 6},
            {title: 'async sum', subtitle: '(x, y)', line: 1, column: 4},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('obj.foo = async function() { return this; }'),
          [
            {title: 'async foo', subtitle: '()', line: 0, column: 4},
          ],
      );
      assert.deepEqual(
          javaScriptOutline(
              '({\n' +
              '  async foo(x) { },\n' +
              '  async get x() { },\n' +
              '  async set x(x) { },\n' +
              '  bar: async function() {},\n' +
              ' })'),
          [
            {title: 'async foo', subtitle: '(x)', line: 1, column: 8},
            {title: 'async get x', subtitle: '()', line: 2, column: 12},
            {title: 'async set x', subtitle: '(x)', line: 3, column: 12},
            {title: 'async bar', subtitle: '()', line: 4, column: 2},
          ],
      );
    });

    it('for generator function expressions', () => {
      assert.deepEqual(
          javaScriptOutline(
              'const foo = function*(x) { }\n' +
              'var bar = async function*() {}'),
          [
            {title: '*foo', subtitle: '(x)', line: 0, column: 6},
            {title: 'async *bar', subtitle: '()', line: 1, column: 4},
          ],
      );
      assert.deepEqual(
          javaScriptOutline(
              'const object = { foo: function*(x) { } };\n' +
              '({ *bar() {}, async *baz() {} })'),
          [
            {title: '*foo', subtitle: '(x)', line: 0, column: 17},
            {title: '*bar', subtitle: '()', line: 1, column: 4},
            {title: 'async *baz', subtitle: '()', line: 1, column: 21},
          ],
      );
    });

    it('for class statements', () => {
      assert.deepEqual(
          javaScriptOutline('class C {}'),
          [
            {title: 'class C', line: 0, column: 6},
          ],
      );
      assert.deepEqual(
          javaScriptOutline('class MyAwesomeClass extends C {}'),
          [
            {title: 'class MyAwesomeClass', line: 0, column: 6},
          ],
      );
    });

    it('for class expressions in variable declarations', () => {
      assert.deepEqual(
          javaScriptOutline(
              'const C = class C {};\n' +
              'let A = class extends C {};'),
          [
            {title: 'class C', line: 0, column: 6},
            {title: 'class A', line: 1, column: 4},
          ],
      );
    });

    it('for class expressions in property assignments', () => {
      assert.deepEqual(
          javaScriptOutline('a.b.c = class klass { };'),
          [{title: 'class c', line: 0, column: 4}],
      );
    });

    it('for class expressions in object literals', () => {
      assert.deepEqual(
          javaScriptOutline('const object = { klass: class { } }'),
          [{title: 'class klass', line: 0, column: 17}],
      );
    });

    it('for class constructors', () => {
      assert.deepEqual(
          javaScriptOutline('class Test { constructor(foo, bar) { }}'),
          [
            {title: 'class Test', line: 0, column: 6},
            {title: 'constructor', subtitle: '(foo, bar)', line: 0, column: 13},
          ],
      );
    });

    it('for class methods', () => {
      assert.deepEqual(
          javaScriptOutline(
              'class Test { foo() {} static bar() { }};\n' +
              '(class { baz() {} });'),
          [
            {title: 'class Test', line: 0, column: 6},
            {title: 'foo', subtitle: '()', line: 0, column: 13},
            {title: 'static bar', subtitle: '()', line: 0, column: 29},
            {title: 'baz', subtitle: '()', line: 1, column: 9},
          ],
      );
      assert.deepEqual(
          javaScriptOutline(
              'class A {\n' +
              '  get x() { return 1; }\n' +
              '  set x(x) {}\n' +
              '  async foo(){}\n' +
              '  *bar() {}\n' +
              '  async*baz() {}\n' +
              '  static async foo(){}\n' +
              '}'),
          [
            {title: 'class A', line: 0, column: 6},
            {title: 'get x', subtitle: '()', line: 1, column: 6},
            {title: 'set x', subtitle: '(x)', line: 2, column: 6},
            {title: 'async foo', subtitle: '()', line: 3, column: 8},
            {title: '*bar', subtitle: '()', line: 4, column: 3},
            {title: 'async *baz', subtitle: '()', line: 5, column: 8},
            {title: 'static async foo', subtitle: '()', line: 6, column: 15},
          ],
      );
    });

    it('even in the presence of syntax errors', () => {
      assert.deepEqual(
          javaScriptOutline(`
function foo(a, b) {
  if (a > b) {
    return a;
}

function bar(eee) {
  yield foo(eee, 2 * eee);
}`),
          [
            {title: 'foo', subtitle: '(a, b)', line: 1, column: 9},
            {title: 'bar', subtitle: '(eee)', line: 6, column: 9},
          ],
      );
    });
  });

  describe('generates a correct JSX outline', () => {
    function jsxOutline(doc: string) {
      const extensions = [CodeMirror.javascript.javascript({jsx: true})];
      const state = CodeMirror.EditorState.create({doc, extensions});
      return Sources.OutlineQuickOpen.outline(state);
    }

    it('for an empty script', () => {
      assert.deepEqual(jsxOutline(''), []);
    });

    it('for a simple hello world template', () => {
      assert.deepEqual(
          jsxOutline(`
function getGreeting(user) {
  if (user) {
    return <h1>Hello, {formatName(user)}!</h1>;
  }
  return <h1>Hello, Stranger.</h1>;
}

const formatName = (name) => {
  return <blink>{name}</blink>;
}`),
          [
            {title: 'getGreeting', subtitle: '(user)', line: 1, column: 9},
            {title: 'formatName', subtitle: '(name)', line: 8, column: 6},
          ],
      );
    });
  });

  describe('generates a correct CSS outline', () => {
    function cssOutline(doc: string) {
      const extensions = [CodeMirror.css.css()];
      const state = CodeMirror.EditorState.create({doc, extensions});
      return Sources.OutlineQuickOpen.outline(state);
    }

    it('for an empty style sheet', () => {
      assert.deepEqual(cssOutline(''), []);
    });

    it('for universal selectors', () => {
      assert.deepEqual(
          cssOutline(
              '* { color: green; }\n' +
              '  *{\n' +
              '    background-color: red;\n' +
              '}'),
          [
            {title: '*', line: 0, column: 0},
            {title: '*', line: 1, column: 2},
          ],
      );
    });

    it('for type selectors', () => {
      assert.deepEqual(
          cssOutline(
              'input {\n' +
              '  --custom-color: blue;\n' +
              '  color: var(--custom-color);\n' +
              '}\n' +
              'a { font-size: 12px; };\n'),
          [
            {title: 'input', line: 0, column: 0},
            {title: 'a', line: 4, column: 0},
          ],
      );
    });

    it('for class selectors', () => {
      assert.deepEqual(
          cssOutline(
              '  .large {\n' +
              '    font-size: 20px;\n' +
              '   }\n' +
              ' a.small { font-size: 12px; };\n'),
          [
            {title: '.large', line: 0, column: 2},
            {title: 'a.small', line: 3, column: 1},
          ],
      );
    });

    it('for ID selectors', () => {
      assert.deepEqual(
          cssOutline('#large {font-size: 20px;} button#small { font-size: 12px; };'),
          [
            {title: '#large', line: 0, column: 0},
            {title: 'button#small', line: 0, column: 26},
          ],
      );
    });

    it('for attribute selectors', () => {
      assert.deepEqual(
          cssOutline(
              '[aria-label="Exit button"] {}\n' +
              'details[open]{}\n' +
              'a[href*="example"]\n'),
          [
            {title: '[aria-label="Exit button"]', line: 0, column: 0},
            {title: 'details[open]', line: 1, column: 0},
            {title: 'a[href*="example"]', line: 2, column: 0},
          ],
      );
    });

    it('for selector lists', () => {
      assert.deepEqual(
          cssOutline('a#id1, a.cls1, hr { content: ""}'),
          [
            {title: 'a#id1', line: 0, column: 0},
            {title: 'a.cls1', line: 0, column: 7},
            {title: 'hr', line: 0, column: 15},
          ],
      );
    });

    it('for combinators', () => {
      assert.deepEqual(
          cssOutline(
              'div a {}\n' +
              '.dark > div {}\n' +
              '.light ~ div {}\n' +
              ' head + body{}\n'),
          [
            {title: 'div a', line: 0, column: 0},
            {title: '.dark > div', line: 1, column: 0},
            {title: '.light ~ div', line: 2, column: 0},
            {title: 'head + body', line: 3, column: 1},
          ],
      );
    });

    it('for pseudo-classes', () => {
      assert.deepEqual(
          cssOutline(
              'a:visited{}button:hover{}\n' +
              ':host {}\n'),
          [
            {title: 'a:visited', line: 0, column: 0},
            {title: 'button:hover', line: 0, column: 11},
            {title: ':host', line: 1, column: 0},
          ],
      );
    });
  });

  describe('generates a correct HTML outline', () => {
    function htmlOutline(doc: string) {
      const extensions = [CodeMirror.html.html()];
      const state = CodeMirror.EditorState.create({doc, extensions});
      return Sources.OutlineQuickOpen.outline(state);
    }

    it('for an empty document', () => {
      assert.deepEqual(htmlOutline('<!DOCTYPE html><html></html>'), []);
    });

    it('for a document with a single inline <script>', () => {
      assert.deepEqual(
          htmlOutline('<!DOCTYPE html><script>function foo(){}</script>'),
          [
            {title: 'foo', subtitle: '()', line: 0, column: 32},
          ],
      );
      assert.deepEqual(
          htmlOutline(
              '<!DOCTYPE html>\n' +
              '<html>\n' +
              '  <head>\n' +
              '    <script type="text/javascript">\n' +
              '      async function bar(x) { return x; }\n' +
              '      function baz(a,b, ...rest) { return rest; };\n' +
              '    </script>\n' +
              '  </head>\n' +
              '</html>'),
          [
            {title: 'async bar', subtitle: '(x)', line: 4, column: 21},
            {title: 'baz', subtitle: '(a, b, ...rest)', line: 5, column: 15},
          ],
      );
      assert.deepEqual(
          htmlOutline(`<script>
  function first() {}
  function IrrelevantFunctionSeekOrMissEKGFreqUnderflow() {}
  function someFunction1() {}
  function someFunction2() {}
  debugger;
</script>`),
          [
            {title: 'first', subtitle: '()', line: 1, column: 11},
            {title: 'IrrelevantFunctionSeekOrMissEKGFreqUnderflow', subtitle: '()', line: 2, column: 11},
            {title: 'someFunction1', subtitle: '()', line: 3, column: 11},
            {title: 'someFunction2', subtitle: '()', line: 4, column: 11},
          ],
      );
    });

    it('for a document with multiple inline <script>s', () => {
      assert.deepEqual(
          htmlOutline(`<!DOCTYPE html>
<html>
  <head>
    <script type="text/javascript">function add(x, y) { return x + y; }</script>
  </head>
  <body>
    <script>
      const sub = (a, b) => {
        return x + y;
      }
    </script>
  </body>
</html>`),
          [
            {title: 'add', subtitle: '(x, y)', line: 3, column: 44},
            {title: 'sub', subtitle: '(a, b)', line: 7, column: 12},
          ],
      );
    });

    it('for a document with inline <script>s and <style>s', () => {
      assert.deepEqual(
          htmlOutline(`<!DOCTYPE html>
<html>
<head>
  <script>function add(x, y) { return x + y; }</script>
  <style>
    body { background-color: green; }
  </style>
</head>
<body>
<script defer>
const sub = (x, y) => x - y;
</script>
<style>
:host {
  --custom-variable: 5px;
}
</style>
</body>
</html>`),
          [
            {title: 'add', subtitle: '(x, y)', line: 3, column: 19},
            {title: 'body', line: 5, column: 4},
            {title: 'sub', subtitle: '(x, y)', line: 10, column: 6},
            {title: ':host', line: 13, column: 0},
          ],
      );
    });
  });
});
