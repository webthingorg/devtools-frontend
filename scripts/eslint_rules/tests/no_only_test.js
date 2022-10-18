// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const rule = require('../lib/no_only.js');
const ruleTester = new (require('eslint').RuleTester)({
  parserOptions: {ecmaVersion: 9, sourceType: 'module'},
});

ruleTester.run('no_only', rule, {
  valid: [
    {
      code: 'wrapDescribe(Mocha.describe.only, title, fn);',
      filename: 'scripts/eslint_rules/tests/foo_test.js',
    },
    {
      code: 'describe.only = function() {}',
      filename: 'scripts/eslint_rules/tests/foo_test.js',
    },
    {
      code: 'wrapDescribe(Mocha.it.only, title, fn);',
      filename: 'scripts/eslint_rules/tests/foo_test.js',
    },
    {
      code: 'it.only = function() {}',
      filename: 'scripts/eslint_rules/tests/foo_test.js',
    },
  ],

  invalid: [
    {
      code: `describeWithEnvironment.only('ConsoleMessage', () => {
        it('tests', () => {});
      })`,
      filename: 'scripts/eslint_rules/tests/foo_test.js',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: `describeWithMockConnection.only('ConsoleMessage', () => {
        it('tests', () => {});
      })`,
      filename: 'scripts/eslint_rules/tests/foo_test.js',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: `it.only('ConsoleMessage', () => {
        it('tests', () => {});
      })`,
      filename: 'scripts/eslint_rules/tests/foo_test.js',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: `it.only('ConsoleMessage', () => {
        it('tests', () => {});
      })`,
      filename: 'scripts/eslint_rules/tests/foo_test.js',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'describe.only("Some describe block", function() {});',
      output: 'describe.only("Some describe block", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'it.only("Some assertion", function() {});',
      output: 'it.only("Some assertion", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'context.only("Some context", function() {});',
      output: 'context.only("Some context", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'test.only("Some test", function() {});',
      output: 'test.only("Some test", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'tape.only("A tape", function() {});',
      output: 'tape.only("A tape", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'fixture.only("A fixture", function() {});',
      output: 'fixture.only("A fixture", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
    {
      code: 'serial.only("A serial test", function() {});',
      output: 'serial.only("A serial test", function() {});',
      errors: [{messageId: 'noOnly'}],
    },
  ]
});
