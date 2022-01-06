// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that no methods that are used as LitHtml events are bound.',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: [],  // no options
    messages: {
      nonRenderBindFound:
          'Found bound method name {{ methodName }} on {{ componentName }} that was not `render`. Lit-Html binds all event handlers for you automatically so this is not required.',
    },
  },
  create: function(context) {
    function nodeIsHTMLElementClassDeclaration(node) {
      return node.type === 'ClassDeclaration' && node.superClass && node.superClass.name === 'HTMLElement';
    }

    function checkPropertyDeclarationForBinding(className, node) {
      if (!node.value || node.value.type !== 'CallExpression') {
        return;
      }
      if (node.value.callee.type !== 'MemberExpression') {
        return;
      }
      if (node.value.callee.property.name !== 'bind') {
        return;
      }
      // At this point we know it's a property of the form:
      //  someBoundThing = this.thing.bind(X)
      // and now we want to check that the argument passed to bind is `this`.
      // If the argument to bind is not `this`, we leave it be and move on.
      if (node.value.arguments[0]?.type !== 'ThisExpression') {
        return;
      }

      // At this point it's definitely of the form:
      //  someBoundThing = this.thing.bind(this)
      // and now if `thing` is not `render` (we have to bind render for the
      // scheduler), we should error.
      if (node.value.callee.object.property.name === 'render') {
        return;
      }

      context.report({
        node: node,
        messageId: 'nonRenderBindFound',
        data: {componentName: className, methodName: node.value.callee.object.property.name}
      });
    }

    return {
      ClassDeclaration(classDeclarationNode) {
        if (!nodeIsHTMLElementClassDeclaration(classDeclarationNode)) {
          return;
        }

        const classPropertyDeclarations = classDeclarationNode.body.body.filter(node => {
          return node.type === 'PropertyDefinition';
        });
        for (const decl of classPropertyDeclarations) {
          checkPropertyDeclarationForBinding(classDeclarationNode.id.name, decl);
        }
      }
    };
  }
};
