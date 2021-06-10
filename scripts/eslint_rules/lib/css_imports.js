// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

/**
 * @fileoverview Prevent usage of customElements.define() and use the helper
 * function instead
 */

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'check CSS file imports',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: []  // no options
  },
  create: function(context) {
    return {
      ImportDeclaration(node) {
        const importedFile = node.source.value;

        if (importedFile.endsWith('.css.js')) {
          const importPath = path.resolve(context.getFilename());
          const cssFile = importedFile.replace('.js', '');

          const pathToFile = importPath.substring(0, importPath.lastIndexOf('/'));
          const importedFilePath = path.join(pathToFile, cssFile);

          if (!fs.existsSync(importedFilePath)) {
            context.report(
                {node, message: `File ${cssFile} does not exist. Check you are importing the correct file.`});
          }
        }
      }
    };
  }
};
