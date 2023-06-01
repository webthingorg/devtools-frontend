// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Track context.save() and context.restores() across scopes',
      category: 'Possible Errors',
    },
    fixable: 'code',
    messages: {
      mismatchedContext:
        'Found a block that has different counts for context.save() and context.restore()',
    },
    schema: [], // no options
  },
  create: function (context) {
    // To track canvas calls across scopes we keep a stack which we push nodes on with every new scope that we find.
    // When we then leave a scope, we can check all the calls in that scope and see if they align or not.
    /** @type {Array<ASTNode>} */
    let stack = [];

    // The key is a node's range as a string. The value is an object tracking context.save() and context.restore() calls
    /** @type {Map<string, {save: number, restore: number}}>} */
    const scopeToCanvasCalls = new Map();

    function nodeToKeyForMap(node) {
      return JSON.stringify(node.range);
    }

    function enterScope(node) {
      stack.push(node);
    }

    /**
     * Pops the last block scope and checks it for a mismatch of save and restore calls.
     */
    function exitScope() {
      const lastScope = stack.pop();
      const callsForCurrentScope = scopeToCanvasCalls.get(
        nodeToKeyForMap(lastScope)
      );

      // No calls to save() or restore(), so we have no errors to report.
      if (!callsForCurrentScope) {
        return;
      }

      // Error if the number of saves does not match the number of restores within this scope.
      if (callsForCurrentScope.save !== callsForCurrentScope.restore) {
        context.report({
          node: lastScope,
          messageId: 'mismatchedContext',
        });
      }
    }

    /**
     * Updates the counter for the current scope.
     * @param {'save'|'restore'} methodName
     **/
    function trackContextCall(methodName) {
      const currentScopeNode = stack.at(-1);
      const callsForCurrentScope = scopeToCanvasCalls.get(
        nodeToKeyForMap(currentScopeNode)
      ) || { save: 0, restore: 0 };

      callsForCurrentScope[methodName]++;
      scopeToCanvasCalls.set(
        nodeToKeyForMap(currentScopeNode),
        callsForCurrentScope
      );
    }

    return {
      Program(node) {
        stack = [node];
      },
      MemberExpression(node) {
        const methodCallsToTrack = ['save', 'restore'];
        // this is how we match context.save() and context.restore() calls
        if (
          node.object?.name === 'context' &&
          methodCallsToTrack.includes(node.property?.name)
        ) {
          trackContextCall(node.property.name);
        }
      },
      // All the different types of scope we have to deal with.
      BlockStatement: enterScope,
      'BlockStatement:exit': exitScope,
      ForStatement: enterScope,
      'ForStatement:exit': exitScope,
      ForInStatement: enterScope,
      'ForInStatement:exit': exitScope,
      ForOfStatement: enterScope,
      'ForOfStatement:exit': exitScope,
      SwitchStatement: enterScope,
      'SwitchStatement:exit': exitScope,
      CatchClause: enterScope,
      'CatchClause:exit': exitScope,
      StaticBlock: enterScope,
      'StaticBlock:exit': exitScope,
    };
  },
};
