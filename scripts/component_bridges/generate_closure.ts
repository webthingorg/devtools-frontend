// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ts from 'typescript';

import {valueForTypeNode} from './value_for_type_node';
import {WalkerState} from './walk_tree';

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

export const generateInterfaces = (state: WalkerState): Array<string[]> => {
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

  interfacesToConvert.forEach(interfaceName => {
    const interfaceDec = Array.from(state.foundInterfaces).find(dec => {
      return dec.name.escapedText === interfaceName;
    });

    if (!interfaceDec) {
      // TODO: throw an error?
      return;
    }

    const interfaceBits: string[] = [];
    interfaceBits.push('/**');
    interfaceBits.push('* @typedef {{');
    interfaceBits.push(...generateInterfaceMembers(interfaceDec.members));
    interfaceBits.push('* }}');
    interfaceBits.push('*/');
    interfaceBits.push('// @ts-ignore we export this for Closure not TS');
    interfaceBits.push(`export let ${interfaceName}`);
    interfaceBits.push('\n');

    finalCode.push(interfaceBits);
  });

  return finalCode;
};

export const generateClosureBridge = (state: WalkerState) => {
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

  const finalCode: Array<string[]> = [
    ...generateInterfaces(state),
  ];

  if (!state.componentClass) {
    throw new Error('did not find the component');
  }
  finalCode.push(generateKlass(state.componentClass, state.publicMethods));

  // finalCode.push(generateCreatorFunction(state));

  console.log('finalcode', finalCode);
};
