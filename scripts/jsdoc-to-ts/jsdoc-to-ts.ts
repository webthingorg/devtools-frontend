// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {execSync} from 'child_process';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsTypes(type: ts.Type, flags: ts.TypeFlags, checker: ts.TypeChecker): boolean {
  if (type.flags & ts.TypeFlags.Object && (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
    const typeArguments = checker.getTypeArguments(type as ts.TypeReference);
    return Boolean(typeArguments.find(t => containsTypes(t, flags, checker)));
  }

  return Boolean(type.flags & flags);
}

export function getTextWithoutIdentation(text: string, offset: number = 0) {
  const m = text.match(/\S*\n?(\s*)/);
  const numberOfSpaces = m && m[1].length || 0;
  const whiteSpaceToRemove = new RegExp(`^${' '.repeat(Math.max(numberOfSpaces - offset, 0))}`, 'gm');
  return text.replace(whiteSpaceToRemove, '');
}

export function removeUnusedJSDocTagsFromNode<T extends ts.Node>(
    node: T, jsDocTagsToRemove: ts.JSDocTag|ts.JSDocTag[]|readonly ts.JSDocTag[]|undefined): void {
  if (jsDocTagsToRemove === undefined) {
    return;
  }
  const tagsByNode = new Map<ts.Node, Set<ts.JSDocTag>>();
  const originalNode = ts.getOriginalNode(node);

  const tmp = 'length' in jsDocTagsToRemove ? jsDocTagsToRemove : [jsDocTagsToRemove];
  for (const tag of tmp) {
    const parent = tag.parent.parent === originalNode ? node : tag.parent.parent;
    const set = tagsByNode.get(parent);
    if (!set) {
      tagsByNode.set(parent, new Set([tag]));
    } else {
      set.add(tag);
    }
  }

  for (const [jsDocTagNode, jsDocTags] of tagsByNode.entries()) {
    const originalNode = ts.getOriginalNode(jsDocTagNode);
    const sourceFile = originalNode.getSourceFile();

    function updateComment(comment: ts.CommentRange, text: string, jsDocTagsToRemove: Set<ts.JSDocTag>) {
      for (const tag of jsDocTagsToRemove) {
        text =
            text.replace(new RegExp('\\s*\\*\\s*' + escapeRegExp(tag.getFullText().replace(/\n\s*\*?\s*$/, ''))), '');
      }
      text = text.replace(/^\/\/|^\/\*|\*\/$/g, '');
      text = text.replace(/\*\s+$/, '');  // Remove last star that might be left over;
      text = getTextWithoutIdentation(text, 1);
      if (!text.match(/^[\s|\*]*$/)) {
        ts.addSyntheticLeadingComment(jsDocTagNode, comment.kind, text, comment.hasTrailingNewLine);
      }
    }

    const syntheticLeadingComments = ts.getSyntheticLeadingComments(jsDocTagNode);
    // Will be set if we already processed the node
    if (syntheticLeadingComments) {
      ts.setSyntheticLeadingComments(jsDocTagNode, []);
      for (const comment of syntheticLeadingComments) {
        updateComment(comment, comment.text, jsDocTags);
      }
    } else {
      const leadingComments = ts.getLeadingCommentRanges(sourceFile.text, originalNode.pos) || [];
      for (const comment of leadingComments) {
        const text = sourceFile.text.slice(comment.pos, comment.end);
        updateComment(comment, text, jsDocTags);
      }
      ts.setEmitFlags(jsDocTagNode, ts.EmitFlags.NoLeadingComments);
    }
  }
}

export function updateReturnType<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.FunctionDeclaration|ts.ArrowFunction|
    ts.MethodDeclaration|ts.FunctionExpression {
  if (!(ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) ||
        ts.isFunctionExpression(node))) {
    return node;
  }
  const originalNode = ts.getOriginalNode(node);

  if (node.type) {
    return node;
  }

  const signature = checker.getSignatureFromDeclaration(originalNode as ts.SignatureDeclaration);
  if (!signature) {
    return node;
  }
  const type = checker.getReturnTypeOfSignature(signature);
  const typeNode = checker.typeToTypeNode(type, originalNode, ts.NodeBuilderFlags.None);

  const returnTag = ts.getJSDocReturnTag(originalNode);

  if (!returnTag && ts.isCallOrNewExpression(originalNode.parent)) {
    return node;
  }

  removeUnusedJSDocTagsFromNode(node, returnTag);
  if (ts.isFunctionDeclaration(node)) {
    return context.factory.updateFunctionDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters,
        typeNode, node.body);
  }
  if (ts.isFunctionExpression(node)) {
    return context.factory.updateFunctionExpression(
        node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, typeNode, node.body);
  }
  if (ts.isArrowFunction(node)) {
    return context.factory.updateArrowFunction(
        node, node.modifiers, node.typeParameters, node.parameters, typeNode, node.equalsGreaterThanToken, node.body);
  }
  if (ts.isMethodDeclaration(node)) {
    return context.factory.updateMethodDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters,
        node.parameters, typeNode, node.body);
  }
  return node;
}

