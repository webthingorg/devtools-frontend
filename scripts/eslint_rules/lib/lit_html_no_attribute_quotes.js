// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

function isLitHtmlTemplateCall(taggedTemplateExpressionNode) {
  // Match LitHtml.html``
  const {tag} = taggedTemplateExpressionNode;
  if (!tag) {
    return false;
  }
  // Match LitHtml.html``
  const isLitHtmlDotHtmlCall = tag.object?.name === 'LitHtml' && tag.property?.name === 'html';
  // Match html`` (and guess that it's Lit)
  const isDestructuredHtmlCall = tag.type === 'Identifier' && tag.name === 'html';

  return isLitHtmlDotHtmlCall || isDestructuredHtmlCall;
}

function templateElementPartStartsWithDoubleQuote(templateElementPartNode) {
  return templateElementPartNode.value.raw.startsWith('"');
}
function templateElementPartEndsWithEqualsDoubleQuote(templateElementPartNode) {
  return templateElementPartNode.value.raw.endsWith('="');
}

module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'ensure no extra quotes around attributes when the value is interpolated',
      category: 'Possible Errors',
    },
    fixable: 'code',
    messages: {
      attributeQuotesNotRequired: 'TODO',
    },
    schema: []  // no options
  },
  create: function(context) {
    return {
      TaggedTemplateExpression(node) {
        if (!isLitHtmlTemplateCall(node)) {
          return;
        }

        node.quasi.quasis.forEach((templateElement, index) => {
          if (templateElementPartEndsWithEqualsDoubleQuote(templateElement)) {
            const nextElement = node.quasi.quasis[index + 1];
            if (nextElement && templateElementPartStartsWithDoubleQuote(nextElement)) {
              const expressionBetweenTheParts = node.quasi.expressions[index];
              context.report({
                node: expressionBetweenTheParts,
                messageId: 'attributeQuotesNotRequired',
                // TODO(jacktfranklin): seems to be an ESLint bug that means autofix can't work properly
                // fix(fixer) {
                //   const elementWithLastQuoteRemoved = templateElement.value.raw.substring(0, templateElement.value.raw.length - 1);
                //   const nextElementWithFirstQuoteRemoved = nextElement.value.raw.substring(1, nextElement.value.raw.length);
                //   return [
                //     fixer.replaceText(templateElement, elementWithLastQuoteRemoved),
                //     fixer.replaceText(nextElement, nextElementWithFirstQuoteRemoved)
                //   ];
                // }

              });
            }
          }
        });
      },
    };
  }
};
