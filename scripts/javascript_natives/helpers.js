// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

let methods = {__proto__: null};

export function clearState() {
  methods = {__proto__: null};
}

export function parseTSFunction(func, node) {
  if (!func.name.escapedText) {
    return;
  }

  const args = func.parameters
                   .map(p => {
                     let text = p.name.escapedText;
                     if (p.questionToken) {
                       text = '?' + text;
                     }
                     if (p.dotDotDotToken) {
                       text = '...' + text;
                     }
                     return text;
                   })
                   .filter(x => x !== 'this');
  storeMethod(node.name.text, func.name.escapedText, args);
}

/**
 * @param {WebIDL2.IDLRootType} thing
 * */
export function walkRoot(thing) {
  switch (thing.type) {
    case 'interface':
      walkInterface(thing);
      break;
    case 'namespace':
      walkNamespace(thing);
      break;
  }
  // if (thing.members) {
  //   for (const member of thing.members) {
  //     walk(member, thing);
  //   }
  // }
}

// /**
//  * @param {WebIDL2.CallbackInterfaceType} thing
//  * */
// function walkCallBackInterface(thing) {
// }

// /**
//  * @param {WebIDL2.DictionaryType} thing
//  * */
// function walkDictionary(thing) {
// }

// /**
//  * @param {WebIDL2.InterfaceMixinType} thing
//  * */
// function walkInterfaceMixin(thing) {
// }

/**
 * @param {WebIDL2.InterfaceType} thing
 * */
function walkInterface(thing) {
  // const constructor = thing.extAttrs.find(extAttr => extAttr.name === 'Constructor');
  const constructor = thing.members.find(member => member.type === 'constructor');
  if (constructor && constructor.arguments && thing.extAttrs.find(extAttr => extAttr.name === 'Exposed')) {
    return storeMethod('Window', thing.name, constructor.arguments.map(argName));
  }

  const namedConstructor = thing.extAttrs.find(extAttr => extAttr.name === 'NamedConstructor');
  if (namedConstructor && namedConstructor.arguments) {
    return storeMethod('Window', namedConstructor.rhs.value, namedConstructor.arguments.map(argName));
  }
}

/**
 * @param {WebIDL2.NamespaceType} thing
 * */
function walkNamespace(thing) {
  thing.members.forEach(member => {
    if (member.type === 'operation') {
      handleOperation(member);
    }
  });
}

/**
 * @param {WebIDL2.OperationMemberType} member
 * */
function handleOperation(member) {
  storeMethod(
      member.special === 'static' ? (parent.name + 'Constructor') : member.parent.name, member.name,
      member.arguments.map(argName));
}

function argName(a) {
  let name = a.name;
  if (a.optional) {
    name = '?' + name;
  }
  if (a.variadic) {
    name = '...' + name;
  }
  return name;
}

function storeMethod(parent, name, args) {
  if (!methods[name]) {
    methods[name] = {__proto__: null};
  }
  if (!methods[name][parent]) {
    methods[name][parent] = [];
  }
  methods[name][parent].push(args);
}

export function postProcess(dryRun = false) {
  for (const name in methods) {
    // We use the set jsonParents to track the set of different signatures across parent for this function name.
    // If all signatures are identical, we leave out the parent and emit a single NativeFunction entry without receiver.
    const jsonParents = new Set();
    for (const parent in methods[name]) {
      const signatures = methods[name][parent];
      signatures.sort((a, b) => a.length - b.length);
      const filteredSignatures = [];
      for (const signature of signatures) {
        const smallerIndex = filteredSignatures.findIndex(smaller => startsTheSame(smaller, signature));
        if (smallerIndex !== -1) {
          filteredSignatures[smallerIndex] = (signature.map((arg, index) => {
            const otherArg = filteredSignatures[smallerIndex][index];
            if (otherArg) {
              return otherArg.length > arg.length ? otherArg : arg;
            }
            if (arg.startsWith('?') || arg.startsWith('...')) {
              return arg;
            }
            return '?' + arg;
          }));
        } else {
          filteredSignatures.push(signature);
        }
      }

      function startsTheSame(smaller, bigger) {
        for (let i = 0; i < smaller.length; i++) {
          const withoutQuestion = str => /[\?]?(.*)/.exec(str)[1];
          if (withoutQuestion(smaller[i]) !== withoutQuestion(bigger[i])) {
            return false;
          }
        }
        return true;
      }

      methods[name][parent] = filteredSignatures;
      jsonParents.add(JSON.stringify(filteredSignatures));
    }
    // If all parents had the same signature for this name, we put a `*` as parent for this entry.
    if (jsonParents.size === 1) {
      methods[name] = {'*': JSON.parse(jsonParents.values().next().value)};
    }
    for (const parent in methods[name]) {
      const signatures = methods[name][parent];
      if (signatures.length === 1 && !signatures[0].length) {
        delete methods[name][parent];
      }
    }
    if (!Object.keys(methods[name]).length) {
      delete methods[name];
    }
  }
  const functions = [];
  for (const name in methods) {
    if (methods[name]['*']) {
      // All parents had the same signature so we emit an entry without receiver.
      functions.push({name, signatures: methods[name]['*']});
    } else {
      for (const parent in methods[name]) {
        if (parent.endsWith('Constructor')) {
          functions.push({
            name,
            signatures: methods[name][parent],
            static: true,
            receiver: parent.substring(0, parent.length - 'Constructor'.length)
          });
        } else {
          functions.push({name, signatures: methods[name][parent], receiver: parent});
        }
      }
    }
  }
  const output = `export const NativeFunctions = ${JSON.stringify(functions, null, 2)};`;

  if (dryRun) {
    return output;
  }

  fs.writeFileSync(
      (new URL('../../front_end/models/javascript_metadata/NativeFunctions.js', import.meta.url)).pathname,
      `// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// Generated from ${
          path.relative(path.join(fileURLToPath(import.meta.url), '..', '..'), fileURLToPath(import.meta.url))}

${output}
`);
}
