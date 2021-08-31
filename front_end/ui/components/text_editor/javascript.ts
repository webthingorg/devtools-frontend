// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../../../core/sdk/sdk.js';
import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
import * as UI from '../../legacy/legacy.js';

export const completion = CodeMirror.javascriptLanguage.data.of({
  autocomplete: javascriptCompletionSource,
});

class CompletionSet {
  completions: CodeMirror.Completion[] = [];
  seen: {[label: string]: boolean} = Object.create(null);

  add(completion: CodeMirror.Completion): void {
    if (!this.seen[completion.label]) {
      this.seen[completion.label] = true;
      this.completions.push(completion);
    }
  }

  copy(): CompletionSet {
    const result = new CompletionSet();
    result.completions = this.completions.slice();
    for (const c of this.completions) {
      result.seen[c.label] = true;
    }
    return result;
  }
}

const javascriptKeywords = [
  'async',  'await',      'break',  'case',   'catch',   'class',   'const',  'continue', 'debugger', 'default',
  'delete', 'do',         'else',   'export', 'extends', 'finally', 'for',    'function', 'if',       'import',
  'in',     'instanceof', 'let',    'new',    'of',      'return',  'static', 'super',    'switch',   'this',
  'throw',  'try',        'typeof', 'var',    'void',    'while',   'with',   'yield',
];
const consoleBuiltinFunctions = [
  'dir',
  'dirxml',
  'keys',
  'values',
  'profile',
  'profileEnd',
  'monitorEvents',
  'unmonitorEvents',
  'inspect',
  'copy',
  'clear',
  'getEventListeners',
  'debug',
  'undebug',
  'monitor',
  'unmonitor',
  'table',
  'queryObjects',
];
const consoleBuiltinVariables = ['$', '$$', '$x', '$0', '$_'];

const baseCompletions = new CompletionSet();
for (const kw of javascriptKeywords) {
  baseCompletions.add({label: kw, type: 'keyword'});
}
for (const builtin of consoleBuiltinFunctions) {
  baseCompletions.add({label: builtin, type: 'function'});
}
for (const varName of consoleBuiltinVariables) {
  baseCompletions.add({label: varName, type: 'variable'});
}

const dontCompleteIn = [
  'TemplateString',
  'LineComment',
  'BlockComment',
  'TypeDefinition',
  'VariableDefinition',
  'PropertyDefinition',
  'TypeName',
];

// FIXME Implement Map property completion?
const enum QueryType {
  Expression = 0,
  PropertyName = 1,
  PropertyExpression = 2,
}

function getQueryType(tree: CodeMirror.Tree, pos: number): {
  type: QueryType,
  from?: number,
  relatedNode?: CodeMirror.SyntaxNode,
}|null {
  let node = tree.resolveInner(pos, -1);
  const parent = node.parent;
  if (dontCompleteIn.includes(node.name)) {
    return null;
  }

  if (node.name === 'VariableName') {
    return {type: QueryType.Expression, from: node.from};
  }
  if (node.name === 'PropertyName') {
    return parent?.name !== 'MemberExpression' ? null :
                                                 {type: QueryType.PropertyName, from: node.from, relatedNode: parent};
  }
  if (node.name === 'String') {
    const parent = node.parent;
    return parent?.name === 'MemberExpression' && parent.childBefore(node.from)?.name === '[' ?
        {type: QueryType.PropertyExpression, from: node.from, relatedNode: parent} :
        null;
  }
  // Enter unfinished nodes before the position
  for (;;) {
    const before = node.childBefore(Math.min(pos, node.to));
    if (before?.lastChild?.type.isError) {
      node = before;
    } else {
      break;
    }
  }
  // Normalize to parent node when pointing after a child of a member expr
  if (node.to === pos && node.parent?.name === 'MemberExpression') {
    node = node.parent;
  }
  if (node.name === 'MemberExpression') {
    const before = node.childBefore(Math.min(pos, node.to));
    if (before?.name === '[') {
      return {type: QueryType.PropertyExpression, relatedNode: node};
    }
    if (before?.name === '.' || before?.name === '?.') {
      return {type: QueryType.PropertyName, relatedNode: node};
    }
  }
  return {type: QueryType.Expression};
}

async function javascriptCompletionSource(cx: CodeMirror.CompletionContext): Promise<CodeMirror.CompletionResult|null> {
  const query = getQueryType(CodeMirror.syntaxTree(cx.state), cx.pos);
  if (!query || query.from === undefined && !cx.explicit) {
    return null;
  }

  let result: CompletionSet;
  if (query.type === QueryType.Expression) {
    const [scope, global] = await Promise.all([
      completeExpressionInScope(),
      completeExpressionGlobal(),
    ]);
    if (scope.completions.length) {
      result = scope;
      for (const r of global.completions) {
        result.add(r);
      }
    } else {
      result = global;
    }
  } else if (query.type === QueryType.PropertyName || query.type === QueryType.PropertyExpression) {
    const objectExpr = (query.relatedNode as CodeMirror.SyntaxNode).getChild('Expression');
    let quote = undefined;
    if (query.type === QueryType.PropertyExpression) {
      quote = query.from === undefined ? '\'' : cx.state.sliceDoc(query.from, query.from + 1);
    }
    if (!objectExpr) {
      return null;
    }
    result = await completeProperties(cx.state.sliceDoc(objectExpr.from, objectExpr.to), quote);
  } else {
    return null;
  }
  return {
    from: query.from ?? cx.pos,
    options: result.completions,
    span: /^[\w_\u008F-\uFFFF]*/,
  };
}

function getExecutionContext(): SDK.RuntimeModel.ExecutionContext|null {
  return UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
}