export function updateParameters<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.FunctionDeclaration|ts.ArrowFunction|
    ts.MethodDeclaration|ts.ConstructorDeclaration|ts.FunctionExpression {
  if (!(ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) ||
        ts.isFunctionExpression(node) || ts.isConstructorDeclaration(node))) {
    return node;
  }

  const originalNode = ts.getOriginalNode(node);
  const jsDocTagsToRemove: ts.JSDocTag[] = [];
  const parameters = node.parameters.map((parameter: ts.ParameterDeclaration) => {
    const jsDocTags = ts.getJSDocParameterTags(parameter);

    if (!jsDocTags.length && ts.isCallOrNewExpression(originalNode.parent)) {
      return parameter;
    }

    const type = checker.getTypeAtLocation(parameter);
    let typeNode = checker.typeToTypeNode(type, ts.getOriginalNode(node), ts.NodeBuilderFlags.None);
    if (!typeNode) {
      return parameter;
    }
    jsDocTagsToRemove.push(...jsDocTags);

    const isOptional = jsDocTags.find(tag => tag.typeExpression && ts.isJSDocOptionalType(tag.typeExpression.type));
    const questionToken =
        isOptional && !parameter.initializer ? context.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined;

    if (questionToken && ts.isUnionTypeNode(typeNode)) {
      const types = typeNode.types.filter(node => node.kind !== ts.SyntaxKind.UndefinedKeyword);
      typeNode = context.factory.updateUnionTypeNode(typeNode, context.factory.createNodeArray(types));
    }

    return context.factory.updateParameterDeclaration(
        parameter, parameter.decorators, parameter.modifiers, parameter.dotDotDotToken, parameter.name, questionToken,
        typeNode, parameter.initializer);
  });

  removeUnusedJSDocTagsFromNode(node, jsDocTagsToRemove);
  if (ts.isFunctionDeclaration(node)) {
    return context.factory.updateFunctionDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, parameters,
        node.type, node.body);
  }
  if (ts.isFunctionExpression(node)) {
    return context.factory.updateFunctionExpression(
        node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, parameters, node.type, node.body);
  }
  if (ts.isArrowFunction(node)) {
    return context.factory.updateArrowFunction(
        node, node.modifiers, node.typeParameters, parameters, node.type, node.equalsGreaterThanToken, node.body);
  }
  if (ts.isMethodDeclaration(node)) {
    return context.factory.updateMethodDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters,
        parameters, node.type, node.body);
  }
  if (ts.isConstructorDeclaration(node)) {
    return context.factory.updateConstructorDeclaration(node, node.decorators, node.modifiers, parameters, node.body);
  }
  return node;
}

export function updateThisDeclaration<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.FunctionDeclaration|ts.ArrowFunction|
    ts.MethodDeclaration {
  if (!(ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node))) {
    return node;
  }
  const originalNode = ts.getOriginalNode(node);
  const tag = ts.getJSDocThisTag(originalNode);
  if (!tag) {
    return node;
  }

  const type = checker.getTypeFromTypeNode(tag.typeExpression.type);
  const typeNode = checker.typeToTypeNode(type, originalNode, ts.NodeBuilderFlags.None);

  const parameters = [
    context.factory.createParameterDeclaration(undefined, undefined, undefined, 'this', undefined, typeNode, undefined),
    ...node.parameters,
  ];
  removeUnusedJSDocTagsFromNode(node, tag);
  if (ts.isFunctionDeclaration(node)) {
    return context.factory.updateFunctionDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, parameters,
        node.type, node.body);
  }
  if (ts.isArrowFunction(node)) {
    return context.factory.updateArrowFunction(
        node, node.modifiers, node.typeParameters, parameters, node.type, node.equalsGreaterThanToken, node.body);
  }
  if (ts.isMethodDeclaration(node)) {
    return context.factory.updateMethodDeclaration(
        node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters,
        parameters, node.type, node.body);
  }
  return node;
}

