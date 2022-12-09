// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const stylelint = require('stylelint');

const RULE_NAME = 'plugin/wrap_container_queries_clean_css';

module.exports = stylelint.createPlugin(RULE_NAME, function() {
  return function(postcssRoot, postcssResult) {
    function reportError(declaration) {
      stylelint.utils.report({
        message: '@container queries must be wrapped in clean-css ignore comments [crbug.com/1399763]',
        ruleName: RULE_NAME,
        node: declaration,
        result: postcssResult,
      });
    }

    function checkContainerAtRule(atRuleNode) {
      const prev = atRuleNode.prev();
      const next = atRuleNode.next();
      const hasSurroundingComments =
          (prev && prev.type === 'comment' && prev.text === 'clean-css ignore:start' && next &&
           next.type === 'comment' && next.text === 'clean-css ignore:end');
      if (!hasSurroundingComments) {
        reportError(atRuleNode);
      }
    }

    postcssRoot.walkRules(rule => {
      if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'container') {
        checkContainerAtRule(rule.parent);
      }
    });
  };
});

module.exports.ruleName = RULE_NAME;
