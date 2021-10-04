// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Generated from scripts/javascript_natives/index.js

/* eslint-disable */

export const NativeFunctions = [
  {
    'name': 'arrayExpression',
    'signatures': [
      [
        '?elements'
      ]
    ]
  },
  {
    'name': 'assignmentExpression',
    'signatures': [
      [
        '?operator',
        '?left',
        '?right'
      ]
    ]
  },
  {
    'name': 'binaryExpression',
    'signatures': [
      [
        '?operator',
        '?left',
        '?right'
      ]
    ]
  },
  {
    'name': 'directive',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'directiveLiteral',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'blockStatement',
    'signatures': [
      [
        '?body',
        '?directives'
      ]
    ]
  },
  {
    'name': 'breakStatement',
    'signatures': [
      [
        '?label'
      ]
    ]
  },
  {
    'name': 'callExpression',
    'signatures': [
      [
        '?callee',
        '?_arguments'
      ]
    ]
  },
  {
    'name': 'catchClause',
    'signatures': [
      [
        '?param',
        '?body'
      ]
    ]
  },
  {
    'name': 'conditionalExpression',
    'signatures': [
      [
        '?test',
        '?consequent',
        '?alternate'
      ]
    ]
  },
  {
    'name': 'continueStatement',
    'signatures': [
      [
        '?label'
      ]
    ]
  },
  {
    'name': 'doWhileStatement',
    'signatures': [
      [
        '?test',
        '?body'
      ]
    ]
  },
  {
    'name': 'expressionStatement',
    'signatures': [
      [
        '?expression'
      ]
    ]
  },
  {
    'name': 'file',
    'signatures': [
      [
        '?program',
        '?comments',
        '?tokens'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'file',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileEntry'
  },
  {
    'name': 'forInStatement',
    'signatures': [
      [
        '?left',
        '?right',
        '?body'
      ]
    ]
  },
  {
    'name': 'forStatement',
    'signatures': [
      [
        '?init',
        '?test',
        '?update',
        '?body'
      ]
    ]
  },
  {
    'name': 'functionDeclaration',
    'signatures': [
      [
        '?id',
        '?params',
        '?body',
        '?generator',
        '?async'
      ]
    ]
  },
  {
    'name': 'functionExpression',
    'signatures': [
      [
        '?id',
        '?params',
        '?body',
        '?generator',
        '?async'
      ]
    ]
  },
  {
    'name': 'identifier',
    'signatures': [
      [
        '?name'
      ]
    ]
  },
  {
    'name': 'ifStatement',
    'signatures': [
      [
        '?test',
        '?consequent',
        '?alternate'
      ]
    ]
  },
  {
    'name': 'labeledStatement',
    'signatures': [
      [
        '?label',
        '?body'
      ]
    ]
  },
  {
    'name': 'stringLiteral',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'numericLiteral',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'booleanLiteral',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'regExpLiteral',
    'signatures': [
      [
        '?pattern',
        '?flags'
      ]
    ]
  },
  {
    'name': 'logicalExpression',
    'signatures': [
      [
        '?operator',
        '?left',
        '?right'
      ]
    ]
  },
  {
    'name': 'memberExpression',
    'signatures': [
      [
        '?object',
        '?property',
        '?computed'
      ]
    ]
  },
  {
    'name': 'newExpression',
    'signatures': [
      [
        '?callee',
        '?_arguments'
      ]
    ]
  },
  {
    'name': 'program',
    'signatures': [
      [
        '?body',
        '?directives'
      ]
    ]
  },
  {
    'name': 'objectExpression',
    'signatures': [
      [
        '?properties'
      ]
    ]
  },
  {
    'name': 'objectMethod',
    'signatures': [
      [
        '?kind',
        '?key',
        '?params',
        '?body',
        '?computed'
      ]
    ]
  },
  {
    'name': 'objectProperty',
    'signatures': [
      [
        '?key',
        '?value',
        '?computed',
        '?shorthand',
        '?decorators'
      ]
    ]
  },
  {
    'name': 'restElement',
    'signatures': [
      [
        '?argument',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'returnStatement',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'sequenceExpression',
    'signatures': [
      [
        '?expressions'
      ]
    ]
  },
  {
    'name': 'switchCase',
    'signatures': [
      [
        '?test',
        '?consequent'
      ]
    ]
  },
  {
    'name': 'switchStatement',
    'signatures': [
      [
        '?discriminant',
        '?cases'
      ]
    ]
  },
  {
    'name': 'throwStatement',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'tryStatement',
    'signatures': [
      [
        '?block',
        '?handler',
        '?finalizer'
      ]
    ]
  },
  {
    'name': 'unaryExpression',
    'signatures': [
      [
        '?operator',
        '?argument',
        '?prefix'
      ]
    ]
  },
  {
    'name': 'updateExpression',
    'signatures': [
      [
        '?operator',
        '?argument',
        '?prefix'
      ]
    ]
  },
  {
    'name': 'variableDeclaration',
    'signatures': [
      [
        '?kind',
        '?declarations'
      ]
    ]
  },
  {
    'name': 'variableDeclarator',
    'signatures': [
      [
        '?id',
        '?init'
      ]
    ]
  },
  {
    'name': 'whileStatement',
    'signatures': [
      [
        '?test',
        '?body'
      ]
    ]
  },
  {
    'name': 'withStatement',
    'signatures': [
      [
        '?object',
        '?body'
      ]
    ]
  },
  {
    'name': 'assignmentPattern',
    'signatures': [
      [
        '?left',
        '?right'
      ]
    ]
  },
  {
    'name': 'arrayPattern',
    'signatures': [
      [
        '?elements',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'arrowFunctionExpression',
    'signatures': [
      [
        '?params',
        '?body',
        '?async'
      ]
    ]
  },
  {
    'name': 'classBody',
    'signatures': [
      [
        '?body'
      ]
    ]
  },
  {
    'name': 'classDeclaration',
    'signatures': [
      [
        '?id',
        '?superClass',
        '?body',
        '?decorators'
      ]
    ]
  },
  {
    'name': 'classExpression',
    'signatures': [
      [
        '?id',
        '?superClass',
        '?body',
        '?decorators'
      ]
    ]
  },
  {
    'name': 'exportAllDeclaration',
    'signatures': [
      [
        '?source'
      ]
    ]
  },
  {
    'name': 'exportDefaultDeclaration',
    'signatures': [
      [
        '?declaration'
      ]
    ]
  },
  {
    'name': 'exportNamedDeclaration',
    'signatures': [
      [
        '?declaration',
        '?specifiers',
        '?source'
      ]
    ]
  },
  {
    'name': 'exportSpecifier',
    'signatures': [
      [
        '?local',
        '?exported'
      ]
    ]
  },
  {
    'name': 'forOfStatement',
    'signatures': [
      [
        '?left',
        '?right',
        '?body'
      ]
    ]
  },
  {
    'name': 'importDeclaration',
    'signatures': [
      [
        '?specifiers',
        '?source'
      ]
    ]
  },
  {
    'name': 'importDefaultSpecifier',
    'signatures': [
      [
        '?local'
      ]
    ]
  },
  {
    'name': 'importNamespaceSpecifier',
    'signatures': [
      [
        '?local'
      ]
    ]
  },
  {
    'name': 'importSpecifier',
    'signatures': [
      [
        '?local',
        '?imported'
      ]
    ]
  },
  {
    'name': 'metaProperty',
    'signatures': [
      [
        '?meta',
        '?property'
      ]
    ]
  },
  {
    'name': 'classMethod',
    'signatures': [
      [
        '?kind',
        '?key',
        '?params',
        '?body',
        '?computed',
        '?_static'
      ]
    ]
  },
  {
    'name': 'objectPattern',
    'signatures': [
      [
        '?properties',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'spreadElement',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'taggedTemplateExpression',
    'signatures': [
      [
        '?tag',
        '?quasi'
      ]
    ]
  },
  {
    'name': 'templateElement',
    'signatures': [
      [
        '?value',
        '?tail'
      ]
    ]
  },
  {
    'name': 'templateLiteral',
    'signatures': [
      [
        '?quasis',
        '?expressions'
      ]
    ]
  },
  {
    'name': 'yieldExpression',
    'signatures': [
      [
        '?argument',
        '?delegate'
      ]
    ]
  },
  {
    'name': 'arrayTypeAnnotation',
    'signatures': [
      [
        '?elementType'
      ]
    ]
  },
  {
    'name': 'classImplements',
    'signatures': [
      [
        '?id',
        '?typeParameters'
      ]
    ]
  },
  {
    'name': 'classProperty',
    'signatures': [
      [
        '?key',
        '?value',
        '?typeAnnotation',
        '?decorators'
      ]
    ]
  },
  {
    'name': 'declareClass',
    'signatures': [
      [
        '?id',
        '?typeParameters',
        '?_extends',
        '?body'
      ]
    ]
  },
  {
    'name': 'declareFunction',
    'signatures': [
      [
        '?id'
      ]
    ]
  },
  {
    'name': 'declareInterface',
    'signatures': [
      [
        '?id',
        '?typeParameters',
        '?_extends',
        '?body'
      ]
    ]
  },
  {
    'name': 'declareModule',
    'signatures': [
      [
        '?id',
        '?body'
      ]
    ]
  },
  {
    'name': 'declareTypeAlias',
    'signatures': [
      [
        '?id',
        '?typeParameters',
        '?right'
      ]
    ]
  },
  {
    'name': 'declareVariable',
    'signatures': [
      [
        '?id'
      ]
    ]
  },
  {
    'name': 'functionTypeAnnotation',
    'signatures': [
      [
        '?typeParameters',
        '?params',
        '?rest',
        '?returnType'
      ]
    ]
  },
  {
    'name': 'functionTypeParam',
    'signatures': [
      [
        '?name',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'genericTypeAnnotation',
    'signatures': [
      [
        '?id',
        '?typeParameters'
      ]
    ]
  },
  {
    'name': 'interfaceExtends',
    'signatures': [
      [
        '?id',
        '?typeParameters'
      ]
    ]
  },
  {
    'name': 'interfaceDeclaration',
    'signatures': [
      [
        '?id',
        '?typeParameters',
        '?_extends',
        '?body'
      ]
    ]
  },
  {
    'name': 'intersectionTypeAnnotation',
    'signatures': [
      [
        '?types'
      ]
    ]
  },
  {
    'name': 'nullableTypeAnnotation',
    'signatures': [
      [
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'tupleTypeAnnotation',
    'signatures': [
      [
        '?types'
      ]
    ]
  },
  {
    'name': 'typeofTypeAnnotation',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'typeAlias',
    'signatures': [
      [
        '?id',
        '?typeParameters',
        '?right'
      ]
    ]
  },
  {
    'name': 'typeAnnotation',
    'signatures': [
      [
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'typeCastExpression',
    'signatures': [
      [
        '?expression',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'typeParameter',
    'signatures': [
      [
        '?bound',
        '?default_'
      ]
    ]
  },
  {
    'name': 'typeParameterDeclaration',
    'signatures': [
      [
        '?params'
      ]
    ]
  },
  {
    'name': 'typeParameterInstantiation',
    'signatures': [
      [
        '?params'
      ]
    ]
  },
  {
    'name': 'objectTypeAnnotation',
    'signatures': [
      [
        '?properties',
        '?indexers',
        '?callProperties'
      ]
    ]
  },
  {
    'name': 'objectTypeCallProperty',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'objectTypeIndexer',
    'signatures': [
      [
        '?id',
        '?key',
        '?value'
      ]
    ]
  },
  {
    'name': 'objectTypeProperty',
    'signatures': [
      [
        '?key',
        '?value'
      ]
    ]
  },
  {
    'name': 'qualifiedTypeIdentifier',
    'signatures': [
      [
        '?id',
        '?qualification'
      ]
    ]
  },
  {
    'name': 'unionTypeAnnotation',
    'signatures': [
      [
        '?types'
      ]
    ]
  },
  {
    'name': 'jSXAttribute',
    'signatures': [
      [
        '?name',
        '?value'
      ]
    ]
  },
  {
    'name': 'jSXClosingElement',
    'signatures': [
      [
        '?name'
      ]
    ]
  },
  {
    'name': 'jSXElement',
    'signatures': [
      [
        '?openingElement',
        '?closingElement',
        '?children',
        '?selfClosing'
      ]
    ]
  },
  {
    'name': 'jSXExpressionContainer',
    'signatures': [
      [
        '?expression'
      ]
    ]
  },
  {
    'name': 'jSXIdentifier',
    'signatures': [
      [
        '?name'
      ]
    ]
  },
  {
    'name': 'jSXMemberExpression',
    'signatures': [
      [
        '?object',
        '?property'
      ]
    ]
  },
  {
    'name': 'jSXNamespacedName',
    'signatures': [
      [
        '?namespace',
        '?name'
      ]
    ]
  },
  {
    'name': 'jSXOpeningElement',
    'signatures': [
      [
        '?name',
        '?attributes',
        '?selfClosing'
      ]
    ]
  },
  {
    'name': 'jSXSpreadAttribute',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'jSXText',
    'signatures': [
      [
        '?value'
      ]
    ]
  },
  {
    'name': 'parenthesizedExpression',
    'signatures': [
      [
        '?expression'
      ]
    ]
  },
  {
    'name': 'awaitExpression',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'bindExpression',
    'signatures': [
      [
        '?object',
        '?callee'
      ]
    ]
  },
  {
    'name': 'decorator',
    'signatures': [
      [
        '?expression'
      ]
    ]
  },
  {
    'name': 'doExpression',
    'signatures': [
      [
        '?body'
      ]
    ]
  },
  {
    'name': 'exportDefaultSpecifier',
    'signatures': [
      [
        '?exported'
      ]
    ]
  },
  {
    'name': 'exportNamespaceSpecifier',
    'signatures': [
      [
        '?exported'
      ]
    ]
  },
  {
    'name': 'restProperty',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'spreadProperty',
    'signatures': [
      [
        '?argument'
      ]
    ]
  },
  {
    'name': 'TSArrayType',
    'signatures': [
      [
        'elementType'
      ]
    ]
  },
  {
    'name': 'TSAsExpression',
    'signatures': [
      [
        'expression',
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSCallSignatureDeclaration',
    'signatures': [
      [
        '?typeParameters',
        '?parameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSConstructSignatureDeclaration',
    'signatures': [
      [
        '?typeParameters',
        '?parameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSConstructorType',
    'signatures': [
      [
        '?typeParameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSDeclareFunction',
    'signatures': [
      [
        'id',
        'typeParameters',
        'params',
        'returnType'
      ]
    ]
  },
  {
    'name': 'TSDeclareMethod',
    'signatures': [
      [
        'decorators',
        'key',
        'typeParameters',
        'params',
        '?returnType'
      ]
    ]
  },
  {
    'name': 'TSEnumDeclaration',
    'signatures': [
      [
        'id',
        'members'
      ]
    ]
  },
  {
    'name': 'TSEnumMember',
    'signatures': [
      [
        'id',
        '?initializer'
      ]
    ]
  },
  {
    'name': 'TSExportAssignment',
    'signatures': [
      [
        'expression'
      ]
    ]
  },
  {
    'name': 'TSExpressionWithTypeArguments',
    'signatures': [
      [
        'expression',
        '?typeParameters'
      ]
    ]
  },
  {
    'name': 'TSExternalModuleReference',
    'signatures': [
      [
        'expression'
      ]
    ]
  },
  {
    'name': 'TSFunctionType',
    'signatures': [
      [
        '?typeParameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSImportEqualsDeclaration',
    'signatures': [
      [
        'id',
        'moduleReference'
      ]
    ]
  },
  {
    'name': 'TSIndexSignature',
    'signatures': [
      [
        'parameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSIndexedAccessType',
    'signatures': [
      [
        'objectType',
        'indexType'
      ]
    ]
  },
  {
    'name': 'TSInterfaceBody',
    'signatures': [
      [
        'body'
      ]
    ]
  },
  {
    'name': 'TSInterfaceDeclaration',
    'signatures': [
      [
        'id',
        'typeParameters',
        'extends_',
        'body'
      ]
    ]
  },
  {
    'name': 'TSIntersectionType',
    'signatures': [
      [
        'types'
      ]
    ]
  },
  {
    'name': 'TSLiteralType',
    'signatures': [
      [
        'literal'
      ]
    ]
  },
  {
    'name': 'TSMappedType',
    'signatures': [
      [
        'typeParameter',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSMethodSignature',
    'signatures': [
      [
        'key',
        '?typeParameters',
        '?parameters',
        '?typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSModuleBlock',
    'signatures': [
      [
        'body'
      ]
    ]
  },
  {
    'name': 'TSModuleDeclaration',
    'signatures': [
      [
        'id',
        'body'
      ]
    ]
  },
  {
    'name': 'TSNamespaceExportDeclaration',
    'signatures': [
      [
        'id'
      ]
    ]
  },
  {
    'name': 'TSNonNullExpression',
    'signatures': [
      [
        'expression'
      ]
    ]
  },
  {
    'name': 'TSParameterProperty',
    'signatures': [
      [
        'parameter'
      ]
    ]
  },
  {
    'name': 'TSParenthesizedType',
    'signatures': [
      [
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSPropertySignature',
    'signatures': [
      [
        'key',
        '?typeAnnotation',
        '?initializer'
      ]
    ]
  },
  {
    'name': 'TSQualifiedName',
    'signatures': [
      [
        'left',
        'right'
      ]
    ]
  },
  {
    'name': 'TSTupleType',
    'signatures': [
      [
        'elementTypes'
      ]
    ]
  },
  {
    'name': 'TSTypeAliasDeclaration',
    'signatures': [
      [
        'id',
        'typeParameters',
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSTypeAnnotation',
    'signatures': [
      [
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSTypeAssertion',
    'signatures': [
      [
        'typeAnnotation',
        'expression'
      ]
    ]
  },
  {
    'name': 'TSTypeLiteral',
    'signatures': [
      [
        'members'
      ]
    ]
  },
  {
    'name': 'TSTypeOperator',
    'signatures': [
      [
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSTypeParameter',
    'signatures': [
      [
        '?constraint',
        '?default_'
      ]
    ]
  },
  {
    'name': 'TSTypeParameterDeclaration',
    'signatures': [
      [
        'params'
      ]
    ]
  },
  {
    'name': 'TSTypeParameterInstantiation',
    'signatures': [
      [
        'params'
      ]
    ]
  },
  {
    'name': 'TSTypePredicate',
    'signatures': [
      [
        'parameterName',
        'typeAnnotation'
      ]
    ]
  },
  {
    'name': 'TSTypeQuery',
    'signatures': [
      [
        'exprName'
      ]
    ]
  },
  {
    'name': 'TSTypeReference',
    'signatures': [
      [
        'typeName',
        '?typeParameters'
      ]
    ]
  },
  {
    'name': 'TSUnionType',
    'signatures': [
      [
        'types'
      ]
    ]
  },
  {
    'name': 'isArrayExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isAssignmentExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBinaryExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDirective',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDirectiveLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBlockStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBreakStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isCallExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isCatchClause',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isConditionalExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isContinueStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDebuggerStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDoWhileStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isEmptyStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExpressionStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFile',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isForInStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isForStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunctionDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunctionExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isIfStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isLabeledStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isStringLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNumericLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNumberLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNullLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBooleanLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isRegExpLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isRegexLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isLogicalExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isMemberExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNewExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isProgram',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'isProgram',
    'signatures': [
      [
        'program'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'isObjectExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isRestElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isReturnStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSequenceExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSwitchCase',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSwitchStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isThisExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isThrowStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTryStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUnaryExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUpdateExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isVariableDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isVariableDeclarator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isWhileStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isWithStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isAssignmentPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isArrayPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isArrowFunctionExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassBody',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportAllDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportDefaultDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportNamedDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isForOfStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isImportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isImportDefaultSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isImportNamespaceSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isImportSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isMetaProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSpreadElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSuper',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTaggedTemplateExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTemplateElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTemplateLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isYieldExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isAnyTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isArrayTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBooleanTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBooleanLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNullLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassImplements',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClassProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareClass',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareInterface',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareModule',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareTypeAlias',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclareVariable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExistentialTypeParam',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunctionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunctionTypeParam',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isGenericTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isInterfaceExtends',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isInterfaceDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isIntersectionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isMixedTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNullableTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNumericLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNumberTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isStringLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isStringTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isThisTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTupleTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeofTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeAlias',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeCastExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeParameter',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeParameterDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTypeParameterInstantiation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectTypeCallProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectTypeIndexer',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectTypeProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isQualifiedTypeIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUnionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isVoidTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXAttribute',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXClosingElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXEmptyExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXExpressionContainer',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXMemberExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXNamespacedName',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXOpeningElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXSpreadAttribute',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSXText',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isNoop',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isParenthesizedExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isAwaitExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBindExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDecorator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDoExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportDefaultSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportNamespaceSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isRestProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isSpreadProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBinary',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isScopable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBlockParent',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBlock',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTerminatorless',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isCompletionStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isConditional',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isLoop',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isWhile',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExpressionWrapper',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFor',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isForXStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFunctionParent',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isPureish',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isLVal',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isImmutable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUserWhitespacable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isObjectMember',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUnaryLike',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isClass',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isModuleDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isExportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isModuleSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFlow',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFlowBaseAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isFlowDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isJSX',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isReferencedIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isReferencedMemberExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBindingIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isScope',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isReferenced',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isBlockScoped',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isVar',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isUser',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isGenerated',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isPure',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSAnyKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSArrayType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSAsExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSBooleanKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSCallSignatureDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSConstructSignatureDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSConstructorType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSDeclareFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSDeclareMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSEnumDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSEnumMember',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSExportAssignment',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSExpressionWithTypeArguments',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSExternalModuleReference',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSFunctionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSImportEqualsDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSIndexSignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSIndexedAccessType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSInterfaceBody',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSInterfaceDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSIntersectionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSLiteralType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSMappedType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSMethodSignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSModuleBlock',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSModuleDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSNamespaceExportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSNeverKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSNonNullExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSNullKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSNumberKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSObjectKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSParameterProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSParenthesizedType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSPropertySignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSQualifiedName',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSStringKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSSymbolKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSThisType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTupleType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeAliasDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeAssertion',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeOperator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeParameter',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeParameterDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeParameterInstantiation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypePredicate',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeQuery',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSTypeReference',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSUndefinedKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSUnionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isTSVoidKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'isCompatTag',
    'signatures': [
      [
        '?tagName'
      ]
    ]
  },
  {
    'name': 'buildChildren',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'assertArrayExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertAssignmentExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBinaryExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDirective',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDirectiveLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBlockStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBreakStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertCallExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertCatchClause',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertConditionalExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertContinueStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDebuggerStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDoWhileStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertEmptyStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExpressionStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFile',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertForInStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertForStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunctionDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunctionExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertIfStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertLabeledStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertStringLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNumericLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNumberLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNullLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBooleanLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertRegExpLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertRegexLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertLogicalExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertMemberExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNewExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertProgram',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertRestElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertReturnStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSequenceExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSwitchCase',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSwitchStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertThisExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertThrowStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTryStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertUnaryExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertUpdateExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertVariableDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertVariableDeclarator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertWhileStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertWithStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertAssignmentPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertArrayPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertArrowFunctionExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassBody',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportAllDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportDefaultDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportNamedDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertForOfStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertImportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertImportDefaultSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertImportNamespaceSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertImportSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertMetaProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSpreadElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSuper',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTaggedTemplateExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTemplateElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTemplateLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertYieldExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertAnyTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertArrayTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBooleanTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBooleanLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNullLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassImplements',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClassProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareClass',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareInterface',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareModule',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareTypeAlias',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclareVariable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExistentialTypeParam',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunctionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunctionTypeParam',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertGenericTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertInterfaceExtends',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertInterfaceDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertIntersectionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertMixedTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNullableTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNumericLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNumberTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertStringLiteralTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertStringTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertThisTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTupleTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeofTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeAlias',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeCastExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeParameter',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeParameterDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTypeParameterInstantiation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectTypeCallProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectTypeIndexer',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectTypeProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertQualifiedTypeIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertUnionTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertVoidTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXAttribute',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXClosingElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXEmptyExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXExpressionContainer',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXIdentifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXMemberExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXNamespacedName',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXOpeningElement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXSpreadAttribute',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSXText',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertNoop',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertParenthesizedExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertAwaitExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBindExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDecorator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDoExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportDefaultSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportNamespaceSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertRestProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertSpreadProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBinary',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertScopable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBlockParent',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertBlock',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTerminatorless',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertCompletionStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertConditional',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertLoop',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertWhile',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExpressionWrapper',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFor',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertForXStatement',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFunctionParent',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertPureish',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertLVal',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertImmutable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertUserWhitespacable',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertObjectMember',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertUnaryLike',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertPattern',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertClass',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertModuleDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertExportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertModuleSpecifier',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFlow',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFlowBaseAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertFlowDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertJSX',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSAnyKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSArrayType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSAsExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSBooleanKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSCallSignatureDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSConstructSignatureDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSConstructorType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSDeclareFunction',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSDeclareMethod',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSEnumDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSEnumMember',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSExportAssignment',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSExpressionWithTypeArguments',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSExternalModuleReference',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSFunctionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSImportEqualsDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSIndexSignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSIndexedAccessType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSInterfaceBody',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSInterfaceDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSIntersectionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSLiteralType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSMappedType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSMethodSignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSModuleBlock',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSModuleDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSNamespaceExportDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSNeverKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSNonNullExpression',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSNullKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSNumberKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSObjectKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSParameterProperty',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSParenthesizedType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSPropertySignature',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSQualifiedName',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSStringKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSSymbolKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSThisType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTupleType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeAliasDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeAnnotation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeAssertion',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeLiteral',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeOperator',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeParameter',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeParameterDeclaration',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeParameterInstantiation',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypePredicate',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeQuery',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSTypeReference',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSUndefinedKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSUnionType',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'assertTSVoidKeyword',
    'signatures': [
      [
        'node',
        '?opts'
      ]
    ]
  },
  {
    'name': 'captureStackTrace',
    'signatures': [
      [
        'targetObject',
        '?constructorOpt'
      ]
    ]
  },
  {
    'name': 'abort',
    'signatures': [
      [
        'reason'
      ]
    ],
    'receiver': 'UnderlyingSinkBase'
  },
  {
    'name': 'abort',
    'signatures': [
      [
        '?reason'
      ]
    ],
    'receiver': 'WritableStream'
  },
  {
    'name': 'at',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'slice',
    'signatures': [
      [
        '?start',
        '?end',
        '?contentType'
      ]
    ]
  },
  {
    'name': 'CodeMirror',
    'signatures': [
      [
        'host',
        '?options'
      ],
      [
        'callback',
        '?options'
      ]
    ]
  },
  {
    'name': 'on',
    'signatures': [
      [
        'event',
        'listener'
      ]
    ],
    'receiver': 'Emitter'
  },
  {
    'name': 'on',
    'signatures': [
      [
        'eventType',
        'handler'
      ]
    ],
    'receiver': 'Server'
  },
  {
    'name': 'once',
    'signatures': [
      [
        'event',
        'listener'
      ]
    ]
  },
  {
    'name': 'off',
    'signatures': [
      [
        '?event',
        '?listener'
      ]
    ],
    'receiver': 'Emitter'
  },
  {
    'name': 'off',
    'signatures': [
      [
        'eventType',
        'handler'
      ]
    ],
    'receiver': 'Server'
  },
  {
    'name': 'emit',
    'signatures': [
      [
        'event',
        '...args'
      ]
    ]
  },
  {
    'name': 'listeners',
    'signatures': [
      [
        'event'
      ]
    ]
  },
  {
    'name': 'hasListeners',
    'signatures': [
      [
        'event'
      ]
    ]
  },
  {
    'name': 'encode',
    'signatures': [
      [
        'value'
      ]
    ],
    'receiver': 'CookieSerializeOptions'
  },
  {
    'name': 'encode',
    'signatures': [
      [
        '?input'
      ]
    ],
    'receiver': 'TextEncoder'
  },
  {
    'name': 'encode',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'AudioEncoder'
  },
  {
    'name': 'encode',
    'signatures': [
      [
        'frame',
        '?options'
      ]
    ],
    'receiver': 'VideoEncoder'
  },
  {
    'name': 'decode',
    'signatures': [
      [
        'value'
      ]
    ],
    'receiver': 'CookieParseOptions'
  },
  {
    'name': 'decode',
    'signatures': [
      [
        '?input',
        '?options'
      ]
    ],
    'receiver': 'TextDecoder'
  },
  {
    'name': 'decode',
    'signatures': [
      [
        'chunk'
      ]
    ],
    'receiver': 'AudioDecoder'
  },
  {
    'name': 'decode',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'ImageDecoder'
  },
  {
    'name': 'decode',
    'signatures': [
      [
        'chunk'
      ]
    ],
    'receiver': 'VideoDecoder'
  },
  {
    'name': 'parse',
    'signatures': [
      [
        'str',
        '?options'
      ],
      [
        'html',
        '?options'
      ],
      [
        'text',
        '?options'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'parse',
    'signatures': [
      [
        'cssText'
      ]
    ],
    'receiver': 'CSSNumericValue'
  },
  {
    'name': 'parse',
    'signatures': [
      [
        'property',
        'cssText'
      ]
    ],
    'receiver': 'CSSStyleValue'
  },
  {
    'name': 'serialize',
    'signatures': [
      [
        'node',
        '?options'
      ],
      [
        'name',
        'value',
        '?options'
      ]
    ]
  },
  {
    'name': 'e',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'write',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'FileWriter'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'FileWriterSync'
  },
  {
    'name': 'write',
    'signatures': [
      [
        '...text'
      ],
      [
        'text'
      ]
    ],
    'receiver': 'Document'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'chunk',
        'controller'
      ]
    ],
    'receiver': 'UnderlyingSinkBase'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'Clipboard'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'FileSystemWritableFileStream'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'buffer',
        'file_offset'
      ]
    ],
    'receiver': 'NativeIOFileSync'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'buffer',
        'file_offset'
      ]
    ],
    'receiver': 'NativeIOFile'
  },
  {
    'name': 'write',
    'signatures': [
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'NDEFReader'
  },
  {
    'name': 'seek',
    'signatures': [
      [
        'offset'
      ],
      [
        'position'
      ]
    ],
    'receiver': 'FileWriter'
  },
  {
    'name': 'seek',
    'signatures': [
      [
        'offset'
      ],
      [
        'position'
      ]
    ],
    'receiver': 'FileWriterSync'
  },
  {
    'name': 'seek',
    'signatures': [
      [
        'offset'
      ]
    ],
    'receiver': 'FileSystemWritableFileStream'
  },
  {
    'name': 'truncate',
    'signatures': [
      [
        'size'
      ]
    ]
  },
  {
    'name': 'requestFileSystem',
    'signatures': [
      [
        'type',
        'size',
        'successCallback',
        '?errorCallback'
      ]
    ]
  },
  {
    'name': 'resolveLocalFileSystemURL',
    'signatures': [
      [
        'url',
        'successCallback',
        '?errorCallback'
      ]
    ]
  },
  {
    'name': 'webkitRequestFileSystem',
    'signatures': [
      [
        'type',
        'size',
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'LocalFileSystem'
  },
  {
    'name': 'webkitRequestFileSystem',
    'signatures': [
      [
        'type',
        'size',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DedicatedWorkerGlobalScope'
  },
  {
    'name': 'webkitRequestFileSystem',
    'signatures': [
      [
        'type',
        'size',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'SharedWorkerGlobalScope'
  },
  {
    'name': 'webkitRequestFileSystem',
    'signatures': [
      [
        'type',
        'size',
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'requestFileSystemSync',
    'signatures': [
      [
        'type',
        'size'
      ]
    ]
  },
  {
    'name': 'resolveLocalFileSystemSyncURL',
    'signatures': [
      [
        'url'
      ]
    ]
  },
  {
    'name': 'webkitRequestFileSystemSync',
    'signatures': [
      [
        'type',
        'size'
      ]
    ]
  },
  {
    'name': 'getMetadata',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemEntry'
  },
  {
    'name': 'getMetadata',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Entry'
  },
  {
    'name': 'moveTo',
    'signatures': [
      [
        'parent',
        '?newName',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemEntry'
  },
  {
    'name': 'moveTo',
    'signatures': [
      [
        'parent',
        '?newName'
      ],
      [
        'parent',
        'name'
      ]
    ],
    'receiver': 'EntrySync'
  },
  {
    'name': 'moveTo',
    'signatures': [
      [
        'x',
        'y'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'moveTo',
    'signatures': [
      [
        'x',
        'y'
      ]
    ],
    'receiver': 'CanvasPath'
  },
  {
    'name': 'moveTo',
    'signatures': [
      [
        'parent',
        '?name',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Entry'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'parent',
        '?newName',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemEntry'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'parent',
        '?newName'
      ],
      [
        'parent',
        'name'
      ]
    ],
    'receiver': 'EntrySync'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'parent',
        '?name',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Entry'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'destination'
      ]
    ],
    'receiver': 'EncodedAudioChunk'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'destination'
      ]
    ],
    'receiver': 'EncodedVideoChunk'
  },
  {
    'name': 'copyTo',
    'signatures': [
      [
        'destination',
        '?options'
      ]
    ],
    'receiver': 'VideoFrame'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemEntry'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'AccessibleNodeList'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'DataTransferItemList'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        '...tokens'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'HTMLOptionsCollection'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        '?index'
      ]
    ],
    'receiver': 'HTMLSelectElement'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'FileSystemHandle'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Entry'
  },
  {
    'name': 'remove',
    'signatures': [
      [
        'start',
        'end'
      ]
    ],
    'receiver': 'SourceBuffer'
  },
  {
    'name': 'getParent',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemEntry'
  },
  {
    'name': 'getParent',
    'signatures': [
      [
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'Entry'
  },
  {
    'name': 'getFile',
    'signatures': [
      [
        'path',
        '?options',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemDirectoryEntry'
  },
  {
    'name': 'getFile',
    'signatures': [
      [
        'path',
        '?options'
      ],
      [
        'path',
        'flags'
      ]
    ],
    'receiver': 'DirectoryEntrySync'
  },
  {
    'name': 'getFile',
    'signatures': [
      [
        'filename'
      ]
    ],
    'receiver': 'SyncConstructorOptions'
  },
  {
    'name': 'getFile',
    'signatures': [
      [
        'filename',
        'callback'
      ]
    ],
    'receiver': 'ASyncConstructorOptions'
  },
  {
    'name': 'getFile',
    'signatures': [
      [
        'path',
        '?options',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DirectoryEntry'
  },
  {
    'name': 'getDirectory',
    'signatures': [
      [
        'path',
        '?options',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemDirectoryEntry'
  },
  {
    'name': 'getDirectory',
    'signatures': [
      [
        'path',
        '?options'
      ],
      [
        'path',
        'flags'
      ]
    ],
    'receiver': 'DirectoryEntrySync'
  },
  {
    'name': 'getDirectory',
    'signatures': [
      [
        'path',
        '?options',
        '?successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DirectoryEntry'
  },
  {
    'name': 'removeRecursively',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileSystemDirectoryEntry'
  },
  {
    'name': 'removeRecursively',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DirectoryEntry'
  },
  {
    'name': 'readEntries',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DirectoryReader'
  },
  {
    'name': 'createWriter',
    'signatures': [
      [
        'successCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'FileEntry'
  },
  {
    'name': 'M',
    'signatures': [
      [
        'target',
        'pattern',
        '?options'
      ]
    ]
  },
  {
    'name': 'G',
    'signatures': [
      [
        'pattern',
        'cb'
      ],
      [
        'pattern',
        'options',
        'cb'
      ]
    ]
  },
  {
    'name': 'minify',
    'signatures': [
      [
        'files',
        '?options'
      ],
      [
        'text',
        '?options'
      ]
    ]
  },
  {
    'name': 'createCoverageMap',
    'signatures': [
      [
        '?data'
      ]
    ]
  },
  {
    'name': 'createCoverageSummary',
    'signatures': [
      [
        '?obj'
      ]
    ]
  },
  {
    'name': 'createFileCoverage',
    'signatures': [
      [
        'pathOrObject'
      ]
    ]
  },
  {
    'name': 'sourceMapUrlCallback',
    'signatures': [
      [
        'filename',
        'url'
      ]
    ]
  },
  {
    'name': 'createInstrumenter',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'readInitialCoverage',
    'signatures': [
      [
        'code'
      ]
    ]
  },
  {
    'name': 'enter',
    'signatures': [
      [
        'path'
      ]
    ]
  },
  {
    'name': 'exit',
    'signatures': [
      [
        'path'
      ]
    ]
  },
  {
    'name': 'programVisitor',
    'signatures': [
      [
        'types',
        '?sourceFilePath',
        '?opts'
      ]
    ]
  },
  {
    'name': 'createContext',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'sourceFinder',
    'signatures': [
      [
        'filepath'
      ]
    ],
    'receiver': 'ContextOptions'
  },
  {
    'name': 'sourceFinder',
    'signatures': [
      [
        'filepath'
      ]
    ],
    'receiver': 'Context'
  },
  {
    'name': 'sourceFinder',
    'signatures': [
      [
        'filePath'
      ]
    ],
    'receiver': 'MapStore'
  },
  {
    'name': 'classForPercent',
    'signatures': [
      [
        'type',
        'value'
      ]
    ]
  },
  {
    'name': 'getSource',
    'signatures': [
      [
        'filepath'
      ]
    ]
  },
  {
    'name': 'getTree',
    'signatures': [
      [
        '?summarizer'
      ]
    ]
  },
  {
    'name': 'getVisitor',
    'signatures': [
      [
        'visitor'
      ]
    ]
  },
  {
    'name': 'getXmlWriter',
    'signatures': [
      [
        'contentWriter'
      ]
    ]
  },
  {
    'name': 'indent',
    'signatures': [
      [
        'str'
      ]
    ]
  },
  {
    'name': 'openTag',
    'signatures': [
      [
        'name',
        '?attrs'
      ]
    ]
  },
  {
    'name': 'closeTag',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'inlineTag',
    'signatures': [
      [
        'name',
        '?attrs',
        '?content'
      ]
    ]
  },
  {
    'name': 'visit',
    'signatures': [
      [
        'visitor',
        'state'
      ]
    ]
  },
  {
    'name': 'addChild',
    'signatures': [
      [
        'child'
      ]
    ]
  },
  {
    'name': 'asRelative',
    'signatures': [
      [
        'p'
      ]
    ]
  },
  {
    'name': 'getCoverageSummary',
    'signatures': [
      [
        'filesOnly'
      ]
    ]
  },
  {
    'name': 'onStart',
    'signatures': [
      [
        'root',
        'state'
      ]
    ]
  },
  {
    'name': 'onSummary',
    'signatures': [
      [
        'root',
        'state'
      ]
    ]
  },
  {
    'name': 'onDetail',
    'signatures': [
      [
        'root',
        'state'
      ]
    ]
  },
  {
    'name': 'onSummaryEnd',
    'signatures': [
      [
        'root',
        'state'
      ]
    ]
  },
  {
    'name': 'onEnd',
    'signatures': [
      [
        'root',
        'state'
      ]
    ]
  },
  {
    'name': 'createSourceMapStore',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'registerURL',
    'signatures': [
      [
        'transformedFilePath',
        'sourceMapUrl'
      ]
    ]
  },
  {
    'name': 'registerMap',
    'signatures': [
      [
        'filename',
        'sourceMap'
      ]
    ]
  },
  {
    'name': 'getSourceMapSync',
    'signatures': [
      [
        'filePath'
      ]
    ]
  },
  {
    'name': 'addInputSourceMapsSync',
    'signatures': [
      [
        'coverageData'
      ]
    ]
  },
  {
    'name': 'transformCoverage',
    'signatures': [
      [
        'coverageMap'
      ]
    ]
  },
  {
    'name': 'create',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'create',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'CredentialsContainer'
  },
  {
    'name': 'getPath',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'relativePath',
    'signatures': [
      [
        'source',
        'target'
      ]
    ]
  },
  {
    'name': 'assetPath',
    'signatures': [
      [
        'node',
        'name'
      ]
    ]
  },
  {
    'name': 'validate',
    'signatures': [
      [
        'instance',
        'schema'
      ]
    ]
  },
  {
    'name': 'checkPropertyChange',
    'signatures': [
      [
        'value',
        'schema',
        'property'
      ]
    ]
  },
  {
    'name': 'mustBeValid',
    'signatures': [
      [
        'result'
      ]
    ]
  },
  {
    'name': 'createClock',
    'signatures': [
      [
        '?start',
        '?loopLimit'
      ]
    ]
  },
  {
    'name': 'install',
    'signatures': [
      [
        '?config',
        '...args'
      ]
    ]
  },
  {
    'name': 'withGlobal',
    'signatures': [
      [
        '_global'
      ]
    ]
  },
  {
    'name': 'marked',
    'signatures': [
      [
        'src',
        '?options',
        '?callback'
      ],
      [
        'src',
        'callback'
      ]
    ]
  },
  {
    'name': 'minimist',
    'signatures': [
      [
        '?args',
        '?opts'
      ]
    ]
  },
  {
    'name': 'run',
    'signatures': [
      [
        'Server',
        'query',
        '?file'
      ]
    ],
    'receiver': 'Desc'
  },
  {
    'name': 'throwError',
    'signatures': [
      [
        'err'
      ]
    ]
  },
  {
    'name': 'setup',
    'signatures': [
      [
        '?opts'
      ]
    ]
  },
  {
    'name': 'normalize',
    'signatures': [
      [
        'data',
        '?strict'
      ],
      [
        'data',
        '?warn',
        '?strict'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'parseJson',
    'signatures': [
      [
        'input',
        '?filepath'
      ],
      [
        'input',
        'reviver',
        '?filepath'
      ]
    ]
  },
  {
    'name': 'parseFragment',
    'signatures': [
      [
        'html',
        '?options'
      ],
      [
        'fragmentContext',
        'html',
        '?options'
      ]
    ]
  },
  {
    'name': 'createDocument',
    'signatures': [
      [
        'namespaceURI',
        'qualifiedName',
        '?doctype'
      ]
    ],
    'receiver': 'DOMImplementation'
  },
  {
    'name': 'createElement',
    'signatures': [
      [
        'tagName',
        'namespaceURI',
        'attrs'
      ]
    ],
    'receiver': 'TreeAdapter'
  },
  {
    'name': 'createElement',
    'signatures': [
      [
        'localName',
        '?options'
      ]
    ],
    'receiver': 'Document'
  },
  {
    'name': 'createCommentNode',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'appendChild',
    'signatures': [
      [
        'parentNode',
        'newNode'
      ]
    ],
    'receiver': 'TreeAdapter'
  },
  {
    'name': 'appendChild',
    'signatures': [
      [
        'child'
      ]
    ],
    'receiver': 'AccessibleNode'
  },
  {
    'name': 'appendChild',
    'signatures': [
      [
        'node'
      ]
    ],
    'receiver': 'Node'
  },
  {
    'name': 'insertBefore',
    'signatures': [
      [
        'parentNode',
        'newNode',
        'referenceNode'
      ]
    ],
    'receiver': 'TreeAdapter'
  },
  {
    'name': 'insertBefore',
    'signatures': [
      [
        'node',
        'child'
      ]
    ],
    'receiver': 'Node'
  },
  {
    'name': 'setTemplateContent',
    'signatures': [
      [
        'templateElement',
        'contentTemplate'
      ]
    ]
  },
  {
    'name': 'getTemplateContent',
    'signatures': [
      [
        'templateElement'
      ]
    ]
  },
  {
    'name': 'setDocumentType',
    'signatures': [
      [
        'document',
        'name',
        'publicId',
        'systemId'
      ]
    ]
  },
  {
    'name': 'setQuirksMode',
    'signatures': [
      [
        'document'
      ]
    ]
  },
  {
    'name': 'isQuirksMode',
    'signatures': [
      [
        'document'
      ]
    ]
  },
  {
    'name': 'detachNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'insertText',
    'signatures': [
      [
        'parentNode',
        'text'
      ]
    ]
  },
  {
    'name': 'insertTextBefore',
    'signatures': [
      [
        'parentNode',
        'text',
        'referenceNode'
      ]
    ]
  },
  {
    'name': 'adoptAttributes',
    'signatures': [
      [
        'recipientNode',
        'attrs'
      ]
    ]
  },
  {
    'name': 'getFirstChild',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'getChildNodes',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'getParentNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'getAttrList',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'getTagName',
    'signatures': [
      [
        'element'
      ]
    ]
  },
  {
    'name': 'getNamespaceURI',
    'signatures': [
      [
        'element'
      ]
    ]
  },
  {
    'name': 'getTextNodeContent',
    'signatures': [
      [
        'textNode'
      ]
    ]
  },
  {
    'name': 'getCommentNodeContent',
    'signatures': [
      [
        'commentNode'
      ]
    ]
  },
  {
    'name': 'getDocumentTypeNodeName',
    'signatures': [
      [
        'doctypeNode'
      ]
    ]
  },
  {
    'name': 'getDocumentTypeNodePublicId',
    'signatures': [
      [
        'doctypeNode'
      ]
    ]
  },
  {
    'name': 'getDocumentTypeNodeSystemId',
    'signatures': [
      [
        'doctypeNode'
      ]
    ]
  },
  {
    'name': 'isTextNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'isCommentNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'isDocumentTypeNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'isElementNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'rimraf',
    'signatures': [
      [
        'path',
        'callback'
      ],
      [
        'path',
        'options',
        'callback'
      ]
    ]
  },
  {
    'name': 'addDefs',
    'signatures': [
      [
        'defs',
        '?atFront'
      ]
    ]
  },
  {
    'name': 'addFile',
    'signatures': [
      [
        'name',
        '?text',
        '?parent'
      ]
    ]
  },
  {
    'name': 'delFile',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'deleteDefs',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'flush',
    'signatures': [
      [
        'callback'
      ]
    ],
    'receiver': 'Server'
  },
  {
    'name': 'loadPlugin',
    'signatures': [
      [
        'name',
        'options'
      ]
    ]
  },
  {
    'name': 'request',
    'signatures': [
      [
        'doc',
        'callback'
      ]
    ],
    'receiver': 'Server'
  },
  {
    'name': 'request',
    'signatures': [
      [
        'name',
        'callback'
      ],
      [
        'name',
        'options',
        'callback'
      ]
    ],
    'receiver': 'LockManager'
  },
  {
    'name': 'request',
    'signatures': [
      [
        'permissions'
      ]
    ],
    'receiver': 'Permissions'
  },
  {
    'name': 'request',
    'signatures': [
      [
        '?type'
      ]
    ],
    'receiver': 'WakeLock'
  },
  {
    'name': 'signal',
    'signatures': [
      [
        'event',
        'file'
      ]
    ]
  },
  {
    'name': 'asLineChar',
    'signatures': [
      [
        'nodePosition'
      ]
    ]
  },
  {
    'name': 'beforeLoad',
    'signatures': [
      [
        'file'
      ]
    ]
  },
  {
    'name': 'afterLoad',
    'signatures': [
      [
        'file'
      ]
    ]
  },
  {
    'name': 'preParse',
    'signatures': [
      [
        'text',
        'options'
      ]
    ]
  },
  {
    'name': 'postParse',
    'signatures': [
      [
        'ast',
        'text'
      ]
    ]
  },
  {
    'name': 'preInfer',
    'signatures': [
      [
        'ast',
        'scope'
      ]
    ]
  },
  {
    'name': 'postInfer',
    'signatures': [
      [
        'ast',
        'scope'
      ]
    ]
  },
  {
    'name': 'typeAt',
    'signatures': [
      [
        'file',
        'end',
        'expr',
        'type'
      ]
    ]
  },
  {
    'name': 'completion',
    'signatures': [
      [
        'file',
        'query'
      ]
    ]
  },
  {
    'name': 'registerPlugin',
    'signatures': [
      [
        'name',
        'init'
      ]
    ]
  },
  {
    'name': 'defineQueryType',
    'signatures': [
      [
        'name',
        'desc'
      ]
    ]
  },
  {
    'name': 'withContext',
    'signatures': [
      [
        'context',
        'f'
      ]
    ]
  },
  {
    'name': 'analyze',
    'signatures': [
      [
        'ast',
        'name',
        '?scope'
      ]
    ]
  },
  {
    'name': 'purgeTypes',
    'signatures': [
      [
        'origins',
        '?start',
        '?end'
      ]
    ]
  },
  {
    'name': 'markVariablesDefinedBy',
    'signatures': [
      [
        'scope',
        'origins',
        '?start',
        '?end'
      ]
    ]
  },
  {
    'name': 'hasProp',
    'signatures': [
      [
        'prop'
      ]
    ]
  },
  {
    'name': 'defProp',
    'signatures': [
      [
        'prop',
        '?originNode'
      ]
    ]
  },
  {
    'name': 'getObjType',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'getType',
    'signatures': [
      [
        '?guess'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'getType',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'getType',
    'signatures': [
      [
        'type'
      ]
    ],
    'receiver': 'ClipboardItem'
  },
  {
    'name': 'getProp',
    'signatures': [
      [
        'prop'
      ]
    ],
    'receiver': 'Obj'
  },
  {
    'name': 'getProp',
    'signatures': [
      [
        'prop'
      ]
    ],
    'receiver': 'Prim'
  },
  {
    'name': 'getProp',
    'signatures': [
      [
        'prop'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'getProp',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'forAllProps',
    'signatures': [
      [
        'f'
      ]
    ],
    'receiver': 'Obj'
  },
  {
    'name': 'forAllProps',
    'signatures': [
      [
        'f'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'forAllProps',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'gatherProperties',
    'signatures': [
      [
        'f',
        'depth'
      ]
    ],
    'receiver': 'Obj'
  },
  {
    'name': 'gatherProperties',
    'signatures': [
      [
        'f',
        'depth'
      ]
    ],
    'receiver': 'Prim'
  },
  {
    'name': 'gatherProperties',
    'signatures': [
      [
        'f',
        'depth'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'gatherProperties',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'getFunctionType',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'toString',
    'signatures': [
      [
        'maxDepth'
      ]
    ],
    'receiver': 'IType'
  },
  {
    'name': 'toString',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'hasType',
    'signatures': [
      [
        'type'
      ]
    ],
    'receiver': 'IType'
  },
  {
    'name': 'hasType',
    'signatures': [
      [
        'type'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'hasType',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'addType',
    'signatures': [
      [
        'type',
        '?weight'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'addType',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'propagate',
    'signatures': [
      [
        'target'
      ]
    ],
    'receiver': 'AVal'
  },
  {
    'name': 'propagate',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'isEmpty',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'getSymbolType',
    'signatures': [
      [
        '...args'
      ]
    ]
  },
  {
    'name': 'typeHint',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'propHint',
    'signatures': [
      [
        '...args'
      ]
    ],
    'receiver': 'ANull'
  },
  {
    'name': 'defVar',
    'signatures': [
      [
        'name',
        'originNode'
      ]
    ]
  },
  {
    'name': 'findExpressionAt',
    'signatures': [
      [
        'ast',
        'start',
        'end',
        '?scope'
      ]
    ]
  },
  {
    'name': 'findExpressionAround',
    'signatures': [
      [
        'ast',
        'start',
        'end',
        '?scope'
      ]
    ]
  },
  {
    'name': 'findClosestExpression',
    'signatures': [
      [
        'ast',
        'start',
        'end',
        '?scope'
      ]
    ]
  },
  {
    'name': 'expressionType',
    'signatures': [
      [
        'expr'
      ]
    ]
  },
  {
    'name': 'scopeAt',
    'signatures': [
      [
        'ast',
        'pos',
        '?scope'
      ]
    ]
  },
  {
    'name': 'findRefs',
    'signatures': [
      [
        'ast',
        'scope',
        'name',
        'refScope',
        'f'
      ]
    ]
  },
  {
    'name': 'findPropRefs',
    'signatures': [
      [
        'ast',
        'scope',
        'objType',
        'propName',
        'f'
      ]
    ]
  },
  {
    'name': 'resetGuessing',
    'signatures': [
      [
        '?val'
      ]
    ]
  },
  {
    'name': 'open',
    'signatures': [
      [
        'path',
        '?callback'
      ],
      [
        'path',
        'options',
        '?callback'
      ],
      [
        '?url',
        '?target',
        '?features'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'open',
    'signatures': [
      [
        '?type',
        '?replace'
      ],
      [
        'url',
        'name',
        'features'
      ]
    ],
    'receiver': 'Document'
  },
  {
    'name': 'open',
    'signatures': [
      [
        'method',
        'url',
        '?async',
        '?username',
        '?password'
      ]
    ],
    'receiver': 'XMLHttpRequest'
  },
  {
    'name': 'open',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ],
    'receiver': 'StorageBucketManager'
  },
  {
    'name': 'open',
    'signatures': [
      [
        'cacheName'
      ]
    ],
    'receiver': 'CacheStorage'
  },
  {
    'name': 'open',
    'signatures': [
      [
        'name',
        '?version'
      ]
    ],
    'receiver': 'IDBFactory'
  },
  {
    'name': 'open',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'NativeIOFileManager'
  },
  {
    'name': 'fromFd',
    'signatures': [
      [
        'fd',
        '?callback'
      ],
      [
        'fd',
        'options',
        '?callback'
      ]
    ]
  },
  {
    'name': 'fromBuffer',
    'signatures': [
      [
        'buffer',
        '?callback'
      ],
      [
        'buffer',
        'options',
        '?callback'
      ]
    ]
  },
  {
    'name': 'fromRandomAccessReader',
    'signatures': [
      [
        'reader',
        'totalSize',
        'callback'
      ],
      [
        'reader',
        'totalSize',
        'options',
        'callback'
      ]
    ]
  },
  {
    'name': 'dosDateTimeToDate',
    'signatures': [
      [
        'date',
        'time'
      ]
    ]
  },
  {
    'name': 'validateFileName',
    'signatures': [
      [
        'fileName'
      ]
    ]
  },
  {
    'name': 'animate',
    'signatures': [
      [
        'keyframes',
        '?options'
      ]
    ]
  },
  {
    'name': 'getAnimations',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'Animatable'
  },
  {
    'name': 'updateTiming',
    'signatures': [
      [
        '?timing'
      ]
    ]
  },
  {
    'name': 'finish',
    'signatures': [
      [
        '?descriptor'
      ]
    ],
    'receiver': 'GPUCommandEncoder'
  },
  {
    'name': 'finish',
    'signatures': [
      [
        '?descriptor'
      ]
    ],
    'receiver': 'GPURenderBundleEncoder'
  },
  {
    'name': 'updatePlaybackRate',
    'signatures': [
      [
        'playback_rate'
      ]
    ]
  },
  {
    'name': 'cancel',
    'signatures': [
      [
        '?reason'
      ]
    ],
    'receiver': 'ReadableStreamBYOBReader'
  },
  {
    'name': 'cancel',
    'signatures': [
      [
        '?reason'
      ]
    ],
    'receiver': 'ReadableStream'
  },
  {
    'name': 'cancel',
    'signatures': [
      [
        '?reason'
      ]
    ],
    'receiver': 'UnderlyingSourceBase'
  },
  {
    'name': 'setKeyframes',
    'signatures': [
      [
        'keyframes'
      ]
    ]
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'AccessibleNodeList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSRuleList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSStyleDeclaration'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'MediaList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'StyleSheetList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'DOMStringList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'NamedNodeMap'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'NodeList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'FileList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'DOMRectList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'HTMLSelectElement'
  },
  {
    'name': 'item',
    'signatures': [
      [
        '?nameOrIndex'
      ]
    ],
    'receiver': 'HTMLAllCollection'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'HTMLCollection'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'TouchList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        '?index'
      ]
    ],
    'receiver': 'GamepadList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'MimeTypeArray'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'PluginArray'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'Plugin'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SpeechGrammarList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SpeechRecognitionResultList'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SpeechRecognitionResult'
  },
  {
    'name': 'item',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SQLResultSetRowList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'node'
      ]
    ],
    'receiver': 'AccessibleNodeList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'DataTransferItemList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSKeyframesRule'
  },
  {
    'name': '',
    'signatures': [
      [
        'name'
      ],
      [
        'property',
        '?propertyValue'
      ]
    ],
    'receiver': 'CSSStyleDeclaration'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSNumericArray'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        '?val'
      ]
    ],
    'receiver': 'CSSTransformValue'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        '?val'
      ]
    ],
    'receiver': 'CSSUnparsedValue'
  },
  {
    'name': '',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'StyleSheetList'
  },
  {
    'name': '',
    'signatures': [
      [
        'name',
        '?value'
      ]
    ],
    'receiver': 'DOMStringMap'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ],
      [
        'name'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'HTMLFormControlsCollection'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ],
      [
        'name'
      ]
    ],
    'receiver': 'HTMLFormElement'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        '?option'
      ],
      [
        'name'
      ]
    ],
    'receiver': 'HTMLOptionsCollection'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'option'
      ]
    ],
    'receiver': 'HTMLSelectElement'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'RadioNodeList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'HTMLAllCollection'
  },
  {
    'name': '',
    'signatures': [
      [
        'name',
        '?value'
      ]
    ],
    'receiver': 'HTMLEmbedElement'
  },
  {
    'name': '',
    'signatures': [
      [
        'name',
        '?value'
      ]
    ],
    'receiver': 'HTMLObjectElement'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'AudioTrackList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'TextTrackCueList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'TextTrackList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'VideoTrackList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'newItem'
      ]
    ],
    'receiver': 'SVGLengthList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'newItem'
      ]
    ],
    'receiver': 'SVGNumberList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'newItem'
      ]
    ],
    'receiver': 'SVGPointList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'newItem'
      ]
    ],
    'receiver': 'SVGStringList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index',
        'newItem'
      ]
    ],
    'receiver': 'SVGTransformList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'GamepadList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SourceBufferList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'TrackDefaultList'
  },
  {
    'name': '',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'RTCStatsResponse'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'ImageTrackList'
  },
  {
    'name': '',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'XRInputSourceArray'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'node',
        '?before'
      ]
    ],
    'receiver': 'AccessibleNodeList'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'file'
      ],
      [
        'data',
        'type'
      ]
    ],
    'receiver': 'DataTransferItemList'
  },
  {
    'name': 'add',
    'signatures': [
      [
        '...values'
      ]
    ],
    'receiver': 'CSSNumericValue'
  },
  {
    'name': 'add',
    'signatures': [
      [
        '...tokens'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'CustomStateSet'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'element',
        '?before'
      ]
    ],
    'receiver': 'HTMLOptionsCollection'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'element',
        '?before'
      ]
    ],
    'receiver': 'HTMLSelectElement'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'request'
      ]
    ],
    'receiver': 'Cache'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'description'
      ]
    ],
    'receiver': 'ContentIndex'
  },
  {
    'name': 'add',
    'signatures': [
      [
        'value',
        '?key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'removeChild',
    'signatures': [
      [
        'child'
      ]
    ]
  },
  {
    'name': 'respondWith',
    'signatures': [
      [
        'newNavigationAction'
      ]
    ],
    'receiver': 'AppHistoryNavigateEvent'
  },
  {
    'name': 'respondWith',
    'signatures': [
      [
        'paymentAbortedResponse'
      ]
    ],
    'receiver': 'AbortPaymentEvent'
  },
  {
    'name': 'respondWith',
    'signatures': [
      [
        'canMakePaymentResponse'
      ]
    ],
    'receiver': 'CanMakePaymentEvent'
  },
  {
    'name': 'respondWith',
    'signatures': [
      [
        'response'
      ]
    ],
    'receiver': 'PaymentRequestEvent'
  },
  {
    'name': 'respondWith',
    'signatures': [
      [
        'r'
      ]
    ],
    'receiver': 'FetchEvent'
  },
  {
    'name': 'navigate',
    'signatures': [
      [
        'options'
      ],
      [
        'url',
        '?options'
      ]
    ],
    'receiver': 'AppHistory'
  },
  {
    'name': 'navigate',
    'signatures': [
      [
        'url'
      ]
    ],
    'receiver': 'WindowClient'
  },
  {
    'name': 'goTo',
    'signatures': [
      [
        'key',
        '?options'
      ]
    ]
  },
  {
    'name': 'back',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'AppHistory'
  },
  {
    'name': 'forward',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'AppHistory'
  },
  {
    'name': 'clear',
    'signatures': [
      [
        'mask'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'getAsString',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'setDragImage',
    'signatures': [
      [
        'image',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'getData',
    'signatures': [
      [
        'format'
      ]
    ],
    'receiver': 'DataTransfer'
  },
  {
    'name': 'getData',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'LockScreenData'
  },
  {
    'name': 'setData',
    'signatures': [
      [
        'format',
        'data'
      ]
    ],
    'receiver': 'DataTransfer'
  },
  {
    'name': 'setData',
    'signatures': [
      [
        'key',
        'data'
      ]
    ],
    'receiver': 'LockScreenData'
  },
  {
    'name': 'clearData',
    'signatures': [
      [
        '?format'
      ]
    ]
  },
  {
    'name': 'insertRule',
    'signatures': [
      [
        'rule',
        'index'
      ]
    ],
    'receiver': 'CSSGroupingRule'
  },
  {
    'name': 'insertRule',
    'signatures': [
      [
        'rule',
        '?index'
      ]
    ],
    'receiver': 'CSSStyleSheet'
  },
  {
    'name': 'deleteRule',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSGroupingRule'
  },
  {
    'name': 'deleteRule',
    'signatures': [
      [
        'select'
      ]
    ],
    'receiver': 'CSSKeyframesRule'
  },
  {
    'name': 'deleteRule',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'CSSStyleSheet'
  },
  {
    'name': 'appendRule',
    'signatures': [
      [
        'rule'
      ]
    ]
  },
  {
    'name': 'findRule',
    'signatures': [
      [
        'select'
      ]
    ]
  },
  {
    'name': 'getPropertyValue',
    'signatures': [
      [
        'property'
      ]
    ]
  },
  {
    'name': 'getPropertyPriority',
    'signatures': [
      [
        'property'
      ]
    ]
  },
  {
    'name': 'setProperty',
    'signatures': [
      [
        'property',
        'value',
        '?priority'
      ]
    ]
  },
  {
    'name': 'removeProperty',
    'signatures': [
      [
        'property'
      ]
    ]
  },
  {
    'name': 'replace',
    'signatures': [
      [
        'text'
      ]
    ],
    'receiver': 'CSSStyleSheet'
  },
  {
    'name': 'replace',
    'signatures': [
      [
        'token',
        'newToken'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'replaceSync',
    'signatures': [
      [
        'text'
      ]
    ]
  },
  {
    'name': 'addRule',
    'signatures': [
      [
        '?selector',
        '?style',
        '?index'
      ]
    ]
  },
  {
    'name': 'removeRule',
    'signatures': [
      [
        '?index'
      ]
    ]
  },
  {
    'name': 'supports',
    'signatures': [
      [
        'conditionText'
      ],
      [
        'property',
        'value'
      ]
    ],
    'receiver': 'CSS'
  },
  {
    'name': 'supports',
    'signatures': [
      [
        'token'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'escape',
    'signatures': [
      [
        'ident'
      ]
    ]
  },
  {
    'name': 'sub',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'mul',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'div',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'min',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'max',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'equals',
    'signatures': [
      [
        '...values'
      ]
    ]
  },
  {
    'name': 'to',
    'signatures': [
      [
        'unit'
      ]
    ]
  },
  {
    'name': 'toSum',
    'signatures': [
      [
        '...units'
      ]
    ]
  },
  {
    'name': 'parseAll',
    'signatures': [
      [
        'property',
        'cssText'
      ]
    ]
  },
  {
    'name': 'number',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'percent',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'em',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'ex',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'ch',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'rem',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'vw',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'vh',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'vmin',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'vmax',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qw',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qh',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qi',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qb',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qmin',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'qmax',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'cm',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'mm',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'in',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'pt',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'pc',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'px',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'Q',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'deg',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'grad',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'rad',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'turn',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 's',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'ms',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'Hz',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'kHz',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'dpi',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'dpcm',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'dppx',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'fr',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'get',
    'signatures': [
      [
        'property'
      ]
    ],
    'receiver': 'StylePropertyMapReadOnly'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'Headers'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'CustomElementRegistry'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'BackgroundFetchManager'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'name'
      ],
      [
        '?options'
      ]
    ],
    'receiver': 'CookieStore'
  },
  {
    'name': 'get',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'CredentialsContainer'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'keyId'
      ]
    ],
    'receiver': 'MediaKeyStatusMap'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'IDBIndex'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'instrumentKey'
      ]
    ],
    'receiver': 'PaymentInstruments'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'Clients'
  },
  {
    'name': 'get',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'WebId'
  },
  {
    'name': 'get',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'XRHand'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        'property'
      ]
    ],
    'receiver': 'StylePropertyMapReadOnly'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        'name'
      ],
      [
        '?options'
      ]
    ],
    'receiver': 'CookieStore'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        '?query',
        '?count'
      ]
    ],
    'receiver': 'IDBIndex'
  },
  {
    'name': 'getAll',
    'signatures': [
      [
        '?query',
        '?count'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'property'
      ]
    ],
    'receiver': 'StylePropertyMapReadOnly'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'Headers'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'cacheName'
      ]
    ],
    'receiver': 'CacheStorage'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'keyId'
      ]
    ],
    'receiver': 'MediaKeyStatusMap'
  },
  {
    'name': 'has',
    'signatures': [
      [
        'instrumentKey'
      ]
    ],
    'receiver': 'PaymentInstruments'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'property',
        '...values'
      ]
    ],
    'receiver': 'StylePropertyMap'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'key',
        'value'
      ]
    ],
    'receiver': 'Headers'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'name',
        'value',
        '?filename'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'name',
        'value'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'cookieInit'
      ],
      [
        'name',
        'value'
      ]
    ],
    'receiver': 'CookieStore'
  },
  {
    'name': 'set',
    'signatures': [
      [
        'instrumentKey',
        'details'
      ]
    ],
    'receiver': 'PaymentInstruments'
  },
  {
    'name': 'append',
    'signatures': [
      [
        'property',
        '...values'
      ]
    ],
    'receiver': 'StylePropertyMap'
  },
  {
    'name': 'append',
    'signatures': [
      [
        '...nodes'
      ]
    ],
    'receiver': 'ParentNode'
  },
  {
    'name': 'append',
    'signatures': [
      [
        'name',
        'value'
      ]
    ],
    'receiver': 'Headers'
  },
  {
    'name': 'append',
    'signatures': [
      [
        'name',
        'value',
        '?filename'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'append',
    'signatures': [
      [
        'name',
        'value'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'property'
      ]
    ],
    'receiver': 'StylePropertyMap'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'Headers'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'FormData'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'URLSearchParams'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'StorageBucketManager'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'cacheName'
      ]
    ],
    'receiver': 'CacheStorage'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'request',
        '?options'
      ]
    ],
    'receiver': 'Cache'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'ContentIndex'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'name'
      ],
      [
        'options'
      ]
    ],
    'receiver': 'CookieStore'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'NativeIOFileManager'
  },
  {
    'name': 'delete',
    'signatures': [
      [
        'instrumentKey'
      ]
    ],
    'receiver': 'PaymentInstruments'
  },
  {
    'name': 'load',
    'signatures': [
      [
        'font',
        '?text'
      ]
    ],
    'receiver': 'FontFaceSet'
  },
  {
    'name': 'load',
    'signatures': [
      [
        'sessionId'
      ]
    ],
    'receiver': 'MediaKeySession'
  },
  {
    'name': 'check',
    'signatures': [
      [
        'font',
        '?text'
      ]
    ]
  },
  {
    'name': 'appendMedium',
    'signatures': [
      [
        'medium'
      ]
    ]
  },
  {
    'name': 'deleteMedium',
    'signatures': [
      [
        'medium'
      ]
    ]
  },
  {
    'name': 'addListener',
    'signatures': [
      [
        'listener'
      ]
    ]
  },
  {
    'name': 'removeListener',
    'signatures': [
      [
        'listener'
      ]
    ]
  },
  {
    'name': 'registerProperty',
    'signatures': [
      [
        'definition'
      ]
    ]
  },
  {
    'name': 'matchMedium',
    'signatures': [
      [
        '?mediaquery'
      ]
    ]
  },
  {
    'name': 'prepare',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'start',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'DocumentTransition'
  },
  {
    'name': 'start',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'TimeRanges'
  },
  {
    'name': 'start',
    'signatures': [
      [
        'controller'
      ]
    ],
    'receiver': 'UnderlyingSinkBase'
  },
  {
    'name': 'start',
    'signatures': [
      [
        'stream'
      ]
    ],
    'receiver': 'UnderlyingSourceBase'
  },
  {
    'name': 'start',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'IdleDetector'
  },
  {
    'name': 'start',
    'signatures': [
      [
        '?timeslice'
      ]
    ],
    'receiver': 'MediaRecorder'
  },
  {
    'name': 'start',
    'signatures': [
      [
        'remoteParameters',
        '?role'
      ]
    ],
    'receiver': 'RTCIceTransport'
  },
  {
    'name': 'start',
    'signatures': [
      [
        '?when',
        '?grainOffset',
        '?grainDuration'
      ]
    ],
    'receiver': 'AudioBufferSourceNode'
  },
  {
    'name': 'start',
    'signatures': [
      [
        '?when'
      ]
    ],
    'receiver': 'AudioScheduledSourceNode'
  },
  {
    'name': 'substringData',
    'signatures': [
      [
        'offset',
        'count'
      ]
    ]
  },
  {
    'name': 'appendData',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'insertData',
    'signatures': [
      [
        'offset',
        'data'
      ]
    ]
  },
  {
    'name': 'deleteData',
    'signatures': [
      [
        'offset',
        'count'
      ]
    ],
    'receiver': 'CharacterData'
  },
  {
    'name': 'deleteData',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'LockScreenData'
  },
  {
    'name': 'replaceData',
    'signatures': [
      [
        'offset',
        'count',
        'data'
      ]
    ]
  },
  {
    'name': 'before',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'after',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'replaceWith',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'elementFromPoint',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'elementsFromPoint',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'getElementsByTagName',
    'signatures': [
      [
        'localName'
      ]
    ]
  },
  {
    'name': 'getElementsByTagNameNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'getElementsByClassName',
    'signatures': [
      [
        'classNames'
      ]
    ]
  },
  {
    'name': 'createElementNS',
    'signatures': [
      [
        'namespaceURI',
        'qualifiedName',
        '?options'
      ]
    ]
  },
  {
    'name': 'createTextNode',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'createCDATASection',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'createComment',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'createProcessingInstruction',
    'signatures': [
      [
        'target',
        'data'
      ]
    ]
  },
  {
    'name': 'importNode',
    'signatures': [
      [
        'node',
        '?deep'
      ]
    ]
  },
  {
    'name': 'adoptNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'createAttribute',
    'signatures': [
      [
        'localName'
      ]
    ]
  },
  {
    'name': 'createAttributeNS',
    'signatures': [
      [
        'namespaceURI',
        'qualifiedName'
      ]
    ]
  },
  {
    'name': 'createEvent',
    'signatures': [
      [
        'eventType'
      ]
    ]
  },
  {
    'name': 'createNodeIterator',
    'signatures': [
      [
        'root',
        '?whatToShow',
        '?filter'
      ]
    ]
  },
  {
    'name': 'createTreeWalker',
    'signatures': [
      [
        'root',
        '?whatToShow',
        '?filter'
      ]
    ]
  },
  {
    'name': 'getElementsByName',
    'signatures': [
      [
        'elementName'
      ]
    ]
  },
  {
    'name': 'close',
    'signatures': [
      [
        '?returnValue'
      ]
    ],
    'receiver': 'HTMLDialogElement'
  },
  {
    'name': 'close',
    'signatures': [
      [
        '?closeInfo'
      ]
    ],
    'receiver': 'WebSocketStream'
  },
  {
    'name': 'close',
    'signatures': [
      [
        '?code',
        '?reason'
      ]
    ],
    'receiver': 'WebSocket'
  },
  {
    'name': 'close',
    'signatures': [
      [
        '?closeInfo'
      ]
    ],
    'receiver': 'WebTransport'
  },
  {
    'name': 'writeln',
    'signatures': [
      [
        '...text'
      ],
      [
        'text'
      ]
    ]
  },
  {
    'name': 'execCommand',
    'signatures': [
      [
        'commandId',
        '?showUI',
        '?value'
      ]
    ]
  },
  {
    'name': 'queryCommandEnabled',
    'signatures': [
      [
        'commandId'
      ]
    ]
  },
  {
    'name': 'queryCommandIndeterm',
    'signatures': [
      [
        'commandId'
      ]
    ]
  },
  {
    'name': 'queryCommandState',
    'signatures': [
      [
        'commandId'
      ]
    ]
  },
  {
    'name': 'queryCommandSupported',
    'signatures': [
      [
        'commandId'
      ]
    ]
  },
  {
    'name': 'queryCommandValue',
    'signatures': [
      [
        'commandId'
      ]
    ]
  },
  {
    'name': 'caretRangeFromPoint',
    'signatures': [
      [
        '?x',
        '?y'
      ]
    ]
  },
  {
    'name': 'hasTrustToken',
    'signatures': [
      [
        'issuer'
      ]
    ]
  },
  {
    'name': 'createDocumentType',
    'signatures': [
      [
        'qualifiedName',
        'publicId',
        'systemId'
      ]
    ]
  },
  {
    'name': 'createHTMLDocument',
    'signatures': [
      [
        '?title'
      ]
    ]
  },
  {
    'name': 'contains',
    'signatures': [
      [
        'string'
      ]
    ],
    'receiver': 'DOMStringList'
  },
  {
    'name': 'contains',
    'signatures': [
      [
        'token'
      ]
    ],
    'receiver': 'DOMTokenList'
  },
  {
    'name': 'contains',
    'signatures': [
      [
        'other'
      ]
    ],
    'receiver': 'Node'
  },
  {
    'name': 'toggle',
    'signatures': [
      [
        'token',
        '?force'
      ]
    ]
  },
  {
    'name': 'getAttribute',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'getAttributeNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'setAttribute',
    'signatures': [
      [
        'name',
        'value'
      ]
    ]
  },
  {
    'name': 'setAttributeNS',
    'signatures': [
      [
        'namespaceURI',
        'name',
        'value'
      ]
    ]
  },
  {
    'name': 'removeAttribute',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'removeAttributeNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'toggleAttribute',
    'signatures': [
      [
        'qualifiedName',
        '?force'
      ]
    ]
  },
  {
    'name': 'hasAttribute',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'hasAttributeNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'getAttributeNode',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'getAttributeNodeNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'setAttributeNode',
    'signatures': [
      [
        'attr'
      ]
    ]
  },
  {
    'name': 'setAttributeNodeNS',
    'signatures': [
      [
        'attr'
      ]
    ]
  },
  {
    'name': 'removeAttributeNode',
    'signatures': [
      [
        'attr'
      ]
    ]
  },
  {
    'name': 'attachShadow',
    'signatures': [
      [
        'shadowRootInitDict'
      ]
    ]
  },
  {
    'name': 'closest',
    'signatures': [
      [
        'selectors'
      ]
    ]
  },
  {
    'name': 'matches',
    'signatures': [
      [
        'selectors'
      ]
    ]
  },
  {
    'name': 'webkitMatchesSelector',
    'signatures': [
      [
        'selectors'
      ]
    ]
  },
  {
    'name': 'insertAdjacentElement',
    'signatures': [
      [
        'where',
        'element'
      ]
    ]
  },
  {
    'name': 'insertAdjacentText',
    'signatures': [
      [
        'where',
        'data'
      ]
    ]
  },
  {
    'name': 'setPointerCapture',
    'signatures': [
      [
        'pointerId'
      ]
    ]
  },
  {
    'name': 'releasePointerCapture',
    'signatures': [
      [
        'pointerId'
      ]
    ]
  },
  {
    'name': 'hasPointerCapture',
    'signatures': [
      [
        'pointerId'
      ]
    ]
  },
  {
    'name': 'insertAdjacentHTML',
    'signatures': [
      [
        'position',
        'text'
      ]
    ]
  },
  {
    'name': 'getInnerHTML',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'requestPointerLock',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'scrollIntoView',
    'signatures': [
      [
        '?arg'
      ]
    ]
  },
  {
    'name': 'scroll',
    'signatures': [
      [
        '?options'
      ],
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'scrollTo',
    'signatures': [
      [
        '?options'
      ],
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'scrollBy',
    'signatures': [
      [
        '?options'
      ],
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'scrollIntoViewIfNeeded',
    'signatures': [
      [
        '?centerIfNeeded'
      ]
    ]
  },
  {
    'name': 'initCustomEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?detail'
      ]
    ]
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'event'
      ]
    ],
    'receiver': 'EventListener'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'entries'
      ]
    ],
    'receiver': 'EntriesCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'entry'
      ]
    ],
    'receiver': 'EntryCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'error'
      ]
    ],
    'receiver': 'ErrorCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'file'
      ]
    ],
    'receiver': 'FileCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'fileSystem'
      ]
    ],
    'receiver': 'FileSystemCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'fileWriter'
      ]
    ],
    'receiver': 'FileWriterCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'metadata'
      ]
    ],
    'receiver': 'MetadataCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'transaction',
        'resultSet'
      ]
    ],
    'receiver': 'SQLStatementCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'transaction',
        'error'
      ]
    ],
    'receiver': 'SQLStatementErrorCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'transaction'
      ]
    ],
    'receiver': 'SQLTransactionCallback'
  },
  {
    'name': 'handleEvent',
    'signatures': [
      [
        'error'
      ]
    ],
    'receiver': 'SQLTransactionErrorCallback'
  },
  {
    'name': 'addEventListener',
    'signatures': [
      [
        'type',
        'listener',
        '?options'
      ]
    ]
  },
  {
    'name': 'removeEventListener',
    'signatures': [
      [
        'type',
        'listener',
        '?options'
      ]
    ]
  },
  {
    'name': 'dispatchEvent',
    'signatures': [
      [
        'event'
      ]
    ]
  },
  {
    'name': 'initEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable'
      ]
    ]
  },
  {
    'name': 'next',
    'signatures': [
      [
        '?value'
      ]
    ],
    'receiver': 'Iterator'
  },
  {
    'name': 'observe',
    'signatures': [
      [
        'target',
        '?options'
      ]
    ],
    'receiver': 'MutationObserver'
  },
  {
    'name': 'observe',
    'signatures': [
      [
        'target'
      ]
    ],
    'receiver': 'IntersectionObserver'
  },
  {
    'name': 'observe',
    'signatures': [
      [
        'target',
        '?options'
      ]
    ],
    'receiver': 'ResizeObserver'
  },
  {
    'name': 'observe',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'PerformanceObserver'
  },
  {
    'name': 'disconnect',
    'signatures': [
      [
        '?output'
      ],
      [
        'destination',
        '?output',
        '?input'
      ]
    ],
    'receiver': 'AudioNode'
  },
  {
    'name': 'getNamedItem',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'getNamedItemNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'setNamedItem',
    'signatures': [
      [
        'attr'
      ]
    ]
  },
  {
    'name': 'setNamedItemNS',
    'signatures': [
      [
        'attr'
      ]
    ]
  },
  {
    'name': 'removeNamedItem',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'removeNamedItemNS',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'acceptNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'setApplyScroll',
    'signatures': [
      [
        'scrollStateCallback',
        'nativeScrollBehavior'
      ]
    ]
  },
  {
    'name': 'setDistributeScroll',
    'signatures': [
      [
        'scrollStateCallback',
        'nativeScrollBehavior'
      ]
    ]
  },
  {
    'name': 'getRootNode',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'cloneNode',
    'signatures': [
      [
        '?deep'
      ]
    ]
  },
  {
    'name': 'isEqualNode',
    'signatures': [
      [
        'otherNode'
      ]
    ]
  },
  {
    'name': 'isSameNode',
    'signatures': [
      [
        'otherNode'
      ]
    ]
  },
  {
    'name': 'compareDocumentPosition',
    'signatures': [
      [
        'other'
      ]
    ]
  },
  {
    'name': 'lookupPrefix',
    'signatures': [
      [
        'namespaceURI'
      ]
    ]
  },
  {
    'name': 'lookupNamespaceURI',
    'signatures': [
      [
        'prefix'
      ]
    ],
    'receiver': 'Node'
  },
  {
    'name': 'lookupNamespaceURI',
    'signatures': [
      [
        '?prefix'
      ]
    ],
    'receiver': 'XPathNSResolver'
  },
  {
    'name': 'isDefaultNamespace',
    'signatures': [
      [
        'namespaceURI'
      ]
    ]
  },
  {
    'name': 'replaceChild',
    'signatures': [
      [
        'node',
        'child'
      ]
    ]
  },
  {
    'name': 'getElementById',
    'signatures': [
      [
        'elementId'
      ]
    ]
  },
  {
    'name': 'prepend',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'replaceChildren',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'querySelector',
    'signatures': [
      [
        'selectors'
      ]
    ]
  },
  {
    'name': 'querySelectorAll',
    'signatures': [
      [
        'selectors'
      ]
    ]
  },
  {
    'name': 'setStart',
    'signatures': [
      [
        'node',
        'offset'
      ]
    ]
  },
  {
    'name': 'setEnd',
    'signatures': [
      [
        'node',
        'offset'
      ]
    ]
  },
  {
    'name': 'setStartBefore',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'setStartAfter',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'setEndBefore',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'setEndAfter',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'collapse',
    'signatures': [
      [
        '?toStart'
      ]
    ],
    'receiver': 'Range'
  },
  {
    'name': 'collapse',
    'signatures': [
      [
        'node',
        '?offset'
      ]
    ],
    'receiver': 'Selection'
  },
  {
    'name': 'selectNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'selectNodeContents',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'compareBoundaryPoints',
    'signatures': [
      [
        'how',
        'sourceRange'
      ]
    ]
  },
  {
    'name': 'insertNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'surroundContents',
    'signatures': [
      [
        'newParent'
      ]
    ]
  },
  {
    'name': 'isPointInRange',
    'signatures': [
      [
        'node',
        'offset'
      ]
    ]
  },
  {
    'name': 'comparePoint',
    'signatures': [
      [
        'node',
        'offset'
      ]
    ]
  },
  {
    'name': 'intersectsNode',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'createContextualFragment',
    'signatures': [
      [
        'fragment'
      ]
    ]
  },
  {
    'name': 'expand',
    'signatures': [
      [
        '?unit'
      ]
    ]
  },
  {
    'name': 'splitText',
    'signatures': [
      [
        'offset'
      ]
    ]
  },
  {
    'name': 'updateSelection',
    'signatures': [
      [
        'start',
        'end'
      ]
    ]
  },
  {
    'name': 'updateLayout',
    'signatures': [
      [
        'controlBounds',
        'selectionBounds'
      ]
    ]
  },
  {
    'name': 'updateText',
    'signatures': [
      [
        'start',
        'end',
        'newText'
      ]
    ]
  },
  {
    'name': 'getRangeAt',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'addRange',
    'signatures': [
      [
        'range'
      ]
    ]
  },
  {
    'name': 'removeRange',
    'signatures': [
      [
        'range'
      ]
    ]
  },
  {
    'name': 'setPosition',
    'signatures': [
      [
        'node',
        '?offset'
      ]
    ],
    'receiver': 'Selection'
  },
  {
    'name': 'setPosition',
    'signatures': [
      [
        'x',
        'y',
        'z'
      ]
    ],
    'receiver': 'AudioListener'
  },
  {
    'name': 'setPosition',
    'signatures': [
      [
        'x',
        'y',
        'z'
      ]
    ],
    'receiver': 'PannerNode'
  },
  {
    'name': 'extend',
    'signatures': [
      [
        'node',
        '?offset'
      ]
    ]
  },
  {
    'name': 'setBaseAndExtent',
    'signatures': [
      [
        'baseNode',
        'baseOffset',
        'extentNode',
        'extentOffset'
      ]
    ]
  },
  {
    'name': 'selectAllChildren',
    'signatures': [
      [
        'node'
      ]
    ]
  },
  {
    'name': 'containsNode',
    'signatures': [
      [
        'node',
        '?allowPartialContainment'
      ]
    ]
  },
  {
    'name': 'modify',
    'signatures': [
      [
        '?alter',
        '?direction',
        '?granularity'
      ]
    ]
  },
  {
    'name': 'initCompositionEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?view',
        '?data'
      ]
    ]
  },
  {
    'name': 'getModifierState',
    'signatures': [
      [
        'keyArg'
      ]
    ]
  },
  {
    'name': 'initKeyboardEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?view',
        '?keyIdentifier',
        '?location',
        '?ctrlKey',
        '?altKey',
        '?shiftKey',
        '?metaKey'
      ]
    ]
  },
  {
    'name': 'initMessageEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?data',
        '?origin',
        '?lastEventId',
        '?source',
        '?ports'
      ]
    ]
  },
  {
    'name': 'initMouseEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?view',
        '?detail',
        '?screenX',
        '?screenY',
        '?clientX',
        '?clientY',
        '?ctrlKey',
        '?altKey',
        '?shiftKey',
        '?metaKey',
        '?button',
        '?relatedTarget'
      ]
    ]
  },
  {
    'name': 'initMutationEvent',
    'signatures': [
      [
        '?type',
        '?bubbles',
        '?cancelable',
        '?relatedNode',
        '?prevValue',
        '?newValue',
        '?attrName',
        '?attrChange'
      ]
    ]
  },
  {
    'name': 'initTextEvent',
    'signatures': [
      [
        '?type',
        '?bubbles',
        '?cancelable',
        '?view',
        '?data'
      ]
    ]
  },
  {
    'name': 'initUIEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?view',
        '?detail'
      ]
    ]
  },
  {
    'name': 'error',
    'signatures': [
      [
        '?e'
      ]
    ],
    'receiver': 'ReadableByteStreamController'
  },
  {
    'name': 'error',
    'signatures': [
      [
        '?e'
      ]
    ],
    'receiver': 'ReadableStreamDefaultController'
  },
  {
    'name': 'error',
    'signatures': [
      [
        '?reason'
      ]
    ],
    'receiver': 'TransformStreamDefaultController'
  },
  {
    'name': 'error',
    'signatures': [
      [
        '?e'
      ]
    ],
    'receiver': 'WritableStreamDefaultController'
  },
  {
    'name': 'error',
    'signatures': [
      [
        '...data'
      ]
    ],
    'receiver': 'console'
  },
  {
    'name': 'redirect',
    'signatures': [
      [
        'url',
        '?status'
      ]
    ]
  },
  {
    'name': 'fetch',
    'signatures': [
      [
        'input',
        '?init'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'fetch',
    'signatures': [
      [
        'input',
        '?init'
      ]
    ],
    'receiver': 'WorkerGlobalScope'
  },
  {
    'name': 'fetch',
    'signatures': [
      [
        'id',
        'requests',
        '?options'
      ]
    ],
    'receiver': 'BackgroundFetchManager'
  },
  {
    'name': 'readAsArrayBuffer',
    'signatures': [
      [
        'blob'
      ]
    ]
  },
  {
    'name': 'readAsBinaryString',
    'signatures': [
      [
        'blob'
      ]
    ]
  },
  {
    'name': 'readAsText',
    'signatures': [
      [
        'blob',
        '?label'
      ]
    ]
  },
  {
    'name': 'readAsDataURL',
    'signatures': [
      [
        'blob'
      ]
    ]
  },
  {
    'name': 'createObjectURL',
    'signatures': [
      [
        'blob'
      ],
      [
        'source'
      ]
    ]
  },
  {
    'name': 'revokeObjectURL',
    'signatures': [
      [
        'url'
      ]
    ]
  },
  {
    'name': 'registerAttributionSource',
    'signatures': [
      [
        'params'
      ]
    ]
  },
  {
    'name': 'go',
    'signatures': [
      [
        '?delta'
      ]
    ]
  },
  {
    'name': 'pushState',
    'signatures': [
      [
        'data',
        'title',
        '?url'
      ]
    ]
  },
  {
    'name': 'replaceState',
    'signatures': [
      [
        'data',
        'title',
        '?url'
      ]
    ]
  },
  {
    'name': 'getHighEntropyValues',
    'signatures': [
      [
        'hints'
      ]
    ]
  },
  {
    'name': 'isInputPending',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'stop',
    'signatures': [
      [
        '?when'
      ]
    ],
    'receiver': 'AudioScheduledSourceNode'
  },
  {
    'name': 'focus',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'HTMLOrForeignElement'
  },
  {
    'name': 'alert',
    'signatures': [
      [
        '?message'
      ]
    ]
  },
  {
    'name': 'confirm',
    'signatures': [
      [
        '?message'
      ]
    ]
  },
  {
    'name': 'prompt',
    'signatures': [
      [
        '?message',
        '?defaultValue'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        '?options'
      ],
      [
        'message',
        'targetOrigin',
        '?transfer'
      ]
    ],
    'receiver': 'Window'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'HTMLPortalElement'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'PortalHost'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        'transfer'
      ],
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'MessagePort'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        'transfer'
      ],
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'DedicatedWorkerGlobalScope'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        'transfer'
      ],
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'Worker'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message'
      ]
    ],
    'receiver': 'BroadcastChannel'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        'transfer'
      ],
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'Client'
  },
  {
    'name': 'postMessage',
    'signatures': [
      [
        'message',
        'transfer'
      ],
      [
        'message',
        '?options'
      ]
    ],
    'receiver': 'ServiceWorker'
  },
  {
    'name': 'queueMicrotask',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'requestAnimationFrame',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'cancelAnimationFrame',
    'signatures': [
      [
        'handle'
      ]
    ]
  },
  {
    'name': 'requestIdleCallback',
    'signatures': [
      [
        'callback',
        '?options'
      ]
    ]
  },
  {
    'name': 'cancelIdleCallback',
    'signatures': [
      [
        'handle'
      ]
    ]
  },
  {
    'name': 'getComputedStyle',
    'signatures': [
      [
        'elt',
        '?pseudoElt'
      ]
    ]
  },
  {
    'name': 'matchMedia',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'moveBy',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'resizeTo',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'resizeBy',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'getComputedAccessibleNode',
    'signatures': [
      [
        'element'
      ]
    ]
  },
  {
    'name': 'find',
    'signatures': [
      [
        '?string',
        '?caseSensitive',
        '?backwards',
        '?wrap',
        '?wholeWord',
        '?searchInFrames',
        '?showDialog'
      ]
    ]
  },
  {
    'name': 'webkitRequestAnimationFrame',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'webkitCancelAnimationFrame',
    'signatures': [
      [
        'id'
      ]
    ]
  },
  {
    'name': 'requestFullscreen',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'webkitRequestFullScreen',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'webkitRequestFullscreen',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'fromMatrix',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'fromFloat32Array',
    'signatures': [
      [
        'array32'
      ]
    ]
  },
  {
    'name': 'fromFloat64Array',
    'signatures': [
      [
        'array64'
      ]
    ]
  },
  {
    'name': 'translate',
    'signatures': [
      [
        '?tx',
        '?ty',
        '?tz'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'translate',
    'signatures': [
      [
        'x',
        'y'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'translate',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'translate',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'translate',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'PaintRenderingContext2D'
  },
  {
    'name': 'scale',
    'signatures': [
      [
        '?scaleX',
        '?scaleY',
        '?scaleZ',
        '?originX',
        '?originY',
        '?originZ'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'scale',
    'signatures': [
      [
        'scaleFactor'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'scale',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'scale',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'scale',
    'signatures': [
      [
        'x',
        'y',
        '?z'
      ]
    ],
    'receiver': 'PaintRenderingContext2D'
  },
  {
    'name': 'scaleNonUniform',
    'signatures': [
      [
        '?scaleX',
        '?scaleY'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'scaleNonUniform',
    'signatures': [
      [
        'scaleFactorX',
        'scaleFactorY'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'scale3d',
    'signatures': [
      [
        '?scale',
        '?originX',
        '?originY',
        '?originZ'
      ]
    ]
  },
  {
    'name': 'rotate',
    'signatures': [
      [
        '?rotX',
        '?rotY',
        '?rotZ'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'rotate',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'rotate',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'rotate',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'rotate',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'PaintRenderingContext2D'
  },
  {
    'name': 'rotateFromVector',
    'signatures': [
      [
        '?x',
        '?y'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'rotateFromVector',
    'signatures': [
      [
        'x',
        'y'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'rotateAxisAngle',
    'signatures': [
      [
        '?x',
        '?y',
        '?z',
        '?angle'
      ]
    ]
  },
  {
    'name': 'skewX',
    'signatures': [
      [
        '?sx'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'skewX',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'skewY',
    'signatures': [
      [
        '?sy'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'skewY',
    'signatures': [
      [
        'angle'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'multiply',
    'signatures': [
      [
        '?other'
      ]
    ],
    'receiver': 'DOMMatrixReadOnly'
  },
  {
    'name': 'multiply',
    'signatures': [
      [
        'secondMatrix'
      ]
    ],
    'receiver': 'SVGMatrix'
  },
  {
    'name': 'transformPoint',
    'signatures': [
      [
        '?point'
      ]
    ]
  },
  {
    'name': 'multiplySelf',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'preMultiplySelf',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'translateSelf',
    'signatures': [
      [
        '?tx',
        '?ty',
        '?tz'
      ]
    ]
  },
  {
    'name': 'scaleSelf',
    'signatures': [
      [
        '?scaleX',
        '?scaleY',
        '?scaleZ',
        '?originX',
        '?originY',
        '?originZ'
      ]
    ]
  },
  {
    'name': 'scale3dSelf',
    'signatures': [
      [
        '?scale',
        '?originX',
        '?originY',
        '?originZ'
      ]
    ]
  },
  {
    'name': 'rotateSelf',
    'signatures': [
      [
        '?rotX',
        '?rotY',
        '?rotZ'
      ]
    ]
  },
  {
    'name': 'rotateFromVectorSelf',
    'signatures': [
      [
        '?x',
        '?y'
      ]
    ]
  },
  {
    'name': 'rotateAxisAngleSelf',
    'signatures': [
      [
        '?x',
        '?y',
        '?z',
        '?angle'
      ]
    ]
  },
  {
    'name': 'skewXSelf',
    'signatures': [
      [
        '?sx'
      ]
    ]
  },
  {
    'name': 'skewYSelf',
    'signatures': [
      [
        '?sy'
      ]
    ]
  },
  {
    'name': 'setMatrixValue',
    'signatures': [
      [
        'transformList'
      ]
    ]
  },
  {
    'name': 'fromPoint',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'matrixTransform',
    'signatures': [
      [
        '?matrix'
      ]
    ],
    'receiver': 'DOMPointReadOnly'
  },
  {
    'name': 'matrixTransform',
    'signatures': [
      [
        'matrix'
      ]
    ],
    'receiver': 'SVGPoint'
  },
  {
    'name': 'fromRect',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'fromQuad',
    'signatures': [
      [
        '?other'
      ]
    ]
  },
  {
    'name': 'toDataURL',
    'signatures': [
      [
        '?type',
        '?quality'
      ]
    ]
  },
  {
    'name': 'toBlob',
    'signatures': [
      [
        'callback',
        '?type',
        '?quality'
      ]
    ]
  },
  {
    'name': 'convertToBlob',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'define',
    'signatures': [
      [
        'name',
        'constructor',
        '?options'
      ]
    ]
  },
  {
    'name': 'whenDefined',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'upgrade',
    'signatures': [
      [
        'root'
      ]
    ]
  },
  {
    'name': 'setCustomValidity',
    'signatures': [
      [
        'error'
      ]
    ]
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'HTMLFormControlsCollection'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'HTMLSelectElement'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'HTMLAllCollection'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'HTMLCollection'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        '?name'
      ]
    ],
    'receiver': 'RTCStatsResponse'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'MimeTypeArray'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'PluginArray'
  },
  {
    'name': 'namedItem',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'Plugin'
  },
  {
    'name': 'submit',
    'signatures': [
      [
        'buffers'
      ]
    ],
    'receiver': 'GPUQueue'
  },
  {
    'name': 'requestSubmit',
    'signatures': [
      [
        '?submitter'
      ]
    ]
  },
  {
    'name': 'stepUp',
    'signatures': [
      [
        '?n'
      ]
    ]
  },
  {
    'name': 'stepDown',
    'signatures': [
      [
        '?n'
      ]
    ]
  },
  {
    'name': 'select',
    'signatures': [
      [
        'properties',
        '?options'
      ]
    ],
    'receiver': 'ContactsManager'
  },
  {
    'name': 'setRangeText',
    'signatures': [
      [
        'replacement',
        '?start',
        '?end',
        '?selectionMode'
      ]
    ]
  },
  {
    'name': 'setSelectionRange',
    'signatures': [
      [
        'start',
        'end',
        '?direction'
      ]
    ]
  },
  {
    'name': 'Option',
    'signatures': [
      [
        '?data',
        '?value',
        '?defaultSelected',
        '?selected'
      ]
    ]
  },
  {
    'name': 'show',
    'signatures': [
      [
        '?detailsPromise'
      ]
    ],
    'receiver': 'PaymentRequest'
  },
  {
    'name': 'Image',
    'signatures': [
      [
        '?width',
        '?height'
      ]
    ]
  },
  {
    'name': 'assignedNodes',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'assignedElements',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'assign',
    'signatures': [
      [
        '...nodes'
      ]
    ]
  },
  {
    'name': 'insertRow',
    'signatures': [
      [
        '?index'
      ]
    ]
  },
  {
    'name': 'deleteRow',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'insertCell',
    'signatures': [
      [
        '?index'
      ]
    ]
  },
  {
    'name': 'deleteCell',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'Audio',
    'signatures': [
      [
        '?src'
      ]
    ]
  },
  {
    'name': 'activate',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'end',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'getTrackById',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'AudioTrackList'
  },
  {
    'name': 'getTrackById',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'TextTrackList'
  },
  {
    'name': 'getTrackById',
    'signatures': [
      [
        'id'
      ]
    ],
    'receiver': 'VideoTrackList'
  },
  {
    'name': 'getTrackById',
    'signatures': [
      [
        'trackId'
      ]
    ],
    'receiver': 'MediaStream'
  },
  {
    'name': 'getCueById',
    'signatures': [
      [
        'id'
      ]
    ]
  },
  {
    'name': 'addCue',
    'signatures': [
      [
        'cue'
      ]
    ]
  },
  {
    'name': 'removeCue',
    'signatures': [
      [
        'cue'
      ]
    ]
  },
  {
    'name': 'copyText',
    'signatures': [
      [
        'text'
      ]
    ]
  },
  {
    'name': 'showContextMenuAtPoint',
    'signatures': [
      [
        'x',
        'y',
        'items',
        '?document'
      ]
    ]
  },
  {
    'name': 'sendMessageToEmbedder',
    'signatures': [
      [
        'message'
      ]
    ]
  },
  {
    'name': 'send',
    'signatures': [
      [
        'command'
      ]
    ],
    'receiver': 'InspectorOverlayHost'
  },
  {
    'name': 'send',
    'signatures': [
      [
        '?body'
      ]
    ],
    'receiver': 'XMLHttpRequest'
  },
  {
    'name': 'send',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'RTCDataChannel'
  },
  {
    'name': 'send',
    'signatures': [
      [
        'message'
      ],
      [
        'data'
      ]
    ],
    'receiver': 'PresentationConnection'
  },
  {
    'name': 'send',
    'signatures': [
      [
        'data',
        '?timestamp'
      ]
    ],
    'receiver': 'MIDIOutput'
  },
  {
    'name': 'send',
    'signatures': [
      [
        'data'
      ]
    ],
    'receiver': 'WebSocket'
  },
  {
    'name': 'unobserve',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'layoutNextFragment',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'registerLayout',
    'signatures': [
      [
        'name',
        'layoutCtor'
      ]
    ]
  },
  {
    'name': 'update',
    'signatures': [
      [
        'response'
      ]
    ],
    'receiver': 'MediaKeySession'
  },
  {
    'name': 'watch',
    'signatures': [
      [
        'signals',
        'callback'
      ]
    ]
  },
  {
    'name': 'writeMessage',
    'signatures': [
      [
        'buffer',
        'handles'
      ]
    ]
  },
  {
    'name': 'readMessage',
    'signatures': [
      [
        '?flags'
      ]
    ]
  },
  {
    'name': 'writeData',
    'signatures': [
      [
        'buffer',
        '?options'
      ]
    ]
  },
  {
    'name': 'discardData',
    'signatures': [
      [
        'numBytes',
        '?options'
      ]
    ]
  },
  {
    'name': 'readData',
    'signatures': [
      [
        'buffer',
        '?options'
      ]
    ]
  },
  {
    'name': 'mapBuffer',
    'signatures': [
      [
        'offset',
        'numBytes'
      ]
    ]
  },
  {
    'name': 'duplicateBufferHandle',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'createDataPipe',
    'signatures': [
      [
        'options'
      ]
    ]
  },
  {
    'name': 'createSharedBuffer',
    'signatures': [
      [
        'numBytes'
      ]
    ]
  },
  {
    'name': 'bindInterface',
    'signatures': [
      [
        'interfaceName',
        'request_handle',
        '?scope'
      ]
    ]
  },
  {
    'name': 'setValueAndClosePopup',
    'signatures': [
      [
        'numberValue',
        'stringValue'
      ]
    ]
  },
  {
    'name': 'setValue',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'localizeNumberString',
    'signatures': [
      [
        'numberString'
      ]
    ]
  },
  {
    'name': 'formatMonth',
    'signatures': [
      [
        'year',
        'zeroBaseMonth'
      ]
    ]
  },
  {
    'name': 'formatShortMonth',
    'signatures': [
      [
        'year',
        'zeroBaseMonth'
      ]
    ]
  },
  {
    'name': 'formatWeek',
    'signatures': [
      [
        'year',
        'weekNumber',
        'localizedStartDate'
      ]
    ]
  },
  {
    'name': 'setWindowRect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'consumeDelta',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'allowsFeature',
    'signatures': [
      [
        'feature',
        '?origin'
      ]
    ]
  },
  {
    'name': 'getAllowlistForFeature',
    'signatures': [
      [
        'feature'
      ]
    ]
  },
  {
    'name': 'enqueue',
    'signatures': [
      [
        'chunk'
      ]
    ],
    'receiver': 'ReadableByteStreamController'
  },
  {
    'name': 'enqueue',
    'signatures': [
      [
        '?chunk'
      ]
    ],
    'receiver': 'ReadableStreamDefaultController'
  },
  {
    'name': 'enqueue',
    'signatures': [
      [
        '?chunk'
      ]
    ],
    'receiver': 'TransformStreamDefaultController'
  },
  {
    'name': 'read',
    'signatures': [
      [
        'view'
      ]
    ],
    'receiver': 'ReadableStreamBYOBReader'
  },
  {
    'name': 'read',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'Clipboard'
  },
  {
    'name': 'read',
    'signatures': [
      [
        'buffer',
        'file_offset'
      ]
    ],
    'receiver': 'NativeIOFileSync'
  },
  {
    'name': 'read',
    'signatures': [
      [
        'buffer',
        'file_offset'
      ]
    ],
    'receiver': 'NativeIOFile'
  },
  {
    'name': 'respond',
    'signatures': [
      [
        'bytesWritten'
      ]
    ]
  },
  {
    'name': 'respondWithNewView',
    'signatures': [
      [
        'view'
      ]
    ]
  },
  {
    'name': 'getReader',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'pipeThrough',
    'signatures': [
      [
        'transform',
        '?options'
      ]
    ]
  },
  {
    'name': 'pipeTo',
    'signatures': [
      [
        'destination',
        '?options'
      ]
    ]
  },
  {
    'name': 'newValueSpecifiedUnits',
    'signatures': [
      [
        'unitType',
        'valueInSpecifiedUnits'
      ]
    ]
  },
  {
    'name': 'convertToSpecifiedUnits',
    'signatures': [
      [
        'unitType'
      ]
    ]
  },
  {
    'name': 'beginElementAt',
    'signatures': [
      [
        'offset'
      ]
    ]
  },
  {
    'name': 'endElementAt',
    'signatures': [
      [
        'offset'
      ]
    ]
  },
  {
    'name': 'setStdDeviation',
    'signatures': [
      [
        'stdDeviationX',
        'stdDeviationY'
      ]
    ]
  },
  {
    'name': 'isPointInFill',
    'signatures': [
      [
        'point'
      ]
    ]
  },
  {
    'name': 'isPointInStroke',
    'signatures': [
      [
        'point'
      ]
    ],
    'receiver': 'SVGGeometryElement'
  },
  {
    'name': 'isPointInStroke',
    'signatures': [
      [
        'x',
        'y'
      ],
      [
        'path',
        'x',
        'y'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'isPointInStroke',
    'signatures': [
      [
        'x',
        'y'
      ],
      [
        'path',
        'x',
        'y'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'isPointInStroke',
    'signatures': [
      [
        'x',
        'y'
      ],
      [
        'path',
        'x',
        'y'
      ]
    ],
    'receiver': 'PaintRenderingContext2D'
  },
  {
    'name': 'getPointAtLength',
    'signatures': [
      [
        'distance'
      ]
    ]
  },
  {
    'name': 'initialize',
    'signatures': [
      [
        'newItem'
      ]
    ]
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGLengthList'
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGNumberList'
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGPointList'
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGStringList'
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGTransformList'
  },
  {
    'name': 'getItem',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'Storage'
  },
  {
    'name': 'insertItemBefore',
    'signatures': [
      [
        'newItem',
        'index'
      ]
    ],
    'receiver': 'SVGLengthList'
  },
  {
    'name': 'insertItemBefore',
    'signatures': [
      [
        'newItem',
        'index'
      ]
    ],
    'receiver': 'SVGNumberList'
  },
  {
    'name': 'insertItemBefore',
    'signatures': [
      [
        'newItem',
        'index'
      ]
    ],
    'receiver': 'SVGPointList'
  },
  {
    'name': 'insertItemBefore',
    'signatures': [
      [
        'item',
        'index'
      ]
    ],
    'receiver': 'SVGStringList'
  },
  {
    'name': 'insertItemBefore',
    'signatures': [
      [
        'newItem',
        'index'
      ]
    ],
    'receiver': 'SVGTransformList'
  },
  {
    'name': 'replaceItem',
    'signatures': [
      [
        'newItem',
        'index'
      ]
    ]
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGLengthList'
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGNumberList'
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGPointList'
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGStringList'
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'index'
      ]
    ],
    'receiver': 'SVGTransformList'
  },
  {
    'name': 'removeItem',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'Storage'
  },
  {
    'name': 'appendItem',
    'signatures': [
      [
        'newItem'
      ]
    ]
  },
  {
    'name': 'setOrientToAngle',
    'signatures': [
      [
        'angle'
      ]
    ]
  },
  {
    'name': 'getIntersectionList',
    'signatures': [
      [
        'rect',
        'referenceElement'
      ]
    ]
  },
  {
    'name': 'getEnclosureList',
    'signatures': [
      [
        'rect',
        'referenceElement'
      ]
    ]
  },
  {
    'name': 'checkIntersection',
    'signatures': [
      [
        'element',
        'rect'
      ]
    ]
  },
  {
    'name': 'checkEnclosure',
    'signatures': [
      [
        'element',
        'rect'
      ]
    ]
  },
  {
    'name': 'createSVGTransformFromMatrix',
    'signatures': [
      [
        'matrix'
      ]
    ]
  },
  {
    'name': 'suspendRedraw',
    'signatures': [
      [
        'maxWaitMilliseconds'
      ]
    ]
  },
  {
    'name': 'unsuspendRedraw',
    'signatures': [
      [
        'suspendHandleId'
      ]
    ]
  },
  {
    'name': 'setCurrentTime',
    'signatures': [
      [
        'seconds'
      ]
    ]
  },
  {
    'name': 'getSubStringLength',
    'signatures': [
      [
        'charnum',
        'nchars'
      ]
    ]
  },
  {
    'name': 'getStartPositionOfChar',
    'signatures': [
      [
        'charnum'
      ]
    ]
  },
  {
    'name': 'getEndPositionOfChar',
    'signatures': [
      [
        'charnum'
      ]
    ]
  },
  {
    'name': 'getExtentOfChar',
    'signatures': [
      [
        'charnum'
      ]
    ]
  },
  {
    'name': 'getRotationOfChar',
    'signatures': [
      [
        'charnum'
      ]
    ]
  },
  {
    'name': 'getCharNumAtPosition',
    'signatures': [
      [
        'point'
      ]
    ]
  },
  {
    'name': 'selectSubString',
    'signatures': [
      [
        'charnum',
        'nchars'
      ]
    ]
  },
  {
    'name': 'setMatrix',
    'signatures': [
      [
        'matrix'
      ]
    ]
  },
  {
    'name': 'setTranslate',
    'signatures': [
      [
        'tx',
        'ty'
      ]
    ]
  },
  {
    'name': 'setScale',
    'signatures': [
      [
        'sx',
        'sy'
      ]
    ]
  },
  {
    'name': 'setRotate',
    'signatures': [
      [
        'angle',
        'cx',
        'cy'
      ]
    ]
  },
  {
    'name': 'setSkewX',
    'signatures': [
      [
        'angle'
      ]
    ]
  },
  {
    'name': 'setSkewY',
    'signatures': [
      [
        'angle'
      ]
    ]
  },
  {
    'name': 'getEntriesByType',
    'signatures': [
      [
        'entryType'
      ]
    ]
  },
  {
    'name': 'getEntriesByName',
    'signatures': [
      [
        'name',
        '?entryType'
      ]
    ]
  },
  {
    'name': 'setResourceTimingBufferSize',
    'signatures': [
      [
        'maxSize'
      ]
    ]
  },
  {
    'name': 'mark',
    'signatures': [
      [
        'markName',
        '?markOptions'
      ]
    ]
  },
  {
    'name': 'clearMarks',
    'signatures': [
      [
        '?markName'
      ]
    ]
  },
  {
    'name': 'measure',
    'signatures': [
      [
        'measureName',
        '?startOrMeasureOptions',
        '?endMark'
      ]
    ]
  },
  {
    'name': 'clearMeasures',
    'signatures': [
      [
        '?measureName'
      ]
    ]
  },
  {
    'name': 'createPolicy',
    'signatures': [
      [
        'policyName',
        '?policyOptions'
      ]
    ]
  },
  {
    'name': 'isHTML',
    'signatures': [
      [
        'checkedObject'
      ]
    ]
  },
  {
    'name': 'isScript',
    'signatures': [
      [
        'checkedObject'
      ]
    ]
  },
  {
    'name': 'isScriptURL',
    'signatures': [
      [
        'checkedObject'
      ]
    ]
  },
  {
    'name': 'getAttributeType',
    'signatures': [
      [
        'tagName',
        'attribute',
        '?elementNS',
        '?attrNs'
      ]
    ]
  },
  {
    'name': 'getPropertyType',
    'signatures': [
      [
        'tagName',
        'property',
        '?elementNS'
      ]
    ]
  },
  {
    'name': 'getTypeMapping',
    'signatures': [
      [
        '?ns'
      ]
    ]
  },
  {
    'name': 'createHTML',
    'signatures': [
      [
        'input',
        '...args'
      ]
    ]
  },
  {
    'name': 'createScript',
    'signatures': [
      [
        'input',
        '...args'
      ]
    ]
  },
  {
    'name': 'createScriptURL',
    'signatures': [
      [
        'input',
        '...args'
      ]
    ]
  },
  {
    'name': 'importScripts',
    'signatures': [
      [
        '...urls'
      ]
    ]
  },
  {
    'name': 'addModule',
    'signatures': [
      [
        'moduleURL',
        '?options'
      ]
    ]
  },
  {
    'name': 'createExpression',
    'signatures': [
      [
        'expression',
        '?resolver'
      ]
    ]
  },
  {
    'name': 'createNSResolver',
    'signatures': [
      [
        'nodeResolver'
      ]
    ]
  },
  {
    'name': 'evaluate',
    'signatures': [
      [
        'expression',
        'contextNode',
        '?resolver',
        '?type',
        '?inResult'
      ]
    ],
    'receiver': 'Document'
  },
  {
    'name': 'evaluate',
    'signatures': [
      [
        'expression',
        'contextNode',
        '?resolver',
        '?type',
        '?inResult'
      ]
    ],
    'receiver': 'XPathEvaluator'
  },
  {
    'name': 'evaluate',
    'signatures': [
      [
        'contextNode',
        '?type',
        '?inResult'
      ]
    ],
    'receiver': 'XPathExpression'
  },
  {
    'name': 'parseFromString',
    'signatures': [
      [
        'str',
        'type',
        '?options'
      ]
    ]
  },
  {
    'name': 'serializeToString',
    'signatures': [
      [
        'root'
      ]
    ]
  },
  {
    'name': 'snapshotItem',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'importStylesheet',
    'signatures': [
      [
        'style'
      ]
    ]
  },
  {
    'name': 'transformToFragment',
    'signatures': [
      [
        'source',
        'output'
      ]
    ]
  },
  {
    'name': 'transformToDocument',
    'signatures': [
      [
        'source'
      ]
    ]
  },
  {
    'name': 'setParameter',
    'signatures': [
      [
        'namespaceURI',
        'localName',
        'value'
      ]
    ]
  },
  {
    'name': 'getParameter',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ],
    'receiver': 'XSLTProcessor'
  },
  {
    'name': 'getParameter',
    'signatures': [
      [
        'pname'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'removeParameter',
    'signatures': [
      [
        'namespaceURI',
        'localName'
      ]
    ]
  },
  {
    'name': 'setRequestHeader',
    'signatures': [
      [
        'name',
        'value'
      ]
    ]
  },
  {
    'name': 'setTrustToken',
    'signatures': [
      [
        'trustToken'
      ]
    ]
  },
  {
    'name': 'getResponseHeader',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'overrideMimeType',
    'signatures': [
      [
        'mime'
      ]
    ]
  },
  {
    'name': 'joinAdInterestGroup',
    'signatures': [
      [
        'group',
        'durationSeconds'
      ]
    ]
  },
  {
    'name': 'leaveAdInterestGroup',
    'signatures': [
      [
        'group'
      ]
    ]
  },
  {
    'name': 'runAdAuction',
    'signatures': [
      [
        'config'
      ]
    ]
  },
  {
    'name': 'registerAnimator',
    'signatures': [
      [
        'name',
        'animatorCtor'
      ]
    ]
  },
  {
    'name': 'setSinkId',
    'signatures': [
      [
        'sinkId'
      ]
    ]
  },
  {
    'name': 'match',
    'signatures': [
      [
        'request',
        '?options'
      ]
    ]
  },
  {
    'name': 'matchAll',
    'signatures': [
      [
        '?request',
        '?options'
      ]
    ],
    'receiver': 'BackgroundFetchRegistration'
  },
  {
    'name': 'matchAll',
    'signatures': [
      [
        '?request',
        '?options'
      ]
    ],
    'receiver': 'Cache'
  },
  {
    'name': 'matchAll',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'Clients'
  },
  {
    'name': 'updateUI',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'register',
    'signatures': [
      [
        'tag',
        '?options'
      ]
    ],
    'receiver': 'PeriodicSyncManager'
  },
  {
    'name': 'register',
    'signatures': [
      [
        'tag'
      ]
    ],
    'receiver': 'SyncManager'
  },
  {
    'name': 'register',
    'signatures': [
      [
        'url',
        '?options'
      ]
    ],
    'receiver': 'ServiceWorkerContainer'
  },
  {
    'name': 'unregister',
    'signatures': [
      [
        'tag'
      ]
    ],
    'receiver': 'PeriodicSyncManager'
  },
  {
    'name': 'setAppBadge',
    'signatures': [
      [
        '?contents'
      ]
    ]
  },
  {
    'name': 'sendBeacon',
    'signatures': [
      [
        'url',
        '?data'
      ]
    ]
  },
  {
    'name': 'watchAdvertisements',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'getDescriptor',
    'signatures': [
      [
        'descriptor'
      ]
    ],
    'receiver': 'BluetoothRemoteGATTCharacteristic'
  },
  {
    'name': 'getDescriptor',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'BluetoothUUID'
  },
  {
    'name': 'getDescriptors',
    'signatures': [
      [
        '?descriptor'
      ]
    ]
  },
  {
    'name': 'writeValue',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'writeValueWithResponse',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'writeValueWithoutResponse',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'connect',
    'signatures': [
      [
        'destination',
        '?output',
        '?input'
      ]
    ],
    'receiver': 'AudioNode'
  },
  {
    'name': 'getPrimaryService',
    'signatures': [
      [
        'service'
      ]
    ]
  },
  {
    'name': 'getPrimaryServices',
    'signatures': [
      [
        '?service'
      ]
    ]
  },
  {
    'name': 'getCharacteristic',
    'signatures': [
      [
        'characteristic'
      ]
    ],
    'receiver': 'BluetoothRemoteGATTService'
  },
  {
    'name': 'getCharacteristic',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'BluetoothUUID'
  },
  {
    'name': 'getCharacteristics',
    'signatures': [
      [
        '?characteristic'
      ]
    ]
  },
  {
    'name': 'getService',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'canonicalUUID',
    'signatures': [
      [
        'alias'
      ]
    ]
  },
  {
    'name': 'requestDevice',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'Bluetooth'
  },
  {
    'name': 'requestDevice',
    'signatures': [
      [
        'options'
      ]
    ],
    'receiver': 'HID'
  },
  {
    'name': 'requestDevice',
    'signatures': [
      [
        '?descriptor'
      ]
    ],
    'receiver': 'GPUAdapter'
  },
  {
    'name': 'requestDevice',
    'signatures': [
      [
        'options'
      ]
    ],
    'receiver': 'USB'
  },
  {
    'name': 'requestLEScan',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'keys',
    'signatures': [
      [
        '?request',
        '?options'
      ]
    ],
    'receiver': 'Cache'
  },
  {
    'name': 'setExpires',
    'signatures': [
      [
        'expires'
      ]
    ]
  },
  {
    'name': 'addAll',
    'signatures': [
      [
        'requests'
      ]
    ]
  },
  {
    'name': 'put',
    'signatures': [
      [
        'request',
        'response'
      ]
    ],
    'receiver': 'Cache'
  },
  {
    'name': 'put',
    'signatures': [
      [
        'value',
        '?key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'getRun',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'appendRun',
    'signatures': [
      [
        'newRun'
      ]
    ]
  },
  {
    'name': 'setRun',
    'signatures': [
      [
        'index',
        'run'
      ]
    ]
  },
  {
    'name': 'insertRun',
    'signatures': [
      [
        'index',
        'run'
      ]
    ]
  },
  {
    'name': 'deleteRun',
    'signatures': [
      [
        'index',
        '?length'
      ]
    ]
  },
  {
    'name': 'addColorStop',
    'signatures': [
      [
        'offset',
        'color'
      ]
    ]
  },
  {
    'name': 'lineTo',
    'signatures': [
      [
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'quadraticCurveTo',
    'signatures': [
      [
        'cpx',
        'cpy',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'bezierCurveTo',
    'signatures': [
      [
        'cp1x',
        'cp1y',
        'cp2x',
        'cp2y',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'arcTo',
    'signatures': [
      [
        'x1',
        'y1',
        'x2',
        'y2',
        'radius'
      ]
    ]
  },
  {
    'name': 'rect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'roundRect',
    'signatures': [
      [
        'x',
        'y',
        'w',
        'h',
        'radii'
      ]
    ]
  },
  {
    'name': 'arc',
    'signatures': [
      [
        'x',
        'y',
        'radius',
        'startAngle',
        'endAngle',
        '?anticlockwise'
      ]
    ]
  },
  {
    'name': 'ellipse',
    'signatures': [
      [
        'x',
        'y',
        'radiusX',
        'radiusY',
        'rotation',
        'startAngle',
        'endAngle',
        '?anticlockwise'
      ]
    ]
  },
  {
    'name': 'setTransform',
    'signatures': [
      [
        '?transform'
      ]
    ],
    'receiver': 'CanvasPattern'
  },
  {
    'name': 'setTransform',
    'signatures': [
      [
        '?transform'
      ],
      [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'setTransform',
    'signatures': [
      [
        '?transform'
      ],
      [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'setTransform',
    'signatures': [
      [
        '?transform'
      ],
      [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
      ]
    ],
    'receiver': 'PaintRenderingContext2D'
  },
  {
    'name': 'rotate3d',
    'signatures': [
      [
        'angleX',
        'angleY',
        'angleZ'
      ]
    ]
  },
  {
    'name': 'rotateAxis',
    'signatures': [
      [
        'axisX',
        'axisY',
        'axisZ',
        'angle'
      ]
    ]
  },
  {
    'name': 'perspective',
    'signatures': [
      [
        'length'
      ]
    ]
  },
  {
    'name': 'transform',
    'signatures': [
      [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
      ],
      [
        'm11',
        'm12',
        'm13',
        'm14',
        'm21',
        'm22',
        'm23',
        'm24',
        'm31',
        'm32',
        'm33',
        'm34',
        'm41',
        'm42',
        'm43',
        'm44'
      ]
    ]
  },
  {
    'name': 'createLinearGradient',
    'signatures': [
      [
        'x0',
        'y0',
        'x1',
        'y1'
      ]
    ]
  },
  {
    'name': 'createRadialGradient',
    'signatures': [
      [
        'x0',
        'y0',
        'r0',
        'x1',
        'y1',
        'r1'
      ]
    ]
  },
  {
    'name': 'createConicGradient',
    'signatures': [
      [
        'startAngle',
        'cx',
        'cy'
      ]
    ],
    'receiver': 'CanvasRenderingContext2D'
  },
  {
    'name': 'createConicGradient',
    'signatures': [
      [
        'startAngle',
        'centerX',
        'centerY'
      ]
    ],
    'receiver': 'OffscreenCanvasRenderingContext2D'
  },
  {
    'name': 'createPattern',
    'signatures': [
      [
        'image',
        'repetitionType'
      ]
    ]
  },
  {
    'name': 'clearRect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'fillRect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'strokeRect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'fill',
    'signatures': [
      [
        '?winding'
      ],
      [
        'path',
        '?winding'
      ]
    ]
  },
  {
    'name': 'stroke',
    'signatures': [
      [
        '?path'
      ]
    ]
  },
  {
    'name': 'drawFocusIfNeeded',
    'signatures': [
      [
        'element'
      ],
      [
        'path',
        'element'
      ]
    ]
  },
  {
    'name': 'scrollPathIntoView',
    'signatures': [
      [
        '?path'
      ]
    ]
  },
  {
    'name': 'clip',
    'signatures': [
      [
        '?winding'
      ],
      [
        'path',
        '?winding'
      ]
    ]
  },
  {
    'name': 'isPointInPath',
    'signatures': [
      [
        'x',
        'y',
        '?winding'
      ],
      [
        'path',
        'x',
        'y',
        '?winding'
      ]
    ]
  },
  {
    'name': 'fillText',
    'signatures': [
      [
        'text',
        'x',
        'y',
        '?maxWidth'
      ]
    ]
  },
  {
    'name': 'strokeText',
    'signatures': [
      [
        'text',
        'x',
        'y',
        '?maxWidth'
      ]
    ]
  },
  {
    'name': 'measureText',
    'signatures': [
      [
        'text'
      ]
    ]
  },
  {
    'name': 'fillFormattedText',
    'signatures': [
      [
        'formattedText',
        'x',
        'y',
        'wrapWidth'
      ]
    ]
  },
  {
    'name': 'drawImage',
    'signatures': [
      [
        'image',
        'x',
        'y',
        '?width',
        '?height'
      ],
      [
        'image',
        'sx',
        'sy',
        'sw',
        'sh',
        'dx',
        'dy',
        'dw',
        'dh'
      ]
    ]
  },
  {
    'name': 'addHitRegion',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'removeHitRegion',
    'signatures': [
      [
        'id'
      ]
    ]
  },
  {
    'name': 'createImageData',
    'signatures': [
      [
        'imagedata'
      ],
      [
        'sw',
        'sh',
        '?imageDataSettings'
      ]
    ]
  },
  {
    'name': 'getImageData',
    'signatures': [
      [
        'sx',
        'sy',
        'sw',
        'sh',
        '?imageDataSettings'
      ]
    ]
  },
  {
    'name': 'putImageData',
    'signatures': [
      [
        'imagedata',
        'dx',
        'dy',
        '?dirtyX',
        '?dirtyY',
        '?dirtyWidth',
        '?dirtyHeight'
      ]
    ]
  },
  {
    'name': 'setLineDash',
    'signatures': [
      [
        'dash'
      ]
    ]
  },
  {
    'name': 'addPath',
    'signatures': [
      [
        'path',
        '?transform'
      ]
    ]
  },
  {
    'name': 'getContext',
    'signatures': [
      [
        'contextId',
        '?attributes'
      ]
    ],
    'receiver': 'HTMLCanvasElement'
  },
  {
    'name': 'getContext',
    'signatures': [
      [
        'contextType',
        '?attributes'
      ]
    ],
    'receiver': 'OffscreenCanvas'
  },
  {
    'name': 'transferFromImageBitmap',
    'signatures': [
      [
        'bitmap'
      ]
    ]
  },
  {
    'name': 'createImageBitmap',
    'signatures': [
      [
        'imageBitmap',
        '?options'
      ],
      [
        'imageBitmap',
        'sx',
        'sy',
        'sw',
        'sh',
        '?options'
      ]
    ]
  },
  {
    'name': 'writeText',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'subscribe',
    'signatures': [
      [
        'subscriptions'
      ]
    ]
  },
  {
    'name': 'unsubscribe',
    'signatures': [
      [
        'subscriptions'
      ]
    ],
    'receiver': 'CookieStoreManager'
  },
  {
    'name': 'store',
    'signatures': [
      [
        'credential'
      ]
    ]
  },
  {
    'name': 'getRandomValues',
    'signatures': [
      [
        'array'
      ]
    ]
  },
  {
    'name': 'encrypt',
    'signatures': [
      [
        'algorithm',
        'key',
        'data'
      ]
    ]
  },
  {
    'name': 'decrypt',
    'signatures': [
      [
        'algorithm',
        'key',
        'data'
      ]
    ]
  },
  {
    'name': 'sign',
    'signatures': [
      [
        'algorithm',
        'key',
        'data'
      ]
    ]
  },
  {
    'name': 'verify',
    'signatures': [
      [
        'algorithm',
        'key',
        'signature',
        'data'
      ]
    ]
  },
  {
    'name': 'digest',
    'signatures': [
      [
        'algorithm',
        'data'
      ]
    ]
  },
  {
    'name': 'generateKey',
    'signatures': [
      [
        'algorithm',
        'extractable',
        'keyUsages'
      ]
    ]
  },
  {
    'name': 'deriveKey',
    'signatures': [
      [
        'algorithm',
        'baseKey',
        'derivedKeyType',
        'extractable',
        'keyUsages'
      ]
    ]
  },
  {
    'name': 'deriveBits',
    'signatures': [
      [
        'algorithm',
        'baseKey',
        'length'
      ]
    ]
  },
  {
    'name': 'importKey',
    'signatures': [
      [
        'format',
        'keyData',
        'algorithm',
        'extractable',
        'keyUsages'
      ]
    ]
  },
  {
    'name': 'exportKey',
    'signatures': [
      [
        'format',
        'key'
      ]
    ]
  },
  {
    'name': 'wrapKey',
    'signatures': [
      [
        'format',
        'key',
        'wrappingKey',
        'wrapAlgorithm'
      ]
    ]
  },
  {
    'name': 'unwrapKey',
    'signatures': [
      [
        'format',
        'wrappedKey',
        'unwrappingKey',
        'unwrapAlgorithm',
        'unwrappedKeyAlgorithm',
        'extractable',
        'keyUsages'
      ]
    ]
  },
  {
    'name': 'registerPaint',
    'signatures': [
      [
        'name',
        'paintCtor'
      ]
    ]
  },
  {
    'name': 'updateInkTrailStartPoint',
    'signatures': [
      [
        'evt',
        'style'
      ]
    ]
  },
  {
    'name': 'requestPresenter',
    'signatures': [
      [
        'type',
        '?presentationArea'
      ]
    ]
  },
  {
    'name': 'openTCPSocket',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'openUDPSocket',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'encodeInto',
    'signatures': [
      [
        'source',
        'destination'
      ]
    ]
  },
  {
    'name': 'setMediaKeys',
    'signatures': [
      [
        'mediaKeys'
      ]
    ]
  },
  {
    'name': 'generateRequest',
    'signatures': [
      [
        'initDataType',
        'initData'
      ]
    ]
  },
  {
    'name': 'getStatusForPolicy',
    'signatures': [
      [
        'policy'
      ]
    ]
  },
  {
    'name': 'createSession',
    'signatures': [
      [
        '?sessionType'
      ]
    ]
  },
  {
    'name': 'setServerCertificate',
    'signatures': [
      [
        'serverCertificate'
      ]
    ]
  },
  {
    'name': 'requestMediaKeySystemAccess',
    'signatures': [
      [
        'keySystem',
        'supportedConfigurations'
      ]
    ]
  },
  {
    'name': 'getFileHandle',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ]
  },
  {
    'name': 'getDirectoryHandle',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ]
  },
  {
    'name': 'removeEntry',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ]
  },
  {
    'name': 'resolve',
    'signatures': [
      [
        'possibleChild'
      ]
    ]
  },
  {
    'name': 'createWritable',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'queryPermission',
    'signatures': [
      [
        '?descriptor'
      ]
    ]
  },
  {
    'name': 'requestPermission',
    'signatures': [
      [
        '?descriptor'
      ]
    ],
    'receiver': 'FileSystemHandle'
  },
  {
    'name': 'requestPermission',
    'signatures': [
      [
        '?deprecatedCallback'
      ]
    ],
    'receiver': 'Notification'
  },
  {
    'name': 'isSameEntry',
    'signatures': [
      [
        'other'
      ]
    ]
  },
  {
    'name': 'showOpenFilePicker',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'showSaveFilePicker',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'showDirectoryPicker',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'webkitResolveLocalFileSystemURL',
    'signatures': [
      [
        'url',
        'successCallback',
        '?errorCallback'
      ]
    ]
  },
  {
    'name': 'webkitResolveLocalFileSystemSyncURL',
    'signatures': [
      [
        'url'
      ]
    ]
  },
  {
    'name': 'isolatedFileSystem',
    'signatures': [
      [
        'fileSystemId',
        'registeredName'
      ]
    ]
  },
  {
    'name': 'upgradeDraggedFileSystemPermissions',
    'signatures': [
      [
        'domFileSystem'
      ]
    ]
  },
  {
    'name': 'query',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'FontManager'
  },
  {
    'name': 'query',
    'signatures': [
      [
        'permission'
      ]
    ],
    'receiver': 'Permissions'
  },
  {
    'name': 'playEffect',
    'signatures': [
      [
        'type',
        'params'
      ]
    ]
  },
  {
    'name': 'getCurrentPosition',
    'signatures': [
      [
        'successCallback',
        '?errorCallback',
        '?options'
      ]
    ]
  },
  {
    'name': 'watchPosition',
    'signatures': [
      [
        'successCallback',
        '?errorCallback',
        '?options'
      ]
    ]
  },
  {
    'name': 'clearWatch',
    'signatures': [
      [
        'watchID'
      ]
    ]
  },
  {
    'name': 'addStroke',
    'signatures': [
      [
        'stroke'
      ]
    ]
  },
  {
    'name': 'removeStroke',
    'signatures': [
      [
        'stroke'
      ]
    ]
  },
  {
    'name': 'startDrawing',
    'signatures': [
      [
        '?hints'
      ]
    ]
  },
  {
    'name': 'addPoint',
    'signatures': [
      [
        'point'
      ]
    ]
  },
  {
    'name': 'createHandwritingRecognizer',
    'signatures': [
      [
        'constraint'
      ]
    ]
  },
  {
    'name': 'queryHandwritingRecognizerSupport',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'sendReport',
    'signatures': [
      [
        'reportId',
        'data'
      ]
    ]
  },
  {
    'name': 'sendFeatureReport',
    'signatures': [
      [
        'reportId',
        'data'
      ]
    ]
  },
  {
    'name': 'receiveFeatureReport',
    'signatures': [
      [
        'reportId'
      ]
    ]
  },
  {
    'name': 'takePhoto',
    'signatures': [
      [
        '?photoSettings'
      ]
    ]
  },
  {
    'name': 'transaction',
    'signatures': [
      [
        'storeNames',
        '?mode',
        '?options'
      ]
    ],
    'receiver': 'IDBDatabase'
  },
  {
    'name': 'transaction',
    'signatures': [
      [
        'callback',
        '?errorCallback',
        '?successCallback'
      ]
    ],
    'receiver': 'Database'
  },
  {
    'name': 'createObjectStore',
    'signatures': [
      [
        'name',
        '?options'
      ]
    ]
  },
  {
    'name': 'deleteObjectStore',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'deleteDatabase',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'cmp',
    'signatures': [
      [
        'first',
        'second'
      ]
    ]
  },
  {
    'name': 'getKey',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'IDBIndex'
  },
  {
    'name': 'getKey',
    'signatures': [
      [
        'key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'getKey',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'PushSubscription'
  },
  {
    'name': 'getAllKeys',
    'signatures': [
      [
        '?query',
        '?count'
      ]
    ]
  },
  {
    'name': 'count',
    'signatures': [
      [
        '?key'
      ]
    ],
    'receiver': 'IDBIndex'
  },
  {
    'name': 'count',
    'signatures': [
      [
        '?key'
      ]
    ],
    'receiver': 'IDBObjectStore'
  },
  {
    'name': 'count',
    'signatures': [
      [
        '?label'
      ]
    ],
    'receiver': 'console'
  },
  {
    'name': 'openCursor',
    'signatures': [
      [
        '?range',
        '?direction'
      ]
    ]
  },
  {
    'name': 'openKeyCursor',
    'signatures': [
      [
        '?range',
        '?direction'
      ]
    ]
  },
  {
    'name': 'only',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'lowerBound',
    'signatures': [
      [
        'bound',
        '?open'
      ]
    ]
  },
  {
    'name': 'upperBound',
    'signatures': [
      [
        'bound',
        '?open'
      ]
    ]
  },
  {
    'name': 'bound',
    'signatures': [
      [
        'lower',
        'upper',
        '?lowerOpen',
        '?upperOpen'
      ]
    ]
  },
  {
    'name': 'includes',
    'signatures': [
      [
        'key'
      ]
    ]
  },
  {
    'name': 'putAllValues',
    'signatures': [
      [
        'values'
      ]
    ]
  },
  {
    'name': 'index',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'createIndex',
    'signatures': [
      [
        'name',
        'keyPath',
        '?options'
      ]
    ]
  },
  {
    'name': 'deleteIndex',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'objectStore',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'lock',
    'signatures': [
      [
        '?keyCodes'
      ]
    ],
    'receiver': 'Keyboard'
  },
  {
    'name': 'lock',
    'signatures': [
      [
        'orientation'
      ]
    ],
    'receiver': 'ScreenOrientation'
  },
  {
    'name': 'setConsumer',
    'signatures': [
      [
        'consumer'
      ]
    ]
  },
  {
    'name': 'decodingInfo',
    'signatures': [
      [
        'configuration'
      ]
    ]
  },
  {
    'name': 'encodingInfo',
    'signatures': [
      [
        'configuration'
      ]
    ]
  },
  {
    'name': 'captureStream',
    'signatures': [
      [
        '?frameRate'
      ]
    ],
    'receiver': 'HTMLCanvasElement'
  },
  {
    'name': 'isTypeSupported',
    'signatures': [
      [
        'type'
      ]
    ]
  },
  {
    'name': 'setActionHandler',
    'signatures': [
      [
        'action',
        'handler'
      ]
    ]
  },
  {
    'name': 'setPositionState',
    'signatures': [
      [
        '?state'
      ]
    ]
  },
  {
    'name': 'setMicrophoneActive',
    'signatures': [
      [
        'active'
      ]
    ]
  },
  {
    'name': 'setCameraActive',
    'signatures': [
      [
        'active'
      ]
    ]
  },
  {
    'name': 'addSourceBuffer',
    'signatures': [
      [
        'type'
      ],
      [
        'config'
      ]
    ]
  },
  {
    'name': 'removeSourceBuffer',
    'signatures': [
      [
        'buffer'
      ]
    ]
  },
  {
    'name': 'endOfStream',
    'signatures': [
      [
        '?error'
      ]
    ]
  },
  {
    'name': 'setLiveSeekableRange',
    'signatures': [
      [
        'start',
        'end'
      ]
    ]
  },
  {
    'name': 'appendBuffer',
    'signatures': [
      [
        'data'
      ]
    ]
  },
  {
    'name': 'appendEncodedChunks',
    'signatures': [
      [
        'chunks'
      ]
    ]
  },
  {
    'name': 'changeType',
    'signatures': [
      [
        'type'
      ],
      [
        'config'
      ]
    ]
  },
  {
    'name': 'getCapabilities',
    'signatures': [
      [
        'kind'
      ]
    ],
    'receiver': 'RTCRtpReceiver'
  },
  {
    'name': 'getCapabilities',
    'signatures': [
      [
        'kind'
      ]
    ],
    'receiver': 'RTCRtpSender'
  },
  {
    'name': 'getUserMedia',
    'signatures': [
      [
        '?constraints'
      ]
    ],
    'receiver': 'MediaDevices'
  },
  {
    'name': 'getUserMedia',
    'signatures': [
      [
        'constraints',
        'successCallback',
        'errorCallback'
      ]
    ],
    'receiver': 'Navigator'
  },
  {
    'name': 'getDisplayMedia',
    'signatures': [
      [
        '?constraints'
      ]
    ]
  },
  {
    'name': 'getCurrentBrowsingContextMedia',
    'signatures': [
      [
        '?constraints'
      ]
    ]
  },
  {
    'name': 'setCaptureHandleConfig',
    'signatures': [
      [
        '?config'
      ]
    ]
  },
  {
    'name': 'applyConstraints',
    'signatures': [
      [
        '?constraints'
      ]
    ]
  },
  {
    'name': 'addTrack',
    'signatures': [
      [
        'track'
      ]
    ],
    'receiver': 'MediaStream'
  },
  {
    'name': 'addTrack',
    'signatures': [
      [
        'track',
        '...streams'
      ]
    ],
    'receiver': 'RTCPeerConnection'
  },
  {
    'name': 'removeTrack',
    'signatures': [
      [
        'track'
      ]
    ],
    'receiver': 'MediaStream'
  },
  {
    'name': 'removeTrack',
    'signatures': [
      [
        'sender'
      ]
    ],
    'receiver': 'RTCPeerConnection'
  },
  {
    'name': 'webkitGetUserMedia',
    'signatures': [
      [
        'constraints',
        'successCallback',
        'errorCallback'
      ]
    ]
  },
  {
    'name': 'openSync',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'deleteSync',
    'signatures': [
      [
        'name'
      ]
    ],
    'receiver': 'NativeIOFileManager'
  },
  {
    'name': 'deleteSync',
    'signatures': [
      [
        'sync'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'rename',
    'signatures': [
      [
        'old_name',
        'new_name'
      ]
    ]
  },
  {
    'name': 'renameSync',
    'signatures': [
      [
        'old_name',
        'new_name'
      ]
    ]
  },
  {
    'name': 'requestCapacity',
    'signatures': [
      [
        'requested_capacity'
      ]
    ]
  },
  {
    'name': 'requestCapacitySync',
    'signatures': [
      [
        'released_capacity'
      ]
    ]
  },
  {
    'name': 'releaseCapacity',
    'signatures': [
      [
        'released_capacity'
      ]
    ]
  },
  {
    'name': 'releaseCapacitySync',
    'signatures': [
      [
        'released_capacity'
      ]
    ]
  },
  {
    'name': 'setLength',
    'signatures': [
      [
        'length'
      ]
    ]
  },
  {
    'name': 'registerProtocolHandler',
    'signatures': [
      [
        'scheme',
        'url'
      ]
    ]
  },
  {
    'name': 'unregisterProtocolHandler',
    'signatures': [
      [
        'scheme',
        'url'
      ]
    ]
  },
  {
    'name': 'scan',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'showNotification',
    'signatures': [
      [
        'title',
        '?options'
      ]
    ]
  },
  {
    'name': 'getNotifications',
    'signatures': [
      [
        '?filter'
      ]
    ]
  },
  {
    'name': 'respondWithMinimalUI',
    'signatures': [
      [
        'response'
      ]
    ]
  },
  {
    'name': 'getDetails',
    'signatures': [
      [
        'itemIds'
      ]
    ]
  },
  {
    'name': 'acknowledge',
    'signatures': [
      [
        'purchaseToken',
        'purchaseType'
      ]
    ]
  },
  {
    'name': 'getDigitalGoodsService',
    'signatures': [
      [
        'paymentMethod'
      ]
    ]
  },
  {
    'name': 'complete',
    'signatures': [
      [
        'merchantSessionPromise'
      ]
    ],
    'receiver': 'MerchantValidationEvent'
  },
  {
    'name': 'complete',
    'signatures': [
      [
        '?paymentResult'
      ]
    ],
    'receiver': 'PaymentResponse'
  },
  {
    'name': 'enableDelegations',
    'signatures': [
      [
        'delegations'
      ]
    ]
  },
  {
    'name': 'openWindow',
    'signatures': [
      [
        'url'
      ]
    ]
  },
  {
    'name': 'changePaymentMethod',
    'signatures': [
      [
        'methodName',
        '?methodDetails'
      ]
    ]
  },
  {
    'name': 'changeShippingAddress',
    'signatures': [
      [
        'shippingAddress'
      ]
    ]
  },
  {
    'name': 'changeShippingOption',
    'signatures': [
      [
        'shippingOption'
      ]
    ]
  },
  {
    'name': 'updateWith',
    'signatures': [
      [
        'detailsPromise'
      ]
    ]
  },
  {
    'name': 'retry',
    'signatures': [
      [
        '?errorFields'
      ]
    ]
  },
  {
    'name': 'insertDTMF',
    'signatures': [
      [
        'tones',
        '?duration',
        '?interToneGap'
      ]
    ]
  },
  {
    'name': 'gather',
    'signatures': [
      [
        'options'
      ]
    ]
  },
  {
    'name': 'addRemoteCandidate',
    'signatures': [
      [
        'remoteCandidate'
      ]
    ]
  },
  {
    'name': 'stat',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'createOffer',
    'signatures': [
      [
        '?options'
      ],
      [
        'successCallback',
        'failureCallback',
        '?rtcOfferOptions'
      ]
    ]
  },
  {
    'name': 'createAnswer',
    'signatures': [
      [
        '?options'
      ],
      [
        'successCallback',
        'failureCallback',
        '?mediaConstraints'
      ]
    ]
  },
  {
    'name': 'setLocalDescription',
    'signatures': [
      [
        '?description',
        '?successCallback',
        '?failureCallback'
      ]
    ]
  },
  {
    'name': 'setRemoteDescription',
    'signatures': [
      [
        'description',
        '?successCallback',
        '?failureCallback'
      ]
    ]
  },
  {
    'name': 'addIceCandidate',
    'signatures': [
      [
        '?candidate',
        '?successCallback',
        '?failureCallback'
      ]
    ]
  },
  {
    'name': 'setConfiguration',
    'signatures': [
      [
        'configuration'
      ]
    ]
  },
  {
    'name': 'getStats',
    'signatures': [
      [
        '?callbackOrSelector',
        '?legacySelector'
      ]
    ],
    'receiver': 'RTCPeerConnection'
  },
  {
    'name': 'addTransceiver',
    'signatures': [
      [
        'trackOrKind',
        '?init'
      ]
    ]
  },
  {
    'name': 'createDataChannel',
    'signatures': [
      [
        'label',
        '?dataChannelDict'
      ]
    ]
  },
  {
    'name': 'generateCertificate',
    'signatures': [
      [
        'keygenAlgorithm'
      ]
    ]
  },
  {
    'name': 'addStream',
    'signatures': [
      [
        'stream',
        '?mediaConstraints'
      ]
    ]
  },
  {
    'name': 'removeStream',
    'signatures': [
      [
        'stream'
      ]
    ]
  },
  {
    'name': 'createDTMFSender',
    'signatures': [
      [
        'track'
      ]
    ]
  },
  {
    'name': 'setParameters',
    'signatures': [
      [
        'parameters'
      ]
    ]
  },
  {
    'name': 'replaceTrack',
    'signatures': [
      [
        'withTrack'
      ]
    ]
  },
  {
    'name': 'setStreams',
    'signatures': [
      [
        '...streams'
      ]
    ]
  },
  {
    'name': 'setCodecPreferences',
    'signatures': [
      [
        'codecs'
      ]
    ]
  },
  {
    'name': 'setOfferedRtpHeaderExtensions',
    'signatures': [
      [
        'headerExtensionsToOffer'
      ]
    ]
  },
  {
    'name': 'revoke',
    'signatures': [
      [
        'permission'
      ]
    ]
  },
  {
    'name': 'requestAll',
    'signatures': [
      [
        'permissions'
      ]
    ]
  },
  {
    'name': 'requestPictureInPicture',
    'signatures': [
      [
        '?options'
      ]
    ],
    'receiver': 'HTMLElement'
  },
  {
    'name': 'refresh',
    'signatures': [
      [
        '?reload'
      ]
    ]
  },
  {
    'name': 'reconnect',
    'signatures': [
      [
        'id'
      ]
    ]
  },
  {
    'name': 'queryUsageAndQuota',
    'signatures': [
      [
        'storageType',
        '?usageCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DeprecatedStorageInfo'
  },
  {
    'name': 'queryUsageAndQuota',
    'signatures': [
      [
        'usageCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DeprecatedStorageQuota'
  },
  {
    'name': 'requestQuota',
    'signatures': [
      [
        'storageType',
        'newQuotaInBytes',
        '?quotaCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DeprecatedStorageInfo'
  },
  {
    'name': 'requestQuota',
    'signatures': [
      [
        'newQuotaInBytes',
        '?quotaCallback',
        '?errorCallback'
      ]
    ],
    'receiver': 'DeprecatedStorageQuota'
  },
  {
    'name': 'watchAvailability',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'cancelWatchAvailability',
    'signatures': [
      [
        '?id'
      ]
    ]
  },
  {
    'name': 'SetSanitizedHTML',
    'signatures': [
      [
        'markup',
        'sanitizer'
      ]
    ]
  },
  {
    'name': 'sanitize',
    'signatures': [
      [
        'input'
      ]
    ]
  },
  {
    'name': 'sanitizeToString',
    'signatures': [
      [
        'input'
      ]
    ]
  },
  {
    'name': 'sanitizeFor',
    'signatures': [
      [
        'element',
        'markup'
      ]
    ]
  },
  {
    'name': 'postTask',
    'signatures': [
      [
        'callback',
        '?options'
      ]
    ]
  },
  {
    'name': 'setPriority',
    'signatures': [
      [
        'priority'
      ]
    ]
  },
  {
    'name': 'populateMatrix',
    'signatures': [
      [
        'targetBuffer'
      ]
    ]
  },
  {
    'name': 'requestPort',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'waitUntil',
    'signatures': [
      [
        'f'
      ]
    ]
  },
  {
    'name': 'addPerformanceEntry',
    'signatures': [
      [
        'entry'
      ]
    ]
  },
  {
    'name': 'enable',
    'signatures': [
      [
        'cap'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'disable',
    'signatures': [
      [
        'cap'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'setHeaderValue',
    'signatures': [
      [
        'value'
      ]
    ]
  },
  {
    'name': 'getRegistration',
    'signatures': [
      [
        '?documentURL'
      ]
    ]
  },
  {
    'name': 'detect',
    'signatures': [
      [
        'image'
      ]
    ]
  },
  {
    'name': 'addFromUri',
    'signatures': [
      [
        'src',
        '?weight'
      ]
    ]
  },
  {
    'name': 'addFromString',
    'signatures': [
      [
        'string',
        '?weight'
      ]
    ]
  },
  {
    'name': 'speak',
    'signatures': [
      [
        'utterance'
      ]
    ]
  },
  {
    'name': 'initStorageEvent',
    'signatures': [
      [
        'type',
        '?bubbles',
        '?cancelable',
        '?key',
        '?oldValue',
        '?newValue',
        '?url',
        '?storageArea'
      ]
    ]
  },
  {
    'name': 'key',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'setItem',
    'signatures': [
      [
        'key',
        'value'
      ]
    ]
  },
  {
    'name': 'test',
    'signatures': [
      [
        'input',
        '?baseURL'
      ]
    ]
  },
  {
    'name': 'exec',
    'signatures': [
      [
        'input',
        '?baseURL'
      ]
    ]
  },
  {
    'name': 'vibrate',
    'signatures': [
      [
        'pattern'
      ]
    ]
  },
  {
    'name': 'requestVideoFrameCallback',
    'signatures': [
      [
        'callback'
      ]
    ]
  },
  {
    'name': 'cancelVideoFrameCallback',
    'signatures': [
      [
        'handle'
      ]
    ]
  },
  {
    'name': 'getFloatFrequencyData',
    'signatures': [
      [
        'array'
      ]
    ]
  },
  {
    'name': 'getByteFrequencyData',
    'signatures': [
      [
        'array'
      ]
    ]
  },
  {
    'name': 'getFloatTimeDomainData',
    'signatures': [
      [
        'array'
      ]
    ]
  },
  {
    'name': 'getByteTimeDomainData',
    'signatures': [
      [
        'array'
      ]
    ]
  },
  {
    'name': 'getChannelData',
    'signatures': [
      [
        'channelIndex'
      ]
    ]
  },
  {
    'name': 'copyFromChannel',
    'signatures': [
      [
        'destination',
        'channelNumber',
        '?bufferOffset'
      ]
    ]
  },
  {
    'name': 'copyToChannel',
    'signatures': [
      [
        'source',
        'channelNumber',
        '?bufferOffset'
      ]
    ]
  },
  {
    'name': 'suspend',
    'signatures': [
      [
        'suspendTime'
      ]
    ],
    'receiver': 'OfflineAudioContext'
  },
  {
    'name': 'createMediaElementSource',
    'signatures': [
      [
        'mediaElement'
      ]
    ]
  },
  {
    'name': 'createMediaStreamSource',
    'signatures': [
      [
        'mediaStream'
      ]
    ]
  },
  {
    'name': 'setOrientation',
    'signatures': [
      [
        'x',
        'y',
        'z',
        'xUp',
        'yUp',
        'zUp'
      ]
    ],
    'receiver': 'AudioListener'
  },
  {
    'name': 'setOrientation',
    'signatures': [
      [
        'x',
        'y',
        'z'
      ]
    ],
    'receiver': 'PannerNode'
  },
  {
    'name': 'setValueAtTime',
    'signatures': [
      [
        'value',
        'time'
      ]
    ]
  },
  {
    'name': 'linearRampToValueAtTime',
    'signatures': [
      [
        'value',
        'time'
      ]
    ]
  },
  {
    'name': 'exponentialRampToValueAtTime',
    'signatures': [
      [
        'value',
        'time'
      ]
    ]
  },
  {
    'name': 'setTargetAtTime',
    'signatures': [
      [
        'target',
        'time',
        'timeConstant'
      ]
    ]
  },
  {
    'name': 'setValueCurveAtTime',
    'signatures': [
      [
        'values',
        'time',
        'duration'
      ]
    ]
  },
  {
    'name': 'cancelScheduledValues',
    'signatures': [
      [
        'startTime'
      ]
    ]
  },
  {
    'name': 'cancelAndHoldAtTime',
    'signatures': [
      [
        'startTime'
      ]
    ]
  },
  {
    'name': 'registerProcessor',
    'signatures': [
      [
        'name',
        'processorCtor'
      ]
    ]
  },
  {
    'name': 'createBuffer',
    'signatures': [
      [
        'numberOfChannels',
        'numberOfFrames',
        'sampleRate'
      ]
    ],
    'receiver': 'BaseAudioContext'
  },
  {
    'name': 'createBuffer',
    'signatures': [
      [
        'descriptor'
      ]
    ],
    'receiver': 'GPUDevice'
  },
  {
    'name': 'decodeAudioData',
    'signatures': [
      [
        'audioData',
        '?successCallback',
        '?errorCallback'
      ]
    ]
  },
  {
    'name': 'createDelay',
    'signatures': [
      [
        '?maxDelayTime'
      ]
    ]
  },
  {
    'name': 'createIIRFilter',
    'signatures': [
      [
        'feedForward',
        'feedBack'
      ]
    ]
  },
  {
    'name': 'createScriptProcessor',
    'signatures': [
      [
        '?bufferSize',
        '?numberOfInputChannels',
        '?numberOfOutputChannels'
      ]
    ]
  },
  {
    'name': 'createPeriodicWave',
    'signatures': [
      [
        'real',
        'imag',
        '?constraints'
      ]
    ]
  },
  {
    'name': 'createChannelSplitter',
    'signatures': [
      [
        '?numberOfOutputs'
      ]
    ]
  },
  {
    'name': 'createChannelMerger',
    'signatures': [
      [
        '?numberOfInputs'
      ]
    ]
  },
  {
    'name': 'getFrequencyResponse',
    'signatures': [
      [
        'frequencyHz',
        'magResponse',
        'phaseResponse'
      ]
    ]
  },
  {
    'name': 'setPeriodicWave',
    'signatures': [
      [
        'periodicWave'
      ]
    ]
  },
  {
    'name': 'configure',
    'signatures': [
      [
        'config'
      ]
    ],
    'receiver': 'AudioDecoder'
  },
  {
    'name': 'configure',
    'signatures': [
      [
        'config'
      ]
    ],
    'receiver': 'AudioEncoder'
  },
  {
    'name': 'configure',
    'signatures': [
      [
        'config'
      ]
    ],
    'receiver': 'VideoDecoder'
  },
  {
    'name': 'configure',
    'signatures': [
      [
        'config'
      ]
    ],
    'receiver': 'VideoEncoder'
  },
  {
    'name': 'configure',
    'signatures': [
      [
        'descriptor'
      ]
    ],
    'receiver': 'GPUCanvasContext'
  },
  {
    'name': 'isConfigSupported',
    'signatures': [
      [
        'config'
      ]
    ]
  },
  {
    'name': 'readInto',
    'signatures': [
      [
        'dst'
      ]
    ]
  },
  {
    'name': 'allocationSize',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'changeVersion',
    'signatures': [
      [
        'oldVersion',
        'newVersion',
        '?callback',
        '?errorCallback',
        '?successCallback'
      ]
    ]
  },
  {
    'name': 'readTransaction',
    'signatures': [
      [
        'callback',
        '?errorCallback',
        '?successCallback'
      ]
    ]
  },
  {
    'name': 'executeSql',
    'signatures': [
      [
        'sqlStatement',
        '?arguments',
        '?callback',
        '?errorCallback'
      ]
    ]
  },
  {
    'name': 'openDatabase',
    'signatures': [
      [
        'name',
        'version',
        'displayName',
        'estimatedSize',
        '?creationCallback'
      ]
    ]
  },
  {
    'name': 'drawArraysInstancedANGLE',
    'signatures': [
      [
        'mode',
        'first',
        'count',
        'primcount'
      ]
    ]
  },
  {
    'name': 'drawElementsInstancedANGLE',
    'signatures': [
      [
        'mode',
        'count',
        'type',
        'offset',
        'primcount'
      ]
    ]
  },
  {
    'name': 'vertexAttribDivisorANGLE',
    'signatures': [
      [
        'index',
        'divisor'
      ]
    ]
  },
  {
    'name': 'queryCounterEXT',
    'signatures': [
      [
        'query',
        'target'
      ]
    ]
  },
  {
    'name': 'deleteQueryEXT',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'isQueryEXT',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'beginQueryEXT',
    'signatures': [
      [
        'target',
        'query'
      ]
    ]
  },
  {
    'name': 'endQueryEXT',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'getQueryEXT',
    'signatures': [
      [
        'target',
        'pname'
      ]
    ]
  },
  {
    'name': 'getQueryObjectEXT',
    'signatures': [
      [
        'query',
        'pname'
      ]
    ]
  },
  {
    'name': 'enableiOES',
    'signatures': [
      [
        'target',
        'index'
      ]
    ]
  },
  {
    'name': 'disableiOES',
    'signatures': [
      [
        'target',
        'index'
      ]
    ]
  },
  {
    'name': 'blendEquationiOES',
    'signatures': [
      [
        'buf',
        'mode'
      ]
    ]
  },
  {
    'name': 'blendEquationSeparateiOES',
    'signatures': [
      [
        'buf',
        'modeRGB',
        'modeAlpha'
      ]
    ]
  },
  {
    'name': 'blendFunciOES',
    'signatures': [
      [
        'buf',
        'src',
        'dst'
      ]
    ]
  },
  {
    'name': 'blendFuncSeparateiOES',
    'signatures': [
      [
        'buf',
        'srcRGB',
        'dstRGB',
        'srcAlpha',
        'dstAlpha'
      ]
    ]
  },
  {
    'name': 'colorMaskiOES',
    'signatures': [
      [
        'buf',
        'r',
        'g',
        'b',
        'a'
      ]
    ]
  },
  {
    'name': 'isEnablediOES',
    'signatures': [
      [
        'target',
        'index'
      ]
    ]
  },
  {
    'name': 'deleteVertexArrayOES',
    'signatures': [
      [
        '?arrayObject'
      ]
    ]
  },
  {
    'name': 'isVertexArrayOES',
    'signatures': [
      [
        '?arrayObject'
      ]
    ]
  },
  {
    'name': 'bindVertexArrayOES',
    'signatures': [
      [
        '?arrayObject'
      ]
    ]
  },
  {
    'name': 'framebufferTextureMultiviewOVR',
    'signatures': [
      [
        'target',
        'attachment',
        'texture',
        'level',
        'baseViewIndex',
        'numViews'
      ]
    ]
  },
  {
    'name': 'getTranslatedShaderSource',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'drawBuffersWEBGL',
    'signatures': [
      [
        'buffers'
      ]
    ]
  },
  {
    'name': 'drawArraysInstancedBaseInstanceWEBGL',
    'signatures': [
      [
        'mode',
        'first',
        'count',
        'instance_count',
        'baseinstance'
      ]
    ]
  },
  {
    'name': 'drawElementsInstancedBaseVertexBaseInstanceWEBGL',
    'signatures': [
      [
        'mode',
        'count',
        'type',
        'offset',
        'instance_count',
        'basevertex',
        'baseinstance'
      ]
    ]
  },
  {
    'name': 'multiDrawArraysInstancedBaseInstanceWEBGL',
    'signatures': [
      [
        'mode',
        'firstsList',
        'firstsOffset',
        'countsList',
        'countsOffset',
        'instanceCountsList',
        'instanceCountsOffset',
        'baseInstancesList',
        'baseInstancesOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'multiDrawElementsInstancedBaseVertexBaseInstanceWEBGL',
    'signatures': [
      [
        'mode',
        'countsList',
        'countsOffset',
        'type',
        'offsetsList',
        'offsetsOffset',
        'instanceCountsList',
        'instanceCountsOffset',
        'baseVerticesList',
        'baseVerticesOffset',
        'baseInstancesList',
        'baseInstancesOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'multiDrawArraysWEBGL',
    'signatures': [
      [
        'mode',
        'firstsList',
        'firstsOffset',
        'countsList',
        'countsOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'multiDrawElementsWEBGL',
    'signatures': [
      [
        'mode',
        'countsList',
        'countsOffset',
        'type',
        'offsetsList',
        'offsetsOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'multiDrawArraysInstancedWEBGL',
    'signatures': [
      [
        'mode',
        'firstsList',
        'firstsOffset',
        'countsList',
        'countsOffset',
        'instanceCountsList',
        'instanceCountsOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'multiDrawElementsInstancedWEBGL',
    'signatures': [
      [
        'mode',
        'countsList',
        'countsOffset',
        'type',
        'offsetsList',
        'offsetsOffset',
        'instanceCountsList',
        'instanceCountsOffset',
        'drawcount'
      ]
    ]
  },
  {
    'name': 'activeTexture',
    'signatures': [
      [
        'texture'
      ]
    ]
  },
  {
    'name': 'attachShader',
    'signatures': [
      [
        'program',
        'shader'
      ]
    ]
  },
  {
    'name': 'bindAttribLocation',
    'signatures': [
      [
        'program',
        'index',
        'name'
      ]
    ]
  },
  {
    'name': 'bindBuffer',
    'signatures': [
      [
        'target',
        'buffer'
      ]
    ]
  },
  {
    'name': 'bindFramebuffer',
    'signatures': [
      [
        'target',
        'framebuffer'
      ]
    ]
  },
  {
    'name': 'bindRenderbuffer',
    'signatures': [
      [
        'target',
        'renderbuffer'
      ]
    ]
  },
  {
    'name': 'bindTexture',
    'signatures': [
      [
        'target',
        'texture'
      ]
    ]
  },
  {
    'name': 'blendColor',
    'signatures': [
      [
        'red',
        'green',
        'blue',
        'alpha'
      ]
    ]
  },
  {
    'name': 'blendEquation',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'blendEquationSeparate',
    'signatures': [
      [
        'modeRGB',
        'modeAlpha'
      ]
    ]
  },
  {
    'name': 'blendFunc',
    'signatures': [
      [
        'sfactor',
        'dfactor'
      ]
    ]
  },
  {
    'name': 'blendFuncSeparate',
    'signatures': [
      [
        'srcRGB',
        'dstRGB',
        'srcAlpha',
        'dstAlpha'
      ]
    ]
  },
  {
    'name': 'bufferData',
    'signatures': [
      [
        'target',
        'size',
        'usage'
      ],
      [
        'target',
        'data',
        'usage'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'bufferData',
    'signatures': [
      [
        'target',
        'srcData',
        'usage',
        'srcOffset',
        '?length'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'bufferSubData',
    'signatures': [
      [
        'target',
        'offset',
        'data'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'bufferSubData',
    'signatures': [
      [
        'target',
        'dstByteOffset',
        'srcData',
        'srcOffset',
        '?length'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'checkFramebufferStatus',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'clearColor',
    'signatures': [
      [
        'red',
        'green',
        'blue',
        'alpha'
      ]
    ]
  },
  {
    'name': 'clearDepth',
    'signatures': [
      [
        'depth'
      ]
    ]
  },
  {
    'name': 'clearStencil',
    'signatures': [
      [
        's'
      ]
    ]
  },
  {
    'name': 'colorMask',
    'signatures': [
      [
        'red',
        'green',
        'blue',
        'alpha'
      ]
    ]
  },
  {
    'name': 'compileShader',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'compressedTexImage2D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'data'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'compressedTexImage2D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'imageSize',
        'offset'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'data',
        'srcOffset',
        '?srcLengthOverride'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'compressedTexSubImage2D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'data'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'compressedTexSubImage2D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'imageSize',
        'offset'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'data',
        'srcOffset',
        '?srcLengthOverride'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'copyTexImage2D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'x',
        'y',
        'width',
        'height',
        'border'
      ]
    ]
  },
  {
    'name': 'copyTexSubImage2D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'createShader',
    'signatures': [
      [
        'type'
      ]
    ]
  },
  {
    'name': 'createTexture',
    'signatures': [
      [
        'descriptor'
      ]
    ],
    'receiver': 'GPUDevice'
  },
  {
    'name': 'cullFace',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'deleteBuffer',
    'signatures': [
      [
        'buffer'
      ]
    ]
  },
  {
    'name': 'deleteFramebuffer',
    'signatures': [
      [
        'framebuffer'
      ]
    ]
  },
  {
    'name': 'deleteProgram',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'deleteRenderbuffer',
    'signatures': [
      [
        'renderbuffer'
      ]
    ]
  },
  {
    'name': 'deleteShader',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'deleteTexture',
    'signatures': [
      [
        'texture'
      ]
    ]
  },
  {
    'name': 'depthFunc',
    'signatures': [
      [
        'func'
      ]
    ]
  },
  {
    'name': 'depthMask',
    'signatures': [
      [
        'flag'
      ]
    ]
  },
  {
    'name': 'depthRange',
    'signatures': [
      [
        'zNear',
        'zFar'
      ]
    ]
  },
  {
    'name': 'detachShader',
    'signatures': [
      [
        'program',
        'shader'
      ]
    ]
  },
  {
    'name': 'disableVertexAttribArray',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'drawArrays',
    'signatures': [
      [
        'mode',
        'first',
        'count'
      ]
    ]
  },
  {
    'name': 'drawElements',
    'signatures': [
      [
        'mode',
        'count',
        'type',
        'offset'
      ]
    ]
  },
  {
    'name': 'enableVertexAttribArray',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'framebufferRenderbuffer',
    'signatures': [
      [
        'target',
        'attachment',
        'renderbuffertarget',
        'renderbuffer'
      ]
    ]
  },
  {
    'name': 'framebufferTexture2D',
    'signatures': [
      [
        'target',
        'attachment',
        'textarget',
        'texture',
        'level'
      ]
    ]
  },
  {
    'name': 'frontFace',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'generateMipmap',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'getActiveAttrib',
    'signatures': [
      [
        'program',
        'index'
      ]
    ]
  },
  {
    'name': 'getActiveUniform',
    'signatures': [
      [
        'program',
        'index'
      ]
    ]
  },
  {
    'name': 'getAttachedShaders',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'getAttribLocation',
    'signatures': [
      [
        'program',
        'name'
      ]
    ]
  },
  {
    'name': 'getBufferParameter',
    'signatures': [
      [
        'target',
        'pname'
      ]
    ]
  },
  {
    'name': 'getExtension',
    'signatures': [
      [
        'name'
      ]
    ]
  },
  {
    'name': 'getFramebufferAttachmentParameter',
    'signatures': [
      [
        'target',
        'attachment',
        'pname'
      ]
    ]
  },
  {
    'name': 'getProgramParameter',
    'signatures': [
      [
        'program',
        'pname'
      ]
    ]
  },
  {
    'name': 'getProgramInfoLog',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'getRenderbufferParameter',
    'signatures': [
      [
        'target',
        'pname'
      ]
    ]
  },
  {
    'name': 'getShaderParameter',
    'signatures': [
      [
        'shader',
        'pname'
      ]
    ]
  },
  {
    'name': 'getShaderInfoLog',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'getShaderPrecisionFormat',
    'signatures': [
      [
        'shadertype',
        'precisiontype'
      ]
    ]
  },
  {
    'name': 'getShaderSource',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'getTexParameter',
    'signatures': [
      [
        'target',
        'pname'
      ]
    ]
  },
  {
    'name': 'getUniform',
    'signatures': [
      [
        'program',
        'location'
      ]
    ]
  },
  {
    'name': 'getUniformLocation',
    'signatures': [
      [
        'program',
        'name'
      ]
    ]
  },
  {
    'name': 'getVertexAttrib',
    'signatures': [
      [
        'index',
        'pname'
      ]
    ]
  },
  {
    'name': 'getVertexAttribOffset',
    'signatures': [
      [
        'index',
        'pname'
      ]
    ]
  },
  {
    'name': 'hint',
    'signatures': [
      [
        'target',
        'mode'
      ]
    ]
  },
  {
    'name': 'isBuffer',
    'signatures': [
      [
        'buffer'
      ]
    ]
  },
  {
    'name': 'isEnabled',
    'signatures': [
      [
        'cap'
      ]
    ]
  },
  {
    'name': 'isFramebuffer',
    'signatures': [
      [
        'framebuffer'
      ]
    ]
  },
  {
    'name': 'isRenderbuffer',
    'signatures': [
      [
        'renderbuffer'
      ]
    ]
  },
  {
    'name': 'isShader',
    'signatures': [
      [
        'shader'
      ]
    ]
  },
  {
    'name': 'isTexture',
    'signatures': [
      [
        'texture'
      ]
    ]
  },
  {
    'name': 'lineWidth',
    'signatures': [
      [
        'width'
      ]
    ]
  },
  {
    'name': 'linkProgram',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'pixelStorei',
    'signatures': [
      [
        'pname',
        'param'
      ]
    ]
  },
  {
    'name': 'polygonOffset',
    'signatures': [
      [
        'factor',
        'units'
      ]
    ]
  },
  {
    'name': 'readPixels',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height',
        'format',
        'type',
        'pixels'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'readPixels',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height',
        'format',
        'type',
        'offset'
      ],
      [
        'x',
        'y',
        'width',
        'height',
        'format',
        'type',
        'dstData',
        'offset'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'renderbufferStorage',
    'signatures': [
      [
        'target',
        'internalformat',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'sampleCoverage',
    'signatures': [
      [
        'value',
        'invert'
      ]
    ]
  },
  {
    'name': 'scissor',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'shaderSource',
    'signatures': [
      [
        'shader',
        'string'
      ]
    ]
  },
  {
    'name': 'stencilFunc',
    'signatures': [
      [
        'func',
        'ref',
        'mask'
      ]
    ]
  },
  {
    'name': 'stencilFuncSeparate',
    'signatures': [
      [
        'face',
        'func',
        'ref',
        'mask'
      ]
    ]
  },
  {
    'name': 'stencilMask',
    'signatures': [
      [
        'mask'
      ]
    ]
  },
  {
    'name': 'stencilMaskSeparate',
    'signatures': [
      [
        'face',
        'mask'
      ]
    ]
  },
  {
    'name': 'stencilOp',
    'signatures': [
      [
        'fail',
        'zfail',
        'zpass'
      ]
    ]
  },
  {
    'name': 'stencilOpSeparate',
    'signatures': [
      [
        'face',
        'fail',
        'zfail',
        'zpass'
      ]
    ]
  },
  {
    'name': 'texParameterf',
    'signatures': [
      [
        'target',
        'pname',
        'param'
      ]
    ]
  },
  {
    'name': 'texParameteri',
    'signatures': [
      [
        'target',
        'pname',
        'param'
      ]
    ]
  },
  {
    'name': 'texImage2D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'pixels'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'internalformat',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'pixels'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'texImage2D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'offset'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'data'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'border',
        'format',
        'type',
        'srcData',
        'srcOffset'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'texSubImage2D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'pixels'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'pixels'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'texSubImage2D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'offset'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'data'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'width',
        'height',
        'format',
        'type',
        'srcData',
        'srcOffset'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform1f',
    'signatures': [
      [
        'location',
        'x'
      ]
    ]
  },
  {
    'name': 'uniform1fv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform1fv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform1i',
    'signatures': [
      [
        'location',
        'x'
      ]
    ]
  },
  {
    'name': 'uniform1iv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform1iv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform2f',
    'signatures': [
      [
        'location',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'uniform2fv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform2fv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform2i',
    'signatures': [
      [
        'location',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'uniform2iv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform2iv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform3f',
    'signatures': [
      [
        'location',
        'x',
        'y',
        'z'
      ]
    ]
  },
  {
    'name': 'uniform3fv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform3fv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform3i',
    'signatures': [
      [
        'location',
        'x',
        'y',
        'z'
      ]
    ]
  },
  {
    'name': 'uniform3iv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform3iv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform4f',
    'signatures': [
      [
        'location',
        'x',
        'y',
        'z',
        'w'
      ]
    ]
  },
  {
    'name': 'uniform4fv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform4fv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniform4i',
    'signatures': [
      [
        'location',
        'x',
        'y',
        'z',
        'w'
      ]
    ]
  },
  {
    'name': 'uniform4iv',
    'signatures': [
      [
        'location',
        'v'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniform4iv',
    'signatures': [
      [
        'location',
        'v',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniformMatrix2fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniformMatrix2fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniformMatrix3fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniformMatrix3fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'uniformMatrix4fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array'
      ]
    ],
    'receiver': 'WebGLRenderingContextBase'
  },
  {
    'name': 'uniformMatrix4fv',
    'signatures': [
      [
        'location',
        'transpose',
        'array',
        'srcOffset',
        '?srcLength'
      ]
    ],
    'receiver': 'WebGL2RenderingContextBase'
  },
  {
    'name': 'useProgram',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'validateProgram',
    'signatures': [
      [
        'program'
      ]
    ]
  },
  {
    'name': 'vertexAttrib1f',
    'signatures': [
      [
        'indx',
        'x'
      ]
    ]
  },
  {
    'name': 'vertexAttrib1fv',
    'signatures': [
      [
        'indx',
        'values'
      ]
    ]
  },
  {
    'name': 'vertexAttrib2f',
    'signatures': [
      [
        'indx',
        'x',
        'y'
      ]
    ]
  },
  {
    'name': 'vertexAttrib2fv',
    'signatures': [
      [
        'indx',
        'values'
      ]
    ]
  },
  {
    'name': 'vertexAttrib3f',
    'signatures': [
      [
        'indx',
        'x',
        'y',
        'z'
      ]
    ]
  },
  {
    'name': 'vertexAttrib3fv',
    'signatures': [
      [
        'indx',
        'values'
      ]
    ]
  },
  {
    'name': 'vertexAttrib4f',
    'signatures': [
      [
        'indx',
        'x',
        'y',
        'z',
        'w'
      ]
    ]
  },
  {
    'name': 'vertexAttrib4fv',
    'signatures': [
      [
        'indx',
        'values'
      ]
    ]
  },
  {
    'name': 'vertexAttribPointer',
    'signatures': [
      [
        'indx',
        'size',
        'type',
        'normalized',
        'stride',
        'offset'
      ]
    ]
  },
  {
    'name': 'viewport',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'shareVideoImageWEBGL',
    'signatures': [
      [
        'target',
        'video'
      ]
    ]
  },
  {
    'name': 'releaseVideoImageWEBGL',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'importVideoFrame',
    'signatures': [
      [
        'videoFrame'
      ]
    ]
  },
  {
    'name': 'releaseVideoFrame',
    'signatures': [
      [
        'handle'
      ]
    ]
  },
  {
    'name': 'copyBufferSubData',
    'signatures': [
      [
        'readTarget',
        'writeTarget',
        'readOffset',
        'writeOffset',
        'size'
      ]
    ]
  },
  {
    'name': 'getBufferSubData',
    'signatures': [
      [
        'target',
        'srcByteOffset',
        'dstData',
        '?dstOffset',
        '?length'
      ]
    ]
  },
  {
    'name': 'blitFramebuffer',
    'signatures': [
      [
        'srcX0',
        'srcY0',
        'srcX1',
        'srcY1',
        'dstX0',
        'dstY0',
        'dstX1',
        'dstY1',
        'mask',
        'filter'
      ]
    ]
  },
  {
    'name': 'framebufferTextureLayer',
    'signatures': [
      [
        'target',
        'attachment',
        'texture',
        'level',
        'layer'
      ]
    ]
  },
  {
    'name': 'getInternalformatParameter',
    'signatures': [
      [
        'target',
        'internalformat',
        'pname'
      ]
    ]
  },
  {
    'name': 'invalidateFramebuffer',
    'signatures': [
      [
        'target',
        'attachments'
      ]
    ]
  },
  {
    'name': 'invalidateSubFramebuffer',
    'signatures': [
      [
        'target',
        'attachments',
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'readBuffer',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'renderbufferStorageMultisample',
    'signatures': [
      [
        'target',
        'samples',
        'internalformat',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'texStorage2D',
    'signatures': [
      [
        'target',
        'levels',
        'internalformat',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'texStorage3D',
    'signatures': [
      [
        'target',
        'levels',
        'internalformat',
        'width',
        'height',
        'depth'
      ]
    ]
  },
  {
    'name': 'texImage3D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'offset'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'data'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'format',
        'type',
        'pixels',
        '?srcOffset'
      ]
    ]
  },
  {
    'name': 'texSubImage3D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'offset'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'data'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'image'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'canvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'offscreenCanvas'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'video'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'frame'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'bitmap'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'type',
        'pixels',
        '?srcOffset'
      ]
    ]
  },
  {
    'name': 'copyTexSubImage3D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'compressedTexImage3D',
    'signatures': [
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'imageSize',
        'offset'
      ],
      [
        'target',
        'level',
        'internalformat',
        'width',
        'height',
        'depth',
        'border',
        'data',
        '?srcOffset',
        '?srcLengthOverride'
      ]
    ]
  },
  {
    'name': 'compressedTexSubImage3D',
    'signatures': [
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'imageSize',
        'offset'
      ],
      [
        'target',
        'level',
        'xoffset',
        'yoffset',
        'zoffset',
        'width',
        'height',
        'depth',
        'format',
        'data',
        '?srcOffset',
        '?srcLengthOverride'
      ]
    ]
  },
  {
    'name': 'getFragDataLocation',
    'signatures': [
      [
        'program',
        'name'
      ]
    ]
  },
  {
    'name': 'uniform1ui',
    'signatures': [
      [
        'location',
        'v0'
      ]
    ]
  },
  {
    'name': 'uniform2ui',
    'signatures': [
      [
        'location',
        'v0',
        'v1'
      ]
    ]
  },
  {
    'name': 'uniform3ui',
    'signatures': [
      [
        'location',
        'v0',
        'v1',
        'v2'
      ]
    ]
  },
  {
    'name': 'uniform4ui',
    'signatures': [
      [
        'location',
        'v0',
        'v1',
        'v2',
        'v3'
      ]
    ]
  },
  {
    'name': 'uniform1uiv',
    'signatures': [
      [
        'location',
        'v',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniform2uiv',
    'signatures': [
      [
        'location',
        'v',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniform3uiv',
    'signatures': [
      [
        'location',
        'v',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniform4uiv',
    'signatures': [
      [
        'location',
        'v',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix2x3fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix3x2fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix2x4fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix4x2fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix3x4fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'uniformMatrix4x3fv',
    'signatures': [
      [
        'location',
        'transpose',
        'value',
        '?srcOffset',
        '?srcLength'
      ]
    ]
  },
  {
    'name': 'vertexAttribI4i',
    'signatures': [
      [
        'index',
        'x',
        'y',
        'z',
        'w'
      ]
    ]
  },
  {
    'name': 'vertexAttribI4iv',
    'signatures': [
      [
        'index',
        'v'
      ]
    ]
  },
  {
    'name': 'vertexAttribI4ui',
    'signatures': [
      [
        'index',
        'x',
        'y',
        'z',
        'w'
      ]
    ]
  },
  {
    'name': 'vertexAttribI4uiv',
    'signatures': [
      [
        'index',
        'v'
      ]
    ]
  },
  {
    'name': 'vertexAttribIPointer',
    'signatures': [
      [
        'index',
        'size',
        'type',
        'stride',
        'offset'
      ]
    ]
  },
  {
    'name': 'vertexAttribDivisor',
    'signatures': [
      [
        'index',
        'divisor'
      ]
    ]
  },
  {
    'name': 'drawArraysInstanced',
    'signatures': [
      [
        'mode',
        'first',
        'count',
        'instanceCount'
      ]
    ]
  },
  {
    'name': 'drawElementsInstanced',
    'signatures': [
      [
        'mode',
        'count',
        'type',
        'offset',
        'instanceCount'
      ]
    ]
  },
  {
    'name': 'drawRangeElements',
    'signatures': [
      [
        'mode',
        'start',
        'end',
        'count',
        'type',
        'offset'
      ]
    ]
  },
  {
    'name': 'drawBuffers',
    'signatures': [
      [
        'buffers'
      ]
    ]
  },
  {
    'name': 'clearBufferiv',
    'signatures': [
      [
        'buffer',
        'drawbuffer',
        'value',
        '?srcOffset'
      ]
    ]
  },
  {
    'name': 'clearBufferuiv',
    'signatures': [
      [
        'buffer',
        'drawbuffer',
        'value',
        '?srcOffset'
      ]
    ]
  },
  {
    'name': 'clearBufferfv',
    'signatures': [
      [
        'buffer',
        'drawbuffer',
        'value',
        '?srcOffset'
      ]
    ]
  },
  {
    'name': 'clearBufferfi',
    'signatures': [
      [
        'buffer',
        'drawbuffer',
        'depth',
        'stencil'
      ]
    ]
  },
  {
    'name': 'deleteQuery',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'isQuery',
    'signatures': [
      [
        'query'
      ]
    ]
  },
  {
    'name': 'beginQuery',
    'signatures': [
      [
        'target',
        'query'
      ]
    ]
  },
  {
    'name': 'endQuery',
    'signatures': [
      [
        'target'
      ]
    ]
  },
  {
    'name': 'getQuery',
    'signatures': [
      [
        'target',
        'pname'
      ]
    ]
  },
  {
    'name': 'getQueryParameter',
    'signatures': [
      [
        'query',
        'pname'
      ]
    ]
  },
  {
    'name': 'createSampler',
    'signatures': [
      [
        '?descriptor'
      ]
    ],
    'receiver': 'GPUDevice'
  },
  {
    'name': 'deleteSampler',
    'signatures': [
      [
        'sampler'
      ]
    ]
  },
  {
    'name': 'isSampler',
    'signatures': [
      [
        'sampler'
      ]
    ]
  },
  {
    'name': 'bindSampler',
    'signatures': [
      [
        'unit',
        'sampler'
      ]
    ]
  },
  {
    'name': 'samplerParameteri',
    'signatures': [
      [
        'sampler',
        'pname',
        'param'
      ]
    ]
  },
  {
    'name': 'samplerParameterf',
    'signatures': [
      [
        'sampler',
        'pname',
        'param'
      ]
    ]
  },
  {
    'name': 'getSamplerParameter',
    'signatures': [
      [
        'sampler',
        'pname'
      ]
    ]
  },
  {
    'name': 'fenceSync',
    'signatures': [
      [
        'condition',
        'flags'
      ]
    ]
  },
  {
    'name': 'isSync',
    'signatures': [
      [
        'sync'
      ]
    ]
  },
  {
    'name': 'clientWaitSync',
    'signatures': [
      [
        'sync',
        'flags',
        'timeout'
      ]
    ]
  },
  {
    'name': 'waitSync',
    'signatures': [
      [
        'sync',
        'flags',
        'timeout'
      ]
    ]
  },
  {
    'name': 'getSyncParameter',
    'signatures': [
      [
        'sync',
        'pname'
      ]
    ]
  },
  {
    'name': 'deleteTransformFeedback',
    'signatures': [
      [
        'feedback'
      ]
    ]
  },
  {
    'name': 'isTransformFeedback',
    'signatures': [
      [
        'feedback'
      ]
    ]
  },
  {
    'name': 'bindTransformFeedback',
    'signatures': [
      [
        'target',
        'feedback'
      ]
    ]
  },
  {
    'name': 'beginTransformFeedback',
    'signatures': [
      [
        'primitiveMode'
      ]
    ]
  },
  {
    'name': 'transformFeedbackVaryings',
    'signatures': [
      [
        'program',
        'varyings',
        'bufferMode'
      ]
    ]
  },
  {
    'name': 'getTransformFeedbackVarying',
    'signatures': [
      [
        'program',
        'index'
      ]
    ]
  },
  {
    'name': 'bindBufferBase',
    'signatures': [
      [
        'target',
        'index',
        'buffer'
      ]
    ]
  },
  {
    'name': 'bindBufferRange',
    'signatures': [
      [
        'target',
        'index',
        'buffer',
        'offset',
        'size'
      ]
    ]
  },
  {
    'name': 'getIndexedParameter',
    'signatures': [
      [
        'target',
        'index'
      ]
    ]
  },
  {
    'name': 'getUniformIndices',
    'signatures': [
      [
        'program',
        'uniformNames'
      ]
    ]
  },
  {
    'name': 'getActiveUniforms',
    'signatures': [
      [
        'program',
        'uniformIndices',
        'pname'
      ]
    ]
  },
  {
    'name': 'getUniformBlockIndex',
    'signatures': [
      [
        'program',
        'uniformBlockName'
      ]
    ]
  },
  {
    'name': 'getActiveUniformBlockParameter',
    'signatures': [
      [
        'program',
        'uniformBlockIndex',
        'pname'
      ]
    ]
  },
  {
    'name': 'getActiveUniformBlockName',
    'signatures': [
      [
        'program',
        'uniformBlockIndex'
      ]
    ]
  },
  {
    'name': 'uniformBlockBinding',
    'signatures': [
      [
        'program',
        'uniformBlockIndex',
        'uniformBlockBinding'
      ]
    ]
  },
  {
    'name': 'deleteVertexArray',
    'signatures': [
      [
        'vertexArray'
      ]
    ]
  },
  {
    'name': 'isVertexArray',
    'signatures': [
      [
        'vertexArray'
      ]
    ]
  },
  {
    'name': 'bindVertexArray',
    'signatures': [
      [
        'vertexArray'
      ]
    ]
  },
  {
    'name': 'mapAsync',
    'signatures': [
      [
        'mode',
        '?offset',
        '?size'
      ]
    ]
  },
  {
    'name': 'getMappedRange',
    'signatures': [
      [
        '?offset',
        '?size'
      ]
    ]
  },
  {
    'name': 'getPreferredFormat',
    'signatures': [
      [
        'adapter'
      ]
    ]
  },
  {
    'name': 'configureSwapChain',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'getSwapChainPreferredFormat',
    'signatures': [
      [
        'adapter'
      ]
    ]
  },
  {
    'name': 'beginRenderPass',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'beginComputePass',
    'signatures': [
      [
        '?descriptor'
      ]
    ]
  },
  {
    'name': 'copyBufferToBuffer',
    'signatures': [
      [
        'src',
        'srcOffset',
        'dst',
        'dstOffset',
        'size'
      ]
    ]
  },
  {
    'name': 'copyBufferToTexture',
    'signatures': [
      [
        'source',
        'destination',
        'copySize'
      ]
    ]
  },
  {
    'name': 'copyTextureToBuffer',
    'signatures': [
      [
        'source',
        'destination',
        'copySize'
      ]
    ]
  },
  {
    'name': 'copyTextureToTexture',
    'signatures': [
      [
        'source',
        'destination',
        'copySize'
      ]
    ]
  },
  {
    'name': 'pushDebugGroup',
    'signatures': [
      [
        'groupLabel'
      ]
    ]
  },
  {
    'name': 'insertDebugMarker',
    'signatures': [
      [
        'markerLabel'
      ]
    ]
  },
  {
    'name': 'resolveQuerySet',
    'signatures': [
      [
        'querySet',
        'firstQuery',
        'queryCount',
        'destination',
        'destinationOffset'
      ]
    ]
  },
  {
    'name': 'writeTimestamp',
    'signatures': [
      [
        'querySet',
        'queryIndex'
      ]
    ]
  },
  {
    'name': 'setPipeline',
    'signatures': [
      [
        'pipeline'
      ]
    ]
  },
  {
    'name': 'dispatch',
    'signatures': [
      [
        'x',
        '?y',
        '?z'
      ]
    ]
  },
  {
    'name': 'dispatchIndirect',
    'signatures': [
      [
        'indirectBuffer',
        'indirectOffset'
      ]
    ]
  },
  {
    'name': 'experimentalImportTexture',
    'signatures': [
      [
        'video',
        'usage'
      ],
      [
        'canvas',
        'usage'
      ]
    ]
  },
  {
    'name': 'createBindGroup',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createBindGroupLayout',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createPipelineLayout',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createShaderModule',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createRenderPipeline',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createComputePipeline',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createRenderPipelineAsync',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createComputePipelineAsync',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createCommandEncoder',
    'signatures': [
      [
        '?descriptor'
      ]
    ]
  },
  {
    'name': 'createRenderBundleEncoder',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'createQuerySet',
    'signatures': [
      [
        'descriptor'
      ]
    ]
  },
  {
    'name': 'pushErrorScope',
    'signatures': [
      [
        'filter'
      ]
    ]
  },
  {
    'name': 'getBindGroupLayout',
    'signatures': [
      [
        'index'
      ]
    ]
  },
  {
    'name': 'setBindGroup',
    'signatures': [
      [
        'index',
        'bindGroup',
        '?dynamicOffsets'
      ],
      [
        'index',
        'bindGroup',
        'dynamicOffsetsData',
        'dynamicOffsetsDataStart',
        'dynamicOffsetsDataLength'
      ]
    ]
  },
  {
    'name': 'writeBuffer',
    'signatures': [
      [
        'buffer',
        'bufferOffset',
        'data',
        '?dataElementOffset',
        '?dataElementCount'
      ],
      [
        'buffer',
        'bufferOffset',
        'data',
        '?dataByteOffset',
        '?byteSize'
      ]
    ]
  },
  {
    'name': 'writeTexture',
    'signatures': [
      [
        'destination',
        'data',
        'dataLayout',
        'size'
      ]
    ]
  },
  {
    'name': 'copyImageBitmapToTexture',
    'signatures': [
      [
        'source',
        'destination',
        'copySize'
      ]
    ]
  },
  {
    'name': 'copyExternalImageToTexture',
    'signatures': [
      [
        'source',
        'destination',
        'copySize'
      ]
    ]
  },
  {
    'name': 'setIndexBuffer',
    'signatures': [
      [
        'buffer',
        'format',
        '?offset',
        '?size'
      ]
    ]
  },
  {
    'name': 'setVertexBuffer',
    'signatures': [
      [
        'slot',
        'buffer',
        '?offset',
        '?size'
      ]
    ]
  },
  {
    'name': 'draw',
    'signatures': [
      [
        'vertexCount',
        '?instanceCount',
        '?firstVertex',
        '?firstInstance'
      ]
    ]
  },
  {
    'name': 'drawIndexed',
    'signatures': [
      [
        'indexCount',
        '?instanceCount',
        '?firstIndex',
        '?baseVertex',
        '?firstInstance'
      ]
    ]
  },
  {
    'name': 'drawIndirect',
    'signatures': [
      [
        'indirectBuffer',
        'indirectOffset'
      ]
    ]
  },
  {
    'name': 'drawIndexedIndirect',
    'signatures': [
      [
        'indirectBuffer',
        'indirectOffset'
      ]
    ]
  },
  {
    'name': 'setViewport',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height',
        'minDepth',
        'maxDepth'
      ]
    ]
  },
  {
    'name': 'setScissorRect',
    'signatures': [
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ]
  },
  {
    'name': 'setBlendConstant',
    'signatures': [
      [
        'color'
      ]
    ]
  },
  {
    'name': 'setBlendColor',
    'signatures': [
      [
        'color'
      ]
    ]
  },
  {
    'name': 'setStencilReference',
    'signatures': [
      [
        'reference'
      ]
    ]
  },
  {
    'name': 'executeBundles',
    'signatures': [
      [
        'bundles'
      ]
    ]
  },
  {
    'name': 'beginOcclusionQuery',
    'signatures': [
      [
        'queryIndex'
      ]
    ]
  },
  {
    'name': 'createView',
    'signatures': [
      [
        '?descriptor'
      ]
    ]
  },
  {
    'name': 'requestAdapter',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'provide',
    'signatures': [
      [
        '?id_token'
      ]
    ]
  },
  {
    'name': 'logout',
    'signatures': [
      [
        '?logout_endpoints'
      ]
    ]
  },
  {
    'name': 'requestMIDIAccess',
    'signatures': [
      [
        '?options'
      ]
    ]
  },
  {
    'name': 'canShare',
    'signatures': [
      [
        '?data'
      ]
    ]
  },
  {
    'name': 'share',
    'signatures': [
      [
        '?data'
      ]
    ]
  },
  {
    'name': 'abortWriting',
    'signatures': [
      [
        '?abortInfo'
      ]
    ]
  },
  {
    'name': 'abortReading',
    'signatures': [
      [
        '?abortInfo'
      ]
    ]
  },
  {
    'name': 'setDatagramWritableQueueExpirationDuration',
    'signatures': [
      [
        'ms'
      ]
    ]
  },
  {
    'name': 'selectConfiguration',
    'signatures': [
      [
        'configurationValue'
      ]
    ]
  },
  {
    'name': 'claimInterface',
    'signatures': [
      [
        'interfaceNumber'
      ]
    ]
  },
  {
    'name': 'releaseInterface',
    'signatures': [
      [
        'interfaceNumber'
      ]
    ]
  },
  {
    'name': 'selectAlternateInterface',
    'signatures': [
      [
        'interfaceNumber',
        'alternateSetting'
      ]
    ]
  },
  {
    'name': 'controlTransferIn',
    'signatures': [
      [
        'setup',
        'length'
      ]
    ]
  },
  {
    'name': 'controlTransferOut',
    'signatures': [
      [
        'setup',
        '?data'
      ]
    ]
  },
  {
    'name': 'clearHalt',
    'signatures': [
      [
        'direction',
        'endpointNumber'
      ]
    ]
  },
  {
    'name': 'transferIn',
    'signatures': [
      [
        'endpointNumber',
        'length'
      ]
    ]
  },
  {
    'name': 'transferOut',
    'signatures': [
      [
        'endpointNumber',
        'data'
      ]
    ]
  },
  {
    'name': 'isochronousTransferIn',
    'signatures': [
      [
        'endpointNumber',
        'packetLengths'
      ]
    ]
  },
  {
    'name': 'isochronousTransferOut',
    'signatures': [
      [
        'endpointNumber',
        'data',
        'packetLengths'
      ]
    ]
  },
  {
    'name': 'getPose',
    'signatures': [
      [
        'relative_to'
      ]
    ]
  },
  {
    'name': 'getOffsetReferenceSpace',
    'signatures': [
      [
        'originOffset'
      ]
    ]
  },
  {
    'name': 'supportsSession',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'isSessionSupported',
    'signatures': [
      [
        'mode'
      ]
    ]
  },
  {
    'name': 'requestSession',
    'signatures': [
      [
        'mode',
        '?options'
      ]
    ]
  },
  {
    'name': 'getReflectionCubeMap',
    'signatures': [
      [
        'lightProbe'
      ]
    ]
  },
  {
    'name': 'getCameraImage',
    'signatures': [
      [
        'camera'
      ]
    ]
  },
  {
    'name': 'getDepthInformation',
    'signatures': [
      [
        'view'
      ]
    ]
  },
  {
    'name': 'getViewport',
    'signatures': [
      [
        'view'
      ]
    ]
  },
  {
    'name': 'getNativeFramebufferScaleFactor',
    'signatures': [
      [
        'session'
      ]
    ]
  },
  {
    'name': 'assert',
    'signatures': [
      [
        '?condition',
        '...data'
      ]
    ]
  },
  {
    'name': 'debug',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'dir',
    'signatures': [
      [
        'item',
        '?options'
      ]
    ]
  },
  {
    'name': 'dirxml',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'group',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'groupCollapsed',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'info',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'log',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'profile',
    'signatures': [
      [
        '?title'
      ]
    ]
  },
  {
    'name': 'profileEnd',
    'signatures': [
      [
        '?title'
      ]
    ]
  },
  {
    'name': 'table',
    'signatures': [
      [
        '...tabularData'
      ]
    ]
  },
  {
    'name': 'time',
    'signatures': [
      [
        '?label'
      ]
    ]
  },
  {
    'name': 'timeEnd',
    'signatures': [
      [
        '?label'
      ]
    ]
  },
  {
    'name': 'timeStamp',
    'signatures': [
      [
        '?name'
      ]
    ]
  },
  {
    'name': 'trace',
    'signatures': [
      [
        '...data'
      ]
    ]
  },
  {
    'name': 'warn',
    'signatures': [
      [
        '...data'
      ]
    ]
  }
];