export function updateInterfacesImplementations<T extends ts.Node>(context: ts.TransformationContext, node: T): T|
    ts.ClassDeclaration {
  if (!ts.isClassDeclaration(node)) {
    return node;
  }

  const originalNode = ts.getOriginalNode(node);
  const implementsTags = ts.getJSDocImplementsTags(originalNode);
  if (!implementsTags.length) {
    return node;
  }

  const implementedInterfaces = implementsTags.map(
      implementsTag => context.factory.createExpressionWithTypeArguments(implementsTag.class.expression, []));

  const heritageClauses = Array.from(node.heritageClauses || []);
  heritageClauses.push(context.factory.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, implementedInterfaces));

  removeUnusedJSDocTagsFromNode(node, implementsTags);
  return context.factory.updateClassDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters, heritageClauses, node.members);
}

export function updateInterfaceDeclarations<T extends ts.Node>(context: ts.TransformationContext, node: T): T|
    ts.InterfaceDeclaration {
  if (!ts.isClassDeclaration(node)) {
    return node;
  }

  const jsDocTags = ts.getJSDocTags(node);
  const interfaceTag = jsDocTags.find(tag => ts.isIdentifier(tag.tagName) && tag.tagName.text === 'interface');
  if (!interfaceTag) {
    return node;
  }

  const members = (node.members || []).map(member => {
    if (!ts.isMethodDeclaration(member)) {
      throw new Error();
    }

    return context.factory.createMethodSignature(
        member.modifiers, member.name, member.questionToken, member.typeParameters, member.parameters, member.type);
  });

  return context.factory.createInterfaceDeclaration(
      node.decorators, node.modifiers, node.name && ts.isIdentifier(node.name) ? node.name.text : 'Error',
      node.typeParameters, node.heritageClauses, members);
}

export function updateVariableDeclarations<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(node)) {
    return node;
  }
  const originalNode = ts.getOriginalNode(node);
  const typeTag = ts.getJSDocTypeTag(originalNode);

  if (!typeTag) {
    return node;
  }

  removeUnusedJSDocTagsFromNode(node, ts.getAllJSDocTags(node, ts.isJSDocTypeTag));

  if (node.initializer && ts.isParenthesizedExpression(node.initializer)) {
    // Nodes with an initializer will be type casted instead
    return node;
  }

  const type = checker.getTypeFromTypeNode(typeTag.typeExpression.type);
  if (type.flags & ts.TypeFlags.Any) {
    return node;
  }

  const typeNode = checker.typeToTypeNode(type, originalNode, ts.NodeBuilderFlags.None);

  if (typeNode && ts.isTypeReferenceNode(typeNode) && node.initializer && ts.isNewExpression(node.initializer)) {
    const typeArguments = typeNode.typeArguments;
    const initializer = context.factory.updateNewExpression(
        node.initializer, node.initializer.expression, typeArguments, node.initializer.arguments);
    return context.factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, initializer);
  }
  return context.factory.updateVariableDeclaration(node, node.name, node.exclamationToken, typeNode, node.initializer);
}

