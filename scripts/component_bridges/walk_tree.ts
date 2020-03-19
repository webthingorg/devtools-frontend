// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ts from 'typescript';

export interface WalkerState {
  foundInterfaces: Set<ts.InterfaceDeclaration>;
  componentClass?: ts.ClassDeclaration;
  publicMethods: Set<ts.MethodDeclaration>;
  customElementsDefineCall?: ts.ExpressionStatement;
}

export const walkTree = (node: ts.Node, state?: WalkerState) => {
  if (!state) {
    state = {
      foundInterfaces: new Set(),
      publicMethods: new Set(),
      componentClass: undefined,
      customElementsDefineCall: undefined,
    };
  }

  if (ts.isClassDeclaration(node)) {
    const classNode = node as ts.ClassDeclaration;
    const extendsHtmlElement = classNode.heritageClauses && classNode.heritageClauses.find(clause => {
      return clause.types.find(clauseType => {
        if (ts.isIdentifier(clauseType.expression)) {
          return clauseType.expression.escapedText === 'HTMLElement';
        }
        return false;
      });
    });

    if (extendsHtmlElement) {
      state.componentClass = classNode;
      // now we know this is the component, hunt for its public methods
      classNode.members.forEach(member => {
        if (ts.isMethodDeclaration(member)) {
          const isPrivate =
              member.modifiers && member.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword);
          if (!isPrivate) {
            state.publicMethods.add(member);
          }
        }
      });
    }

  } else if (ts.isInterfaceDeclaration(node)) {
    state.foundInterfaces.add(node);
  } else if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
    if (ts.isPropertyAccessExpression(node.expression.expression)) {
      const propertyAcess = node.expression.expression;

      const leftSideText = (propertyAcess.expression as ts.Identifier).escapedText as string;
      const rightSideText = (propertyAcess.name as ts.Identifier).escapedText as string;

      if (leftSideText === 'customElements' && rightSideText === 'define') {
        state.customElementsDefineCall = node;
      }
    }
  }

  node.forEachChild(node => {
    walkTree(node, state);
  });

  return state;
};
