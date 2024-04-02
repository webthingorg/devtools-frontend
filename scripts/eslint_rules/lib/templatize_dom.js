// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Rule to check ES import usage
 * @author Tim van der Lippe
 */
'use strict';

function isIdentifier(node, name) {
  return node.type === 'Identifier' && (Array.isArray(name) ? name.includes(node.name) : node.name === name);
}

function isMemberExpression(node, objectPredicate, propertyPredicate) {
  return node.type === 'MemberExpression' && objectPredicate(node.object) && propertyPredicate(node.property);
}

const ELEMENT_PROPERTIES = ['className', 'textContent'];
const ELEMENT_SETTERS = ['setAttribute', 'addEventListener', 'appendChild'];

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Templatize manually constructed DOM',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: []  // no options
  },
  create: function(context) {
    const targetVars = [];
    const sourceCode = context.getSourceCode();
    function toOutputString(node) {
      if (node.type === 'Literal') {
        return node.value;
      }
      const text = sourceCode.getText(node);
      if (node.type === 'TemplateLiteral') {
        return text.substr(1, text.length - 2);
      }
      return '${' + text  + '}';
    }
    function attributeValue(node) {
      const outputString = toOutputString(node);
      if (outputString.startsWith('${') && outputString.endsWith('}')) {
        return outputString;
      }
      return '"' + outputString + '"';
    }

    function buildTemplateLiteral(dtReplacement, startCol) {
      return ['LitHtml.html`', ...buildTemplateLiteralComponents(dtReplacement, startCol + 'LitHtml.html`'.length), '`'].join('');
    }

    function buildTemplateLiteralComponents(dtReplacement, startCol) {
      const components = ['<', toOutputString(dtReplacement.tagName)];
      if (dtReplacement.className) {
        components.push(` class=${attributeValue(dtReplacement.className)}`);
      }
      for (const attribute of dtReplacement.attributes || []) {
        components.push(` ${toOutputString(attribute.key)}=${attributeValue(attribute.value)}`);
      }
      for (const eventListener of dtReplacement.eventListeners || []) {
        components.push(` @${toOutputString(eventListener.key)}=${attributeValue(eventListener.value)}`);
      }
      components.push('>');
      if (dtReplacement.textContent) {
        components.push(toOutputString(dtReplacement.textContent));
      }
      for (const child of dtReplacement.children || []) {
        if (child.DT_replacement) {
          components.push(...buildTemplateLiteralComponents(child.DT_replacement));
        } else {
          components.push('\n child var: ' + sourceCode.getText(child.identifiers[0]));
        }

      }
      components.push('</', toOutputString(dtReplacement.tagName), '>');

      return components;
    }

    return {
      VariableDeclaration(node) {
        for (const declaration of node.declarations) {
          if (declaration.init?.type === 'CallExpression' &&
              isMemberExpression(
                  declaration.init.callee, //
                  n => isIdentifier(n, 'document'), n => isIdentifier(n, 'createElement'))) {
            const variables = context.getDeclaredVariables(declaration);
            for (const variable of variables) {
              variable.DT_replacement = {tagName: declaration.init.arguments[0]};
              targetVars.push(variable);
            }
          }
        }
      },
      'Program:exit'() {
        for (const variable of targetVars ) {
          for (const reference of variable.references) {
            const parent = reference.identifier.parent;
            if (parent.type === 'MemberExpression' && isIdentifier(parent.property, ELEMENT_PROPERTIES) &&
                parent.parent.type === 'AssignmentExpression' && parent.parent.left === parent) {
              variable.DT_replacement[parent.property.name] = parent.parent.right;
            }
            if (parent.type === 'MemberExpression' && isIdentifier(parent.property, ELEMENT_SETTERS) &&
                parent.parent.type === 'CallExpression' && parent.parent.callee === parent) {
              if (parent.property.name === 'setAttribute') {
                variable.DT_replacement.attributes = variable.DT_replacement.attributes || [];
                variable.DT_replacement.attributes.push(
                    {key: parent.parent.arguments[0], value: parent.parent.arguments[1]});
              }
              if (parent.property.name === 'addEventListener') {
                variable.DT_replacement.eventListeners = variable.DT_replacement.eventListeners || [];
                variable.DT_replacement.eventListeners.push(
                    {key: parent.parent.arguments[0], value: parent.parent.arguments[1]});
              }
              if (parent.property.name === 'appendChild' && parent.parent.arguments.length === 1 && parent.parent.arguments[0].type === 'Identifier') {
                const childVariableName = parent.parent.arguments[0].name;
                let childVariable = null;
                let scope = reference.from;
                while (!childVariable && scope) {
                  childVariable = scope.variables.find(v => v.name === childVariableName);
                  scope = scope.upper;
                }
                if (childVariable) {
                  variable.DT_replacement.children = variable.DT_replacement.children || [];
                  variable.DT_replacement.children.push(childVariable);
                }
              }
            }
          }
        }
        for (const variable of targetVars) {
          for (const identifier of variable.identifiers) {
            context.report({
              node: identifier,
              message: 'Missing semicolon',
              fix(fixer) {
                return fixer.insertTextAfter(identifier, ` = ${buildTemplateLiteral(variable.DT_replacement, sourceCode.getLocFromIndex(identifier.range[1] + 3))}; //`);
              }
            });
          }
        }
      },
    };
  }
};
