// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ts from 'typescript';

import {valueForTypeNode} from './value_for_type_node';
import {WalkerState} from './walk_tree';

export const generateCreatorFunction = (state: WalkerState): string[] => {
  const componentClassName = state.componentClass.name.escapedText.toString();

  const customElementTagArgument =
      (state.customElementsDefineCall.expression as ts.CallExpression).arguments[0] as ts.StringLiteral;
  const customElementTagName = customElementTagArgument.text;
  const componentClassCamelCased = componentClassName[0].toUpperCase() + componentClassName.slice(1);

  const interfaceName = generatedClassInterfaceName(state.componentClass);

  const output: string[] = [
    '/**',
    '* @suppressGlobalPropertiesCheck',
    `* @return {!${interfaceName}}`,
    '*/',
    `export function create${componentClassCamelCased}() {`,
    `  return /** @type {!${interfaceName}} */  (document.createElement('${customElementTagName}'))`,
    '}',
  ];
  return output;
};

const generatedClassInterfaceName = (componentClass: ts.ClassDeclaration): string => {
  const className = componentClass.name && componentClass.name.escapedText;
  // the name needs to differ from the TypeScript name
  return `${className}ClosureInterface`;
};

export const generateClosureClass = (state: WalkerState): string[] => {
  const customElementClass = state.componentClass;
  const output: string[] = [];
  const className = customElementClass.name && customElementClass.name.escapedText;
  // the name needs to differ from the TypeScript name
  output.push(`class ${className}ClosureInterface extends HTMLElement {`);

  state.publicMethods.forEach(method => {
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
      throw new Error(`Could not find interface: ${interfaceName}`);
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

interface GeneratedCode {
  interfaces: string[][];
  closureClass: string[];
  creatorFunction: string[];
}

export const generateClosureBridge = (state: WalkerState): GeneratedCode => {
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

  const result: GeneratedCode = {
    interfaces: generateInterfaces(state),
    closureClass: generateClosureClass(state),
    creatorFunction: generateCreatorFunction(state),
  };

  return result;
};
