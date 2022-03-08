// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

/**
 * @fileoverview Prevent importing SVG urls from the `src` directory, and
 * ensure they are read from `Images/foo.svg`.
 * Images in the `src/` directory are minified and put into `Images/` as part
 * of the build process, so we should never import from 'src'.
 */

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'ensure image imports do not include the src/ directory',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: [],
    messages: {
      imageImportUsingSrc: 'sdlfkj',
    },
  },
  create: function(context) {
    return {
      // Matches new URL(...)
      'NewExpression[callee.name=\'URL\']'(node) {
        /** @type {String} */
        const filePath = node.arguments[0].value;
        if (!filePath) {
          return;
        }
        if (filePath.includes('Images/src/')) {
          context.report({
            node: node.arguments[0],
            messageId: 'imageImportUsingSrc',
            fix(fixer) {
              return fixer.replaceText(node.arguments[0], `'${filePath.replace('Images/src/', 'Images/')}'`);
            }
          });
        }
      }
    };
  }
};
