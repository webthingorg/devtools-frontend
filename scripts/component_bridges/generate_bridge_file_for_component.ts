// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as path from 'path';
import * as ts from 'typescript';

interface WalkerState {
  foundInterfaces: Set<ts.InterfaceDeclaration>;
  componentClass?: ts.ClassDeclaration, publicMethods: Set<ts.MethodDeclaration>,
      customElementsDefineCall?: ts.ExpressionStatement,
}

const defaultState: WalkerState = {
  foundInterfaces: new Set(),
  publicMethods: new Set(),
  componentClass: undefined,
  customElementsDefineCall: undefined,
};

const walkTree = (node: ts.Node, state: WalkerState = defaultState) => {
  if (ts.isClassDeclaration(node)) {
    const classNode = node as ts.ClassDeclaration;
    const extendsHtmlElement = classNode.heritageClauses ? classNode.heritageClauses.find(clause => {
      return clause.types.find(clauseType => {
        if (ts.isIdentifier(clauseType.expression)) {
          return clauseType.expression.escapedText === 'HTMLElement';
        }
        return false;
      });
    }) :
                                                           false;

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
    const expression = node.expression;
    let text;
    try {
      text = expression.getText();
    } catch {
      text = '';
    }
    if (text.startsWith('customElements.define')) {
      state.customElementsDefineCall = node;
    }
  }

  node.forEachChild(node => {
    walkTree(node, state);
  });

  return state;
};

const valueForTypeNode = (node: ts.TypeNode): string => {
  let value = 'tbc';

  if (ts.isTypeReferenceNode(node)) {
    // TODO: what if value is optional?
    value = (node.typeName as ts.Identifier).escapedText as string;
  } else if (ts.isArrayTypeNode(node)) {
    // TODO: hardcoding ! here is bad?
    value = `Array.<!${valueForTypeNode(node.elementType)}>`;
  } else if (node.kind === ts.SyntaxKind.NumberKeyword) {
    value = 'number';
  } else if (node.kind === ts.SyntaxKind.StringKeyword) {
    value = 'string';
  } else if (node.kind === ts.SyntaxKind.UnknownKeyword || node.kind === ts.SyntaxKind.AnyKeyword) {
    value = '*';
  } else if (node.kind === ts.SyntaxKind.VoidKeyword) {
    value = 'void';
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
  }

  return value;
};

const generateBridgeFromState = (state: WalkerState) => {
  const interfacesToConvert = new Set<string>();

  state.publicMethods.forEach(method => {
    method.parameters.forEach(param => {
      if (!param.type) {
        return;
      }
      if (ts.isArrayTypeNode(param.type) && ts.isTypeReferenceNode(param.type.elementType) &&
          ts.isIdentifier(param.type.elementType.typeName)) {
        interfacesToConvert.add(param.type.elementType.typeName.escapedText as string);

      } else {
        if (ts.isTypeReferenceNode(param.type) && ts.isIdentifier(param.type.typeName)) {
          interfacesToConvert.add(param.type.typeName.escapedText as string);
        }
      }
    });
  });
  const finalCode: Array<string[]> = [];

  const generateInterfaceMembers = (members: ts.NodeArray<ts.TypeElement>): string[] => {
    const output: string[] = [];


    members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const keyIdentifer = member.name as ts.Identifier;
        // typedefs don't need the explicit ! to mark non-optional
        const optionalModifier = member.questionToken ? '?' : '';
        const keyName = keyIdentifer.escapedText;
        if (!member.type) {
          return;
        }

        const value = valueForTypeNode(member.type);
        output.push(`* ${keyName}:${optionalModifier}${value}`);
      }
    });

    return output;
  };

  interfacesToConvert.forEach(interfaceName => {
    const interfaceDec = Array.from(state.foundInterfaces).find(dec => {
      return dec.name.escapedText === interfaceName;
    });

    if (!interfaceDec) {
      // this would throw an error
      return;
    }

    const interfaceBits: string[] = [];
    interfaceBits.push('/**');
    interfaceBits.push('* @typedef {{');
    interfaceBits.push(...generateInterfaceMembers(interfaceDec.members));
    interfaceBits.push('* }}');
    interfaceBits.push('*/');
    interfaceBits.push('@ts-ignore we export this for Closure not TS');
    interfaceBits.push(`export let ${interfaceName}`);

    finalCode.push(interfaceBits);
  });

  if (!state.componentClass) {
    throw new Error('did not find the component');
  }
  finalCode.push(generateKlass(state.componentClass, state.publicMethods));

  // finalCode.push(generateCreatorFunction(state));

  console.log('finalcode', finalCode);
};

const generateKlass = (klass: ts.ClassDeclaration, publicMethods: Set<ts.MethodDeclaration>) => {
  const output = [];
  console.log('here', klass);
  const className = klass.name && klass.name.escapedText;
  // the name needs to differ from the TypeScript name
  output.push(`class ${className}ClosureInterface extends HTMLElement {`);

  publicMethods.forEach(method => {
    let methodName = '';
    if (ts.isIdentifier(method.name)) {
      methodName = method.name.escapedText as string;
    }

    const argsForFunc = method.parameters
                            .map(param => {
                              return (param.name as ts.Identifier).escapedText as string;
                            })
                            .join(', ');

    const jsDocForFunc = ['/**'];
    method.parameters.forEach(param => {
      const paramName = (param.name as ts.Identifier).escapedText as string;
      const paramValue = valueForTypeNode(param.type!);
      const paramOptionalModifier = !!param.questionToken ? '?' : '!';
      jsDocForFunc.push(`* @param {${paramOptionalModifier}${paramValue}} ${paramName}`);
    });

    jsDocForFunc.push('*/');

    output.push(jsDocForFunc.join('\n'));
    output.push(`${methodName}(${argsForFunc}) {}`);
    output.push('\n');
  });
  output.push('}');
  return output;
};

const bridgeForComponent = (componentPath: string) => {
  const rootDir = path.resolve(path.join(__dirname, '..', 'tests'));
  const componentSourceFile = path.resolve(rootDir, componentPath);

  const compilerHost = ts.createCompilerHost({
    rootDir,
    target: ts.ScriptTarget.ESNext,
  });

  const program = ts.createProgram(
      [componentSourceFile], {
        rootDir: rootDir,
      },
      compilerHost);

  const files = program.getSourceFiles().filter(f => f.fileName.includes('node_modules') === false);

  const originalFile = files.find(f => f.fileName === componentSourceFile);

  if (!originalFile) {
    return;
  }

  const state = walkTree(originalFile);
  generateBridgeFromState(state);
  // console.log('final state', state)
};

bridgeForComponent(path.join('..', 'tests', 'component.ts'));
