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

function lookForParentWasShownMethod(node) {
  for (let i = 0; i < node.body.length; i++) {
    const methodDefinition = node.body[i];
    if (methodDefinition.key.name === 'wasShown') {
      return methodDefinition;
    }
  }
  return null;
}

function lookForRegisterCSSFilesCall(node) {
  console.log(node.body);
  for (let i = 0; i < node.body.length; i++) {
    const expressionStatement = node.body[i];
    if (expressionStatement.expression.callee.property.name === 'registerCSSFiles') {
      return expressionStatement.expression;
    }
  }
  return null;
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
        if (node.expression.type === 'CallExpression' && (node.expression.callee.object.type === 'ThisExpression' || node.expression.callee.object.type === 'MemberExpression') &&
            node.expression.callee.property.name === 'registerRequiredCSS') {
          /* Construct 'import componentStyles form './componentStyles.css.js'' statement */
          const privateProperty = node.expression.callee.object.property;
          const filenameWithExtension = node.expression.arguments[0].value;
          const filename = path.basename(filenameWithExtension, '.css');
          const newFileName = filename + 'Styles';
          const importStatement = `import ${newFileName} from \'./${filename + '.css.js'}\';\n`;
          const programNode = context.getAncestors()[0];
          const privatePropertyName = privateProperty ? node.expression.callee.object.property.name + '.' : '';

          try {
            /* Construct or add to wasShown method */
            const classBodyNode = lookForParentClassBodyNode(node);

            const registerCSSFilesText = `\n    this.${privatePropertyName}registerCSSFiles([${newFileName}]);`;

            const wasShownFunction = lookForParentWasShownMethod(classBodyNode);
            if (wasShownFunction) {
              /* If a wasShown() method exists then it adds the registerCSSFiles() to the second line. */
              const registerCSSFilesCall = lookForRegisterCSSFilesCall(wasShownFunction.value.body);

              if(registerCSSFilesCall){
                const firstArg = registerCSSFilesCall.arguments[0].elements[0];

                context.report({
                  node,
                  message: 'Import CSS file instead of using registerRequiredCSS and edit wasShown method',
                  fix(fixer) {
                    return [
                      fixer.insertTextBefore(programNode, importStatement),
                      fixer.insertTextBefore(firstArg, newFileName + ', '), fixer.remove(node)
                    ];
                  }
                });

                return;
              }

              context.report({
                node,
                message: 'Import CSS file instead of using registerRequiredCSS and edit wasShown method',
                fix(fixer) {
                  return [
                    fixer.insertTextBefore(programNode, importStatement),
                    fixer.insertTextAfter(wasShownFunction.value.body.body[0], registerCSSFilesText), fixer.remove(node)
                  ];
                }
              });

              return;
            }

            /* wasShown method does not exist and has to be added as the last method in the class. */
            const lastMethodDeclarationNode = classBodyNode.body[classBodyNode.body.length - 1];
            const wasShownText = `\n  wasShown(): void {
    super.wasShown();${registerCSSFilesText}\n  }`;
            context.report({
              node,
              message: 'Import CSS file instead of using registerRequiredCSS and add wasShown method',
              fix(fixer) {
                return [
                  fixer.insertTextBefore(programNode, importStatement),
                  fixer.insertTextAfter(lastMethodDeclarationNode, wasShownText), fixer.remove(node)
                ];
              }
            });

          } catch (error) {
            context.report({
              node,
              message:
                  `Please manually migrate ${filenameWithExtension} as it has edge cases not covered by this script.`,
            });
          }
        }
      }
    };
  }
};