export function updateCast<T extends ts.Node>(context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|
    ts.AsExpression {
  if (!ts.isParenthesizedExpression(node)) {
    return node;
  }

  const originalTypeNode = ts.getOriginalNode(ts.getJSDocType(node)) as ts.TypeNode | null;
  if (!originalTypeNode) {
    return node;
  }

  const type = checker.getTypeFromTypeNode(originalTypeNode);
  const typeNode = checker.typeToTypeNode(type, ts.getOriginalNode(node), ts.NodeBuilderFlags.None);
  if (!typeNode) {
    throw new Error('Could not create type node.');
  }

  const newNode = context.factory.createAsExpression(
      node.expression,
      typeNode,
  );

  // The jsDoc comment will otherwise be emitted by
  // emitTokenWithComment for the equal sign of the
  // variable declaration.
  const variableDeclaration = ts.findAncestor(
      ts.getOriginalNode(node), n => ts.isVariableDeclaration(n) || ts.isBinaryExpression(n) || ts.isCallExpression(n));
  if (variableDeclaration) {
    ts.setEmitFlags(variableDeclaration, ts.EmitFlags.NoNestedComments);
    ts.setEmitFlags(variableDeclaration.parent, ts.EmitFlags.NoComments | ts.EmitFlags.NoNestedComments);
  }

  ts.setEmitFlags(node, ts.EmitFlags.NoComments | ts.EmitFlags.NoNestedComments | ts.EmitFlags.NoLeadingComments);

  return ts.setOriginalNode(newNode, node);
}

export function updatePropertyDeclarations<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.ClassDeclaration {
  if (!ts.isClassDeclaration(node)) {
    return node;
  }

  const classType = checker.getTypeAtLocation(node);
  if (!classType.isClass()) {
    throw new Error('Type expected to be class.');
  }
  const classSymbol = classType.getSymbol();
  if (!classSymbol) {
    throw new Error('Expected to get a symbol for class.');
  }
  const members = classSymbol.members;
  if (!members) {
    return node;
  }

  const propertyDeclarations: ts.PropertyDeclaration[] = [];
  members.forEach(property => {
    if (!(property.flags & ts.SymbolFlags.Property)) {
      return;
    }
    const propertyDeclaration = node.members.find((member: ts.Node) => {
      if (!ts.isPropertyDeclaration(member)) {
        return;
      }
      return checker.getSymbolAtLocation(member.name) === property;
    });

    // Skip if there is already a declaration
    if (propertyDeclaration) {
      return;
    }

    const type = checker.getTypeOfSymbolAtLocation(property, ts.getOriginalNode(node));
    let typeNode = checker.typeToTypeNode(type, ts.getOriginalNode(node), ts.NodeBuilderFlags.None);
    if (!typeNode) {
      return;
    }

    const declaration = property.declarations.find(d => ts.findAncestor(d, ts.isConstructorDeclaration));

    property.declarations.forEach(declaration => {
      removeUnusedJSDocTagsFromNode(declaration, ts.getJSDocTypeTag(property.declarations[0]));
    });

    let questionOrExclamationToken = undefined;
    if (declaration) {
      if (!ts.isBinaryExpression(declaration)) {
        questionOrExclamationToken = context.factory.createToken(ts.SyntaxKind.ExclamationToken);
      }
    } else {
      questionOrExclamationToken = context.factory.createToken(ts.SyntaxKind.QuestionToken);

      if (ts.isUnionTypeNode(typeNode)) {
        const types = typeNode.types.filter(node => node.kind !== ts.SyntaxKind.UndefinedKeyword);
        typeNode = context.factory.updateUnionTypeNode(typeNode, context.factory.createNodeArray(types));
      }
    }

    propertyDeclarations.push(context.factory.createPropertyDeclaration(
        undefined,
        undefined,
        property.name,
        questionOrExclamationToken,
        typeNode,
        undefined,
        ));
  });

  const classDeclaraionMembers = node.members.map(member => {
    if (!ts.isConstructorDeclaration(member)) {
      return member;
    }
    if (!member.body) {
      return member;
    }

    const statements = member.body.statements.filter(statement => {
      if (!ts.isExpressionStatement(statement)) {
        return true;
      }
      if (!ts.isPropertyAccessExpression(statement.expression)) {
        return true;
      }
      if (!ts.isToken(statement.expression.expression) ||
          statement.expression.expression.kind !== ts.SyntaxKind.ThisKeyword) {
        return true;
      }

      if (!members.has(statement.expression.name.escapedText)) {
        return true;
      }
      return false;
    });

    return context.factory.updateConstructorDeclaration(
        member, member.decorators, member.modifiers, member.parameters,
        member.body ? context.factory.updateBlock(member.body, statements) : undefined);
  });


  return context.factory.updateClassDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses,
      [...propertyDeclarations, ...classDeclaraionMembers]);
}

export function updateGenericsInSuperClass<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.ClassDeclaration {
  if (!ts.isClassDeclaration(node)) {
    return node;
  }

  const tag = ts.getJSDocAugmentsTag(ts.getOriginalNode(node));
  if (!tag) {
    return node;
  }

  const extendsSymbol = checker.getSymbolAtLocation(tag.class.expression);
  const type = checker.getTypeAtLocation(tag.class.expression);
  const heritageClauses = node.heritageClauses && node.heritageClauses.map((heritageClause: ts.HeritageClause) => {
    if (heritageClause.types.length !== 1) {
      throw new Error('Unsupported edge case.');
    }
    const symbol = checker.getSymbolAtLocation(heritageClause.types[0].expression);

    if (symbol !== extendsSymbol) {
      return heritageClause;
    }


    const typeNode = checker.typeToTypeNode(type, ts.getOriginalNode(node), ts.NodeBuilderFlags.None);
    if (!typeNode) {
      return heritageClause;
    }

    return context.factory.updateHeritageClause(heritageClause, [
      context.factory.createExpressionWithTypeArguments(
          tag.class.expression,
          tag.class.typeArguments &&
              tag.class.typeArguments.map(
                  typeArgument => ts.isJSDocNonNullableType(typeArgument) ? typeArgument.type : typeArgument),
          ),
    ]);
  });

  removeUnusedJSDocTagsFromNode<ts.ClassDeclaration>(node, tag);
  return context.factory.updateClassDeclaration(
      node, node.decorators, node.modifiers, node.name, node.typeParameters, heritageClauses, node.members);
}


