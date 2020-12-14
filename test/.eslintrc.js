// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = path.join(__dirname, '..', 'scripts', 'eslint_rules', 'lib');

module.exports = {
  'rules': {
    // errors on it('test') with no body
    'mocha/no-pending-tests': 2,
    // errors on {describe, it}.only
    'mocha/no-exclusive-tests': 2,

    'rulesdir/check_test_definitions': 2,
    'rulesdir/avoid_assert_equal': 2,
    'rulesdir/no_repeated_tests': 2,
  },
};
