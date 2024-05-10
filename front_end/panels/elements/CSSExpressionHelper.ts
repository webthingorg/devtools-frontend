// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as SDK from '../../core/sdk/sdk.js';

import {
  ASTUtils,
  BottomUpTreeMatching,
  tokenizeDeclaration,
  type VariableMatch,
  VariableMatcher,
} from './PropertyParser.js';

/**
 * Resolves CSS expressions with `var()` references
 * in the context of the given `matchedStyles` starting from
 * the given `style`.
 *
 * Returns `null` for CSS expressions that
 * - contains invalid cycles (`--a: var(--a)`)
 * - contains unresolved variables (`var(--non-existent)`)
 *
 */
export function resolveCSSExpressionWithVar(
    matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, style: SDK.CSSStyleDeclaration.CSSStyleDeclaration,
    expression: string): string|null {
  type VariableResolutionContext = {
    // Referenced variable names in order.
    path: string[],
    // Whether current variable resolution chain has a cycle.
    hasCycle: boolean,
    // Whether there are unresolved vars in the current chain or not.
    hasUnresolvedVars: boolean,
    // Current style declaration we resolve the variable for.
    style: SDK.CSSStyleDeclaration.CSSStyleDeclaration,
  };

  const resolveVariable = (match: VariableMatch, context: VariableResolutionContext): string|null => {
    if (context.path.includes(match.name)) {
      // We already referenced this variable before in this chain.
      // So, it is a cycle.
      context.hasCycle = true;
      return null;
    }

    const value = matchedStyles.getVariableValue(context.style, match.name);
    if (!value) {
      return null;
    }

    // We need to evaluate the next expression in the context of the resolved
    // variable declaration's style.
    // See this example:
    // * `div { color: var(--color); --text-color: red; } html { --color: var(--text-color); --text-color: blue; }`
    // The resolution of `--color` variable in the `div` rule points to the `--color: var(--text-color)`
    // declaration in the `html` rule and the value of CSS variables in that context is different than the context
    // we started from. So, `var(--color)` reference actually points to `blue`.
    if ('ownerStyle' in value.declaration) {
      context.style = value.declaration.ownerStyle;
    } else {
      context.style = value.declaration.style();
    }

    context.path.push(match.name);
    const result = innerResolveCSSExpressionWithVar(value.value, context);
    context.path.pop();
    return result;
  };

  const fallbackValue = (match: VariableMatch): string|null => {
    if (match.fallback.length === 0 || match.fallback.some(node => match.matching.hasUnresolvedVars(node))) {
      return null;
    }
    return match.fallback.map(node => match.matching.getComputedText(node)).join(' ');
  };

  const innerResolveCSSExpressionWithVar =
      (currentExpression: string, context: VariableResolutionContext): string|null => {
        const ast = tokenizeDeclaration('--ignored', currentExpression);
        if (!ast) {
          return null;
        }

        const matching = BottomUpTreeMatching.walk(ast, [new VariableMatcher((match: VariableMatch) => {
                                                     return resolveVariable(match, context) ?? fallbackValue(match);
                                                   })]);

        const decl = ASTUtils.siblings(ASTUtils.declValue(matching.ast.tree));
        const hasUnresolvedVars = matching.hasUnresolvedVarsRange(decl[0], decl[decl.length - 1]);
        context.hasUnresolvedVars = context.hasUnresolvedVars || hasUnresolvedVars;
        return matching.getComputedTextRange(decl[0], decl[decl.length - 1]);
      };

  const initialContext = {
    path: [],
    hasUnresolvedVars: false,
    hasCycle: false,
    style,
  };
  const result = innerResolveCSSExpressionWithVar(expression, initialContext);
  if (initialContext.hasUnresolvedVars) {
    return null;
  }

  return result;
}
