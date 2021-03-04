// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const rule = require('../lib/l10n_no_unused_phrase.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

const exampleWithJSDoc = `
const UIStrings = {
  /**
   * @description Some random string
   */
  foo: 'bar',
};`;

ruleTester.run('l10n_no_unused_phrase', rule, {
  valid: [
    {
      code: 'export const UIStrings = { foo: \'bar\' };',
      filename: 'front_end/module/ModuleUIStrings.ts',
    },
    {
      code: 'export const UIStrings = { foo: \'bar\' };',
      filename: 'front_end/module/ModuleUIStrings.js',
    },
    {
      code: 'const UIStrings = { foo: \'bar\' }; let someVariable = UIStrings.foo;',
      filename: 'front_end/module/test.ts',
    },
  ],
  invalid: [
    {
      // Check that trailing comma is handled.
      code: 'const UIStrings = { foo: \'bar\', };',
      filename: 'front_end/module/test.ts',
      errors: [{message: 'UIStrings phrase is not used.'}],
      output: 'const UIStrings = {  };',
    },
    {
      code: 'const UIStrings = { foo: \'bar\' };',
      filename: 'front_end/module/test.ts',
      errors: [{message: 'UIStrings phrase is not used.'}],
      output: 'const UIStrings = {  };',
    },
    {
      // Check that the JSDoc before the property is also removed.
      code: exampleWithJSDoc,
      filename: 'front_end/module/test.ts',
      errors: [{message: 'UIStrings phrase is not used.'}],
      output: '\nconst UIStrings = {\n  \n  \n};',
    },
  ]
});
