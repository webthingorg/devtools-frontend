// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const rule = require('../lib/observable_signal_used_correctly.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('l10n_filename_matches', rule, {
  valid: [
    {
      code: 'this.signal("foo");',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'const x = 12; super.signal("foo", x);',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'super.signal("foo", window, {});',
      filename: 'front_end/components/test.ts',
    },
    {
      code: 'CodeMirror.signal("foo", window, {});',
      filename: 'front_end/components/test.ts',
    },
  ],
  invalid: [
    {
      code: 'const x = "Foo"; this.signal(x);',
      filename: 'front_end/components/test.ts',
      errors: [{
        message:
            'First argument to \'Observable.signal\' call must be a string literal denoting a method name of the Observer interface.'
      }]
    },
    {
      code: 'this.signal<"foo">("foo");',
      filename: 'front_end/components/test.ts',
      errors: [
        {message: 'Specifying type parameters to \'Observable.signal\' might introduce unsoundness and is not allowed.'}
      ]
    },
  ]
});