export function updateTypeDefinitionsForLocalTypes<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(node)) {
    return node;
  }

  const originalNode = ts.getOriginalNode(node);
  if (!originalNode) {
    return node;
  }

  const symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) {
    return node;
  }

  const block = ts.findAncestor(originalNode, ts.isBlock);
  if (!block) {
    return node;
  }
  const types = new Set<ts.Type>();

  if (!node.initializer) {
    return node;
  }

  const visitor = (node: ts.Node): ts.Node|undefined => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const innerSymbol = checker.getSymbolAtLocation(node.left);
      if (innerSymbol === symbol) {
        const innerType = checker.getTypeAtLocation(node.right);
        if (innerType) {
          types.add(innerType);
        }
      }
    }

    return ts.forEachChild(node, visitor);
  };
  ts.forEachChild(block, visitor);
  // Append initializing type
  const assignedType = checker.getTypeAtLocation(node.initializer);
  const isInitializedFromFunction = ts.isCallExpression(node.initializer);
  if (isInitializedFromFunction || !types.size || (assignedType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Literal))) {
    return node;
  }

  types.add(assignedType);
  const typeNodes =
      Array.from(types.values())
          .filter(type => !(containsTypes(type, ts.TypeFlags.Any | ts.TypeFlags.Never, checker)))
          .map(type => checker.typeToTypeNode(type, block, ts.NodeBuilderFlags.UseSingleQuotesForStringLiteralType))
          .filter(t => t) as ts.TypeNode[];
  const typeNode = context.factory.createUnionTypeNode(typeNodes);

  return context.factory.updateVariableDeclaration(
      node,
      node.name,
      node.exclamationToken,
      typeNode,
      node.initializer,
  );
}

export function updateEnums<T extends ts.Node>(context: ts.TransformationContext, node: T): T|ts.EnumDeclaration {
  if (!ts.isVariableDeclaration(node) || !node.initializer) {
    return node;
  }
  const originalNode = ts.getOriginalNode(node) as ts.VariableDeclaration;

  const enumTag = ts.getJSDocEnumTag(originalNode);
  if (!enumTag) {
    return node;
  }

  if (!ts.isIdentifier(node.name)) {
    return node;
  }
  if (!ts.isObjectLiteralExpression(node.initializer)) {
    return node;
  }

  const members = node.initializer.properties.map(property => {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error('Things other than property assignments not supported in enums.');
    }
    const numberOfOccurences = parseInt(
        execSync(
            `grep -o -w ${
                property.name.getText()} -r ../../../../chromium/src/third_party/blink/web_tests/http/ | wc -l`,
            {encoding: 'utf8'}),
        10);
    console.log(property.name.getText(), numberOfOccurences);

    if (ts.isCallExpression(property.initializer) && ts.isIdentifier(property.initializer.expression) &&
        property.initializer.expression.escapedText === 'Symbol') {
      return context.factory.createEnumMember(
          property.name,
          property.initializer.arguments[0],
      );
    }
    return context.factory.createEnumMember(
        property.name,
        property.initializer,
    );
  });

  removeUnusedJSDocTagsFromNode(node, enumTag);
  return context.factory.createEnumDeclaration(
      node.decorators,
      node.modifiers,
      node.name,
      members,
  );
}

export function updateTypedefs<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.InterfaceDeclaration {
  if (!ts.isVariableStatement(node)) {
    return node;
  }
  const originalNode = ts.getOriginalNode(node) as ts.VariableDeclarationList;

  const typeDefTags = ts.getAllJSDocTagsOfKind(originalNode, ts.SyntaxKind.JSDocTypedefTag);
  if (!typeDefTags.length) {
    return node;
  }

  const typeDefTag = typeDefTags[0];
  if (!ts.isJSDocTypedefTag(typeDefTag) || !typeDefTag.typeExpression ||
      !ts.isJSDocTypeExpression(typeDefTag.typeExpression)) {
    return node;
  }

  const type = ts.isJSDocNonNullableType(typeDefTag.typeExpression.type) ? typeDefTag.typeExpression.type.type :
                                                                           typeDefTag.typeExpression.type;
  if (!ts.isTypeLiteralNode(type)) {
    return node;
  }

  const members = type.members.map(member => {
    if (!ts.isPropertySignature(member) || !member.type) {
      throw new Error('');
    }

    const type = checker.getTypeFromTypeNode(member.type);
    let questionToken = undefined;
    let typeNode = checker.typeToTypeNode(type, originalNode, ts.NodeBuilderFlags.UseSingleQuotesForStringLiteralType);

    if (typeNode && ts.isUnionTypeNode(typeNode)) {
      const types = typeNode.types.filter(
          typeNode => !(ts.isToken(typeNode) && typeNode.kind === ts.SyntaxKind.UndefinedKeyword));
      if (types.length !== typeNode.types.length) {
        questionToken = context.factory.createToken(ts.SyntaxKind.QuestionToken);
      }

      typeNode = context.factory.createUnionTypeNode(
          types,
      );
    }

    return context.factory.createPropertySignature(
        undefined,
        member.name,
        questionToken,
        typeNode,
    );
  });

  // @ts-ignore
  const name = node.declarationList.declarations[0].name.text;

  removeUnusedJSDocTagsFromNode(node, typeDefTag);
  const newNode =
      context.factory.createInterfaceDeclaration(undefined, node.modifiers, name, undefined, undefined, members);

  ts.setEmitFlags(newNode, ts.EmitFlags.NoNestedComments);
  removeUnusedJSDocTagsFromNode(newNode, typeDefTag);

  return newNode;
}

