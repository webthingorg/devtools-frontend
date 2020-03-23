// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as ts from 'typescript';

export const nodeIsPrimitive = (node: ts.TypeNode): boolean => {
  return [
    ts.SyntaxKind.NumberKeyword,
    ts.SyntaxKind.StringKeyword,
    ts.SyntaxKind.BooleanKeyword,
    ts.SyntaxKind.AnyKeyword,
    ts.SyntaxKind.UnknownKeyword,
  ].includes(node.kind);
};

export const valueForTypeNode = (node: ts.TypeNode, isFunctionParam: boolean = false): string => {
  let value = '';

  if (ts.isTypeReferenceNode(node)) {
    value = (node.typeName as ts.Identifier).escapedText.toString();
  } else if (ts.isArrayTypeNode(node)) {
    // TODO: hardcoding ! here is bad?
    const isPrimitive = nodeIsPrimitive(node.elementType);
    const modifier = isPrimitive ? '' : '!';
    value = `Array.<${modifier}${valueForTypeNode(node.elementType)}>`;
  } else if (node.kind === ts.SyntaxKind.NumberKeyword) {
    value = 'number';
  } else if (node.kind === ts.SyntaxKind.StringKeyword) {
    value = 'string';
  } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
    value = 'boolean';
  } else if (node.kind === ts.SyntaxKind.UnknownKeyword || node.kind === ts.SyntaxKind.AnyKeyword) {
    value = '*';
  } else if (node.kind === ts.SyntaxKind.VoidKeyword) {
    value = 'void';
  } else if (ts.isUnionTypeNode(node)) {
    const isNullUnion = node.types.some(n => n.kind === ts.SyntaxKind.NullKeyword);

    if (isNullUnion) {
      if (node.types.length > 2) {
        // TODO: what if it's string | number | null? This assumes just primitive | null
        throw new Error('Union types with null and > 1 other types are not yet supported.');
      }

      const notNullNode = node.types.find(n => n.kind !== ts.SyntaxKind.NullKeyword);

      // if it's primitive|null, return ?primitive
      if (nodeIsPrimitive(notNullNode)) {
        const value = valueForTypeNode(notNullNode);
        return `?${value}`;
      }
      /* for non primitives, we return !Foo|undefined
       * if we are in an interface
       * but still ?Foo for parameters
       */
      const value = valueForTypeNode(notNullNode);
      return isFunctionParam ? `?${value}` : `!${value}|undefined`;
    }

    const parts = node.types.map(n => valueForTypeNode(n, isFunctionParam));
    return parts.join('|');
  } else if (ts.isFunctionTypeNode(node)) {
    const returnType = valueForTypeNode(node.type);
    const params = node.parameters
                       .map(param => {
                         if (!param.type) {
                           return '';
                         }
                         return valueForTypeNode(param.type);
                       })
                       .join(', ');

    value = `function(${params}): ${returnType}`;
  } else {
    throw new Error(`Unsupported node kind: ${ts.SyntaxKind[node.kind]}`);
  }
  return value;
};
