// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// True if the callExpression is `i18n.i18n.registerUIStrings`.
function isObservableSignalCall(callExpression) {
  if (callExpression.callee?.property?.name !== 'signal') {
    return false;
  }
  if (callExpression.callee?.object?.name === 'CodeMirror') {
    return false;
  }
  return true;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'The Observable.signal method must be called with a method name in the first argument position',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: [],
  },
  create: function(context) {
    return {
      CallExpression(callExpression) {
        if (!isObservableSignalCall(callExpression)) {
          return;
        }

        if (callExpression.arguments.length === 0) {
          return;
        }

        if (callExpression.arguments[0].type !== 'Literal') {
          context.report({
            node: callExpression,
            message:
                'First argument to \'Observable.signal\' call must be a string literal denoting a method name of the Observer interface.',
          });
        }
        if (callExpression.typeParameters !== undefined) {
          context.report({
            node: callExpression,
            message:
                'Specifying type parameters to \'Observable.signal\' might introduce unsoundness and is not allowed.',
          });
        }
      }
    };
  }
};