export function updateOverrides<T extends ts.Node>(context: ts.TransformationContext, node: T): T {
  const jsDocTags = ts.getJSDocTags(node);
  const overrideTag = jsDocTags.find(tag => ts.isIdentifier(tag.tagName) && tag.tagName.text === 'override');

  removeUnusedJSDocTagsFromNode(node, overrideTag);
  return node;
}

export function disableEslintRules<T extends ts.Node>(context: ts.TransformationContext, node: T): T {
  if (!ts.isSourceFile(node)) {
    return node;
  }

  if (!node.statements.length) {
    return node;
  }

  ts.addSyntheticLeadingComment(
      node.statements[0], ts.SyntaxKind.MultiLineCommentTrivia, ' eslint-disable rulesdir/no_underscored_properties ',
      true);
  ts.addSyntheticLeadingComment(node.statements[0], ts.SyntaxKind.SingleLineCommentTrivia, ' @empty-line', true);
  return node;
}

export function updateAccessDeclarations<T extends ts.Node>(context: ts.TransformationContext, node: T): T|
    ts.ConstructorDeclaration {
  const tag = ts.getJSDocPrivateTag(node) || ts.getJSDocProtectedTag(node);
  if (!tag) {
    return node;
  }

  const modifiers = Array.from(node.modifiers || []);
  if (ts.isJSDocPrivateTag(tag)) {
    modifiers.push(context.factory.createModifier(ts.SyntaxKind.PrivateKeyword));
  } else if (ts.isJSDocProtectedTag(tag)) {
    modifiers.push(context.factory.createModifier(ts.SyntaxKind.ProtectedKeyword));
  }

  removeUnusedJSDocTagsFromNode(node, tag);

  if (ts.isConstructorDeclaration(node)) {
    return context.factory.updateConstructorDeclaration(
        node,
        node.decorators,
        modifiers,
        node.parameters,
        node.body,
    );
  }

  return node;
}

export function updateMissingGenericsInMaps<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(node) || !node.initializer) {
    return node;
  }

  if (!ts.isNewExpression(node.initializer)) {
    return node;
  }
  if (!ts.isIdentifier(node.initializer.expression)) {
    return node;
  }
  if (node.initializer.expression.escapedText !== 'Map') {
    return node;
  }

  const originalNode = ts.getOriginalNode(node) as ts.VariableDeclaration;
  const block = ts.findAncestor(originalNode, ts.isBlock) || originalNode.getSourceFile();
  const symbol = checker.getSymbolAtLocation(originalNode.name);

  const visitor = (node: ts.Node): {keyType: ts.Type, valueType: ts.Type}|undefined => {
    const result = ts.forEachChild(node, visitor);
    if (result) {
      return result;
    }
    if (!ts.isCallExpression(node)) {
      return;
    }
    if (!ts.isPropertyAccessExpression(node.expression)) {
      return;
    }
    if (node.expression.name.escapedText !== 'set') {
      return;
    }

    const innerSymbol = checker.getSymbolAtLocation(ts.getOriginalNode(node.expression.expression));
    if (innerSymbol === symbol) {
      return {
        keyType: checker.getTypeAtLocation(node.arguments[0]),
        valueType: checker.getTypeAtLocation(node.arguments[1]),
      };
    }
    return;
  };

  const result = ts.forEachChild(block, visitor);
  if (!result) {
    return node;
  }
  const {keyType, valueType} = result;

  const keyTypeNode =
      checker.typeToTypeNode(keyType, node.initializer, ts.NodeBuilderFlags.UseSingleQuotesForStringLiteralType);
  const valueTypeNode =
      checker.typeToTypeNode(valueType, node.initializer, ts.NodeBuilderFlags.UseSingleQuotesForStringLiteralType);

  if (!keyTypeNode || !valueTypeNode) {
    return node;
  }

  return context.factory.updateVariableDeclaration(
      node,
      node.name,
      node.exclamationToken,
      node.type,
      context.factory.updateNewExpression(
          node.initializer,
          node.initializer.expression,
          [keyTypeNode, valueTypeNode],
          node.initializer.arguments,
          ),
  );
}