async function evaluateExpression(
    context: SDK.RuntimeModel.ExecutionContext,
    expression: string,
    group: string,
    ): Promise<SDK.RemoteObject.RemoteObject|null> {
  const result = await context.evaluate(
      {
        expression,
        objectGroup: group,
        includeCommandLineAPI: true,
        silent: true,
        returnByValue: false,
        generatePreview: false,
        throwOnSideEffect: true,
        timeout: 500,
      },
      false, false);
  if ('error' in result || result.exceptionDetails || !result.object) {
    return null;
  }
  return result.object;
}

const primitivePrototypes: {[name: string]: string} = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  bigint: 'BigInt',
};

const maxCacheAge = 30000;

let cacheInstance: PropertyCache|null = null;

// Store recent collections of property completions. The empty string
// is used to store the set of global bindings.
class PropertyCache {
  private readonly cache: Map<string, Promise<CompletionSet>> = new Map();

  constructor() {
    const clear = (): void => this.cache.clear();
    SDK.ConsoleModel.ConsoleModel.instance().addEventListener(SDK.ConsoleModel.Events.CommandEvaluated, clear);
    UI.Context.Context.instance().addFlavorChangeListener(SDK.RuntimeModel.ExecutionContext, clear);
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.DebuggerResumed, clear);
    SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.DebuggerPaused, clear);
  }

  get(expression: string): Promise<CompletionSet>|undefined {
    return this.cache.get(expression);
  }

  set(expression: string, value: Promise<CompletionSet>): void {
    this.cache.set(expression, value);
    setTimeout(() => {
      if (this.cache.get(expression) === value) {
        this.cache.delete(expression);
      }
    }, maxCacheAge);
  }

  static instance(): PropertyCache {
    if (!cacheInstance) {
      cacheInstance = new PropertyCache();
    }
    return cacheInstance;
  }
}

async function completeProperties(
    expression: string,
    quoted?: string,
    ): Promise<CompletionSet> {
  const cache = PropertyCache.instance();
  if (!quoted) {
    const cached = cache.get(expression);
    if (cached) {
      return cached;
    }
  }
  const context = getExecutionContext();
  if (!context) {
    return new CompletionSet();
  }
  const result = completePropertiesInner(expression, context, quoted);
  if (!quoted) {
    cache.set(expression, result);
  }
  return result;
}

async function completePropertiesInner(
    expression: string,
    context: SDK.RuntimeModel.ExecutionContext,
    quoted?: string,
    ): Promise<CompletionSet> {
  const result = new CompletionSet();
  if (!context) {
    return result;
  }
  let object = await evaluateExpression(context, expression, 'completion');
  if (!object) {
    return result;
  }

  while (object.type === 'object' && object.subtype === 'proxy') {
    const properties = await object.getOwnProperties(false);
    const innerObject = properties.internalProperties?.find(p => p.name === '[[Target]]')?.value;
    if (!innerObject) {
      break;
    }
    object = innerObject as SDK.RemoteObject.RemoteObject;
  }

  const toPrototype = object.subtype === 'array' ?
      'Array' :
      object.subtype === 'typedarray' ? 'Uint8Array' : primitivePrototypes[object.type];
  if (toPrototype) {
    object = await evaluateExpression(context, toPrototype + '.prototype', 'completion');
  }

  const functionType = expression === 'window' ? 'function' : 'method';
  const otherType = expression === 'window' ? 'variable' : 'property';
  if (object && (object.type === 'object' || object.type === 'function')) {
    const properties = await object.getAllProperties(false, false);
    const isFunction = object.type === 'function';
    for (const prop of properties.properties || []) {
      if (!prop.symbol && !(isFunction && (prop.name === 'arguments' || prop.name === 'caller'))) {
        const label = quoted ? quoted + prop.name + quoted : prop.name;
        const completion: CodeMirror.Completion = {
          label,
          type: prop.value?.type === 'function' ? functionType : otherType,
        };
        if (quoted) {
          completion.apply = label + ']';
        }
        if (!prop.isOwn) {
          completion.boost = -80;
        }
        result.add(completion);
      }
    }
  }

  context.runtimeModel.releaseObjectGroup('completion');
  return result;
}

async function completeExpressionInScope(): Promise<CompletionSet> {
  const result = new CompletionSet();
  const selectedFrame = getExecutionContext()?.debuggerModel.selectedCallFrame();
  if (!selectedFrame) {
    return result;
  }

  const frames =
      await Promise.all(selectedFrame.scopeChain().map(scope => scope.object().getAllProperties(false, false)));
  for (const frame of frames) {
    for (const property of frame.properties || []) {
      result.add({
        label: property.name,
        type: property.value?.type === 'function' ? 'function' : 'variable',
      });
    }
  }
  return result;
}

async function completeExpressionGlobal(): Promise<CompletionSet> {
  const cache = PropertyCache.instance();
  const cached = cache.get('');
  if (cached) {
    return cached;
  }

  const result = baseCompletions.copy();
  const context = getExecutionContext();
  if (!context) {
    return result;
  }

  const fetchNames = completePropertiesInner('window', context).then(result => {
    return context.globalLexicalScopeNames().then(globals => {
      for (const name of globals || []) {
        result.add({label: name, type: 'variable'});
      }
      return result;
    });
  });
  cache.set('', fetchNames);
  return fetchNames;
}

export function isExpressionComplete(state: CodeMirror.EditorState): boolean {
  for (let cursor = CodeMirror.syntaxTree(state).cursor(); cursor.next();) {
    if (cursor.type.isError) {
      return false;
    }
  }
  return true;
}
