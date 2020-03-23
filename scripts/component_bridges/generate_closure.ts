// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ts from 'typescript';

import {nodeIsPrimitive, valueForTypeNode} from './value_for_type_node';
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
    `* @return {!${interfaceName}}`,
    '*/',
    `export function create${componentClassCamelCased}() {`,
    `  return /** @type {!${interfaceName}} */  (document.createElement('${customElementTagName}'));`,
    '}',
  ];
  return output;
};

const generatedClassInterfaceName = (componentClass: ts.ClassDeclaration): string => {
  const className = componentClass.name && componentClass.name.escapedText;
  // the name needs to differ from the TypeScript name
  return `${className}ClosureInterface`;
};

const indent = (str: string, amountOfSpaces: number): string => {
  let newLine = '';
  for (let i = 0; i < amountOfSpaces; i++) {
    newLine += ' ';
  }
  return newLine + str;
};

const paramIsMarkedAsOptionalOrRequired = (param: string) => {
  const startChars = ['!', '?'];
  return startChars.some(c => param.startsWith(c));
};

export const generateClosureClass = (state: WalkerState): string[] => {
  const customElementClass = state.componentClass;
  const output: string[] = [];
  const generatedClassName = generatedClassInterfaceName(customElementClass);
  // the line is used as a Closure typedoc so it is used
  output.push('// eslint-disable-next-line no-unused-vars');
  output.push(`class ${generatedClassName} extends HTMLElement {`);

  state.publicMethods.forEach(method => {
    let methodName = '';
    if (ts.isIdentifier(method.name)) {
      methodName = method.name.escapedText.toString();
    }

    const argsForFunc = method.parameters
                            .map(param => {
                              return (param.name as ts.Identifier).escapedText.toString();
                            })
                            .join(', ');

    let jsDocForFunc = ['/**'];
    method.parameters.forEach(param => {
      const paramName = (param.name as ts.Identifier).escapedText.toString();
      const paramValue = valueForTypeNode(param.type, true);

      /* the rules for ? or ! inside params are subtle when we are given
       * an interface that's optional in TypeScript land we need to tell
       * Closure that it's optional _but not nullable_.?Foo in Closure
       * would let Foo be null so instead we go for {!Foo=} which states
       * it's optional but not nullable. but note that if we pass a
       * union of Foo | Null, that should become {?Foo}, which is dealt
       * with within valueForTypeNode().
       *
       * additionally, primitive optionals in TS aren't as
       * straightforward as throwing a ? on it as that makes it
       * nullable, not optional
       *
       * we also don't need a ! at the start of primitive non-optional
       * types, but do need the ! at the start of non-optional
       * interfaces
       *
       * TS                    <|> Closure
       * person?: Person       <|> {!Person=}
       * person: Person | null <|> {?Person}
       * name?: string         <|> {(string|undefined)=}
       */

      // TODO: we might need these semantics for an array of types too
      if (ts.isTypeReferenceNode(param.type)) {
        const paramOptional = !!param.questionToken;
        const paramString = ['!', paramValue, paramOptional ? '=' : ''].join('');
        jsDocForFunc.push(`* @param {${paramString}} ${paramName}`);

      } else {
        /* valueForTypeNode() may have added a ! or ?
       * in which case we don't need to
       */
        const needsOptionalModifier = paramIsMarkedAsOptionalOrRequired(paramValue) === false;

        const paramIsOptional = !!param.questionToken;

        if (paramIsOptional) {
          const paramString = ['(', paramValue, '|', 'undefined', ')='].join('');
          jsDocForFunc.push(`* @param {${paramString}} ${paramName}`);
        } else {
          let paramOptionalModifier = '';
          if (needsOptionalModifier) {
            if (!!param.questionToken) {
              paramOptionalModifier = '?';
            } else if (nodeIsPrimitive(param.type)) {
              // as noted above, primitive types don't need an explicit !
              // when they are required
              paramOptionalModifier = '';
            } else {
              paramOptionalModifier = '!';
            }
          }

          jsDocForFunc.push(`* @param {${paramOptionalModifier}${paramValue}} ${paramName}`);
        }
      }
    });

    jsDocForFunc.push('*/');
    jsDocForFunc = jsDocForFunc.map(line => indent(line, 2));

    output.push(jsDocForFunc.join('\n'));
    output.push(indent(`${methodName}(${argsForFunc}) {}`, 2));
  });
  output.push('}');
  return output;
};


const generateInterfaceMembers = (members: ts.NodeArray<ts.TypeElement>): string[] => {
  const output: string[] = [];

  members.forEach(member => {
    if (ts.isPropertySignature(member)) {
      if (!member.type) {
        throw new Error(`Interface member ${ts.SyntaxKind[member.kind]} did not have a type key, aborting.`);
      }

      const keyIdentifer = member.name as ts.Identifier;

      const memberIsOptional = !!member.questionToken;

      const keyName = keyIdentifer.escapedText;
      let nodeValue = valueForTypeNode(member.type);

      if (memberIsOptional) {
        if (nodeIsPrimitive(member.type)) {
          nodeValue = `(${nodeValue}|undefined)`;
        } else {
          nodeValue = `(!${nodeValue}|undefined)`;
        }
      }

      output.push(`* ${keyName}:${nodeValue}`);
    }
  });

  return output;
};

export const generateInterfaces = (state: WalkerState): Array<string[]> => {
  const finalCode: Array<string[]> = [];

  state.interfaceNamesToConvert.forEach(interfaceName => {
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
    interfaceBits.push(`export let ${interfaceName}; // eslint-disable-line no-unused-vars`);

    finalCode.push(interfaceBits);
  });

  return finalCode;
};

export interface GeneratedCode {
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