export function updateMissingGenericsInSets<T extends ts.Node>(
    context: ts.TransformationContext, node: T, checker: ts.TypeChecker): T|ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(node) || !node.initializer) {
    return node;
  }
  if (!ts.isNewExpression(node.initializer)) {
    return node;
  }
  if (!ts.isIdentifier(node.initializer.expression)) {
    return node;
  }
  if (node.initializer.expression.escapedText !== 'Set') {
    return node;
  }

  const originalNode = ts.getOriginalNode(node) as ts.VariableDeclaration;
  const block = ts.findAncestor(originalNode, ts.isBlock) || originalNode.getSourceFile();
  const symbol = checker.getSymbolAtLocation(originalNode.name);

  const visitor = (node: ts.Node): ts.Type|undefined => {
    const result = ts.forEachChild(node, visitor);
    if (result) {
      return result;
    }
    if (!ts.isCallExpression(node)) {
      return;
    }
    if (!ts.isPropertyAccessExpression(node.expression)) {
      return;
    }
    if (!(node.expression.name.escapedText === 'add' || node.expression.name.escapedText === 'has')) {
      return;
    }

    const innerSymbol = checker.getSymbolAtLocation(ts.getOriginalNode(node.expression.expression));
    if (innerSymbol === symbol) {
      return checker.getTypeAtLocation(node.arguments[0]);
    }
    return;
  };

  const type = ts.forEachChild(block, visitor);
  if (!type) {
    return node;
  }

  const typeNode = checker.typeToTypeNode(type, originalNode, ts.NodeBuilderFlags.UseSingleQuotesForStringLiteralType);
  if (!typeNode) {
    return node;
  }

  return context.factory.updateVariableDeclaration(
      node,
      node.name,
      node.exclamationToken,
      node.type,
      context.factory.updateNewExpression(
          node.initializer,
          node.initializer.expression,
          [typeNode],
          node.initializer.arguments,
          ),
  );
}

export type Transformer = (context: ts.TransformationContext, node: ts.Node, checker: ts.TypeChecker) => ts.Node;

export function transformer(checker: ts.TypeChecker, transformers: Transformer[]) {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        node = ts.visitEachChild(node, visitor, context);

        for (const transformer of transformers) {
          try {
            const newNode = transformer(context, node, checker);
            // if (newNode !== node) {
            //   ts.addSyntheticLeadingComment(
            //     newNode, ts.SyntaxKind.SingleLineCommentTrivia, ' Transformation: ' + transformer.name, true);
            // }
            node = newNode;
          } catch (err) {
            console.log(node.getFullText());
            console.log(err);
            process.exit(1);
          }
        }

        return node;
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}


import * as ts from 'typescript';
const path = require('path');
const fs = require('fs');

process.chdir('./out/Default');

const tmp = ts.sys;
const originalReadFile = ts.sys.readFile;
function readFile(path: string) {
  const data = originalReadFile(path);
  if (!data) {
    return undefined;
  }

  // Add an // @empty-line comment to empty lines to make sure TypeScript does
  // not loose them while processing the file.
  return data.replace(/\n\n/g, '\n// @empty-line\n');
}
tmp.readFile = readFile;

const printer = ts.createPrinter();

export function transformProgram(program: ts.Program, basePath: string|null = null, transformers: Transformer[]) {
  const checker = program.getTypeChecker();

  const sourceFiles = program.getSourceFiles()
                          .filter(sourceFile => !basePath || sourceFile.fileName.startsWith(basePath))
                          .filter(sourceFile => !sourceFile.fileName.endsWith('.ts'));
  // .filter(sourceFile => sourceFile.fileName.includes('ElementsTreeElement.'));
  // .filter(sourceFile => sourceFile.fileName.endsWith('Adorner.js'));
  const result = ts.transform(sourceFiles, [transformer(checker, transformers)]);
  return result.transformed;
}

