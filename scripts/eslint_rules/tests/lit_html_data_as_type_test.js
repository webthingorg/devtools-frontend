// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const rule = require('../lib/lit_html_data_as_type.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('lit_html_data_as_type', rule, {
  valid: [
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"} satisfies FooData}>`',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'html`<devtools-foo .data=${{name: "jack"} satisfies FooData}>`',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'html`<p><span></span><devtools-foo .data=${{name: "jack"} satisfies FooData}></devtools-foo></p>`',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'notLitHtmlCall`<devtools-blah .data=${"FOO"}></devtools-blah>`',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'Foo.blah`<devtools-blah .data=${"FOO"}></devtools-blah>`',
      filename: 'front_end/components/test.ts',
    },
  ],
  invalid: [
    // TODO: invalid case with as where it gets fixed to satifies
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'noSatisfies'}]
    },
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"} satisfies FooData} .data=${{name: "jack"}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'noSatisfies'}]
    },
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"} as FooData}>`',
      output: 'LitHtml.html`<devtools-foo .data=${{name: "jack"} satisfies FooData}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'noSatisfies'}]
    },
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"}} .data=${{name: "jack"}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'noSatisfies'}, {messageId: 'noSatisfies'}]
    },
    {
      code: 'html`<p><span></span><devtools-foo .data=${{name: "jack"}}></devtools-foo></p>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'noSatisfies'}]
    },
    {
      code: 'LitHtml.html`<devtools-foo .data=${{name: "jack"} satisfies {name: string}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'useInterface'}]
    },
    {
      code: 'html`<devtools-foo .data=${{name: "jack"} satisfies {name: string}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'useInterface'}]
    },
    {
      code: 'html`<devtools-foo some-other-attribute-first .data=${{name: "jack"} satisfies {name: string}}>`',
      filename: 'front_end/components/test.ts',
      errors: [{messageId: 'useInterface'}]
    },
  ]
});
