// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function isModuleScope(context) {
  return context.getScope().type === 'module';
}

const FULLY_LOCKED_PHRASE_REGEX = /^`[^`]*`$/;
const SINGLE_PLACEHOLDER_REGEX = /^\{\w+\}$/;  // Matches the PH regex in `collect-strings.js`.

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
          'UIStrings object literals are not allowed to have phrases that are fully locked, or consist only of a single placeholder.',
      category: 'Possible Errors',
    },
    schema: []  // no options
  },
  create: function(context) {
    return {
      VariableDeclarator(variableDeclarator) {
        if (!isModuleScope(context)) {
          return;
        }

        if (variableDeclarator.id.type !== 'Identifier' && variableDeclarator.name !== 'UIStrings') {
          return;
        }

        if (variableDeclarator.init?.type !== 'ObjectExpression') {
          return;
        }

        for (const property of variableDeclarator.init.properties) {
          if (property.type !== 'Property' || property.value.type !== 'Literal') {
            continue;
          }

          if (FULLY_LOCKED_PHRASE_REGEX.test(property.value.value)) {
            context.report({
              node: property.value,
              message: 'Locking whole phrases is not allowed. Use i18n.i18n.lockedString instead.',
            });
          } else if (SINGLE_PLACEHOLDER_REGEX.test(property.value.value)) {
            context.report({
              node: property.value,
              message: 'Single placeholder only pharses are not allowed. Use i18n.i18n.lockedString instead.',
            });
          }
        }
      },
    };
  }
};