export function transformModule(
    module: string, transformTypes: boolean, cache: Map<string, string>|null = null,
    transformers: Transformer[]|null = null) {
  const basePath = path.resolve('../../front_end', module);
  const configFileName = `./gen/front_end/${module}/${module}-tsconfig.json`;

  if (!fs.existsSync(configFileName)) {
    return;
  }

  // Fix after https://github.com/Microsoft/TypeScript/issues/18217
  // @ts-ignore
  tmp.onUnRecoverableConfigFileDiagnostic = err => {
    throw err;
  };
  // @ts-ignore
  const config = ts.getParsedCommandLineOfConfigFile(configFileName, {}, tmp);
  if (!config) {
    throw new Error('Could not find config file.');
  }

  const transformations = transformers || [
    updateEnums,
    updateTypedefs,
    updateOverrides,
    updateCast,
    updateVariableDeclarations,
    updateReturnType,
    updateParameters,
    updatePropertyDeclarations,
    updateGenericsInSuperClass,
    updateThisDeclaration,
    updateTypeDefinitionsForLocalTypes,
    updateMissingGenericsInMaps,
    updateMissingGenericsInSets,
    updateInterfaceDeclarations,
    updateInterfacesImplementations,
    updateAccessDeclarations,
    disableEslintRules,
  ];

  const fileSystemCache = cache || new Map<string, string>();
  for (const transformation of transformations) {
    // console.log(transformation.name);

    const host = ts.createCompilerHost(config.options, true);

    host.readFile = (fileName: string) => {
      // console.log('readFile', fileName, fileSystemCache.has(fileName.replace(basePath, '')));
      if (fileSystemCache.has(fileName)) {
        // @ts-ignore
        return fileSystemCache.get(fileName).replace(/\n\n/g, '\n// @empty-line\n');
      }

      const content = fs.readFileSync(fileName, {encoding: 'utf8'});
      // Add an // @empty-line comment to empty lines to make sure TypeScript does
      // not loose them while processing the file.
      fileSystemCache.set(fileName, content);
      return content.replace(/\n\n/g, '\n// @empty-line\n');
    };

    host.writeFile = (fileName: string, data: string, _writeByteOrderMark: boolean) => {
      // console.log('writeFile', fileName, data .replace(/\n\s*\/\/ @empty-line\n/g, '\n\n').replace(/^(    )+/gm, m => '  '.repeat(m.length / 4)));
      fileSystemCache.set(
          fileName,
          data.replace(/\n\s*\/\/ @empty-line\n/g, '\n\n').replace(/^(    )+/gm, m => '  '.repeat(m.length / 4)),
      );
    };

    const program = ts.createProgram({
      rootNames: config.fileNames,
      options: config.options,
      projectReferences: config.projectReferences,
      host: host,
    });

    transformProgram(
        program,
        basePath,
        [transformation],
        )
        .forEach(sourceFile => {
          // Replace // @empty-line comments with actual empty lines again
          const content = printer.printFile(sourceFile);

          // fs.writeFileSync(sourceFile.fileName, content);
          host.writeFile(sourceFile.fileName, content, false);
        });
  }

  if (cache) {
    return;
  }

  for (const [fileName, content] of fileSystemCache) {
    if (!fileName.startsWith(basePath)) {
      continue;
    }
    fs.writeFileSync(fileName, content);
  }
}

export function updateExtensionsAndReferences(module: string) {
  const basePath = path.resolve('../../front_end', module);
  const files = fs.readdirSync(basePath);
  const filenamesToReplace = new Set<string>();
  for (const file of files) {
    if (!file.endsWith('.js'))  // || !file.includes('ElementsTreeElement.'))
    {
      continue;
    }
    const abs = path.resolve(basePath, file);
    const newFileName = abs.replace(/\.js$/, '.ts');
    fs.renameSync(abs, newFileName);
    let content = fs.readFileSync(newFileName, {encoding: 'utf8'});
    const regex = /(i18n\.i18n\.registerUIStrings\(\'\w+\/\w+\.)js(\'\, UIStrings\);)/g;
    content = content.replace(regex, '$1ts$2');
    fs.writeFileSync(newFileName, content);
    filenamesToReplace.add(file);
  }

  const buildFilePath = path.resolve(basePath, './BUILD.gn');
  const buildFileContent = fs.readFileSync(buildFilePath, {encoding: 'utf8'});
  let newBuildFileContent = buildFileContent;
  for (const file of filenamesToReplace) {
    newBuildFileContent = newBuildFileContent.replace(file, file.replace(/\.js$/, '.ts'));
  }
  fs.writeFileSync(buildFilePath, newBuildFileContent);
}

const blacklistedModules = new Set(['cm', 'cm_headless']);

export function walkAllModules() {
  const entries = fs.readdirSync('./gen/front_end', {withFileTypes: true});
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (blacklistedModules.has(entry.name)) {
      continue;
    }

    transformModule(entry.name, true);
  }
}
