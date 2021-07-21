// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const path = require('path');

function lookForParentClassBodyNode(node) {
  if (!node.parent) {
    /**
    * If there is no parent node, we didn't find the class for the call to registerRequiredCSS.
    * We will catch this null with a try catch and ask the file to be migrated manually.
    **/

    return null;
  }

  if (node.type === 'ClassBody') {
    /**
     * We have found the node that is the body of the class and where we need to add a wasShown method. */
    return node;
  }

  return lookForParentClassBodyNode(node.parent);
}

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Checks wasShown() method definitions call super.wasShown();',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: []  // no options
  },
  create: function(context) {
    return {
      ExpressionStatement(node) {
        if (node.expression.type === 'CallExpression' &&
            node.expression.callee.property.name === 'registerRequiredCSS') {
          const filenameWithExtension = node.expression.arguments[0].value;
          const filename = path.basename(filenameWithExtension, '.css');
          const importStatement = `import ${filename + 'Styles'} from \'./${filename + '.css.js'}\';\n`;
          const programNode = context.getAncestors()[0];
          const classBodyNode = lookForParentClassBodyNode(node);
          if (!classBodyNode) {
            throw new Error(`File cannot be migrated, manually migrate ${filenameWithExtension}`);
          }

          const lastMethodDeclarationNode = classBodyNode.body[classBodyNode.body.length - 1];
          const wasShownText = `\n  wasShown() : void {
    super.wasShown();
    this.adoptedStyleSheets = [${filename + 'Styles'}];
  }`;
          context.report({
            node,
            message: 'Import CSS file instead of using registerRequiredCSS',
            fix(fixer) {
              return [
                fixer.insertTextBefore(programNode, importStatement),
                fixer.insertTextAfter(lastMethodDeclarationNode, wasShownText), fixer.remove(node)
              ];
            }

          });
        }
      }
    };
  }
};
