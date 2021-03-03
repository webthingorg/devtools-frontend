// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const rule = require('../lib/l10n_no_i18nString_calls_module_instantiation.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('l10n_no_i18nString_calls_module_instantiation', rule, {
  valid: [
    {
      code: 'function foo() { i18nString("test"); }',
    },
    {
      code: 'const foo = () => i18nString();',
    },
    {
      code: 'class Bar { foo(): { i18nString(); } }',
    },
    {
      code: 'Foo.bar = function() { i18nString(); };',
    },
    {
      code: 'class Bar { private foo: String = i18nString(); }',
    },
  ],
  invalid: [
    {
      code: 'i18nString("test");',
      errors: [
        {message: 'Calls to i18nString in are disallowed at module instantiation time. Use i18nLazyString instead.'}
      ],
    },
    {
      code: 'callSomeMethod(i18nString());',
      errors: [
        {message: 'Calls to i18nString in are disallowed at module instantiation time. Use i18nLazyString instead.'}
      ],
    },
    {
      code: 'callSomeMethod({title: i18nString()});',
      errors: [
        {message: 'Calls to i18nString in are disallowed at module instantiation time. Use i18nLazyString instead.'}
      ],
    },
  ]
});
