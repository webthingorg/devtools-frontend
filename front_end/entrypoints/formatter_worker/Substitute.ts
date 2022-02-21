// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Acorn from '../../third_party/acorn/acorn.js';

import {ECMA_VERSION} from './AcornTokenizer.js';

export interface Replacement {
  from: string;
  to: string;
  offset: number;
  isShorthandAssignmentProperty: boolean;
}

export function computeSubstitution(expression: string, nameMap: Map<string, string>): Replacement[]|null {
  // Parse the expression and find variables and scopes.
  const root = Acorn.parse(expression, {ecmaVersion: ECMA_VERSION, allowAwaitOutsideFunction: true, ranges: false}) as
      Acorn.ESTree.Node;
  const scopeVariables = new ScopeVariableAnalysis();
  scopeVariables.processNode(root);
  const freevariables = scopeVariables.getFreeVariables();
  const result: Replacement[] = [];

  // Prepare the machinery for generating fresh names (to avoid variable captures).
  const allNames = scopeVariables.getAllNames();
  for (const rename of nameMap.values()) {
    allNames.add(rename);
  }
  function getNewName(base: string): string {
    let i = 1;
    while (allNames.has(`${base}_${i}`)) {
      i++;
    }
    const newName = `${base}_${i}`;
    allNames.add(newName);
    return newName;
  }

  // Perform the substitutions.
  for (const [name, rename] of nameMap.entries()) {
    const defUse = freevariables.get(name);
    if (defUse) {
      const binders = [];
      for (const use of defUse) {
        result.push({
          from: name,
          to: rename,
          offset: use.offset,
          isShorthandAssignmentProperty: use.isShorthandAssignmentProperty,
        });
        binders.push(...use.scope.findBinders(rename));
      }
      // If there is a capturing binder, rename the bound variable.
      for (const binder of binders) {
        const newName = getNewName(rename);
        for (const use of binder.uses) {
          result.push({
            from: rename,
            to: newName,
            offset: use.offset,
            isShorthandAssignmentProperty: use.isShorthandAssignmentProperty,
          });
        }
      }
    }
  }
  result.sort((l, r) => l.offset - r.offset);
  return result;
}

export function applySubstitution(expression: string, replacements: Replacement[]|null): string {
  if (!replacements) {
    return expression;
  }
  const accumulator = [];
  let last = 0;
  for (const r of replacements) {
    accumulator.push(expression.slice(last, r.offset));
    let replacement = r.to;
    if (r.isShorthandAssignmentProperty) {
      // Let us expand the shorthand to full assignment.
      replacement = `${r.from}: ${r.to}`;
    }
    accumulator.push(replacement);
    last = r.offset + r.from.length;
  }
  accumulator.push(expression.slice(last));
  return accumulator.join('');
}

interface Use {
  offset: number;
  scope: Scope;
  isShorthandAssignmentProperty: boolean;
}

const enum DefinitionKind {
  None = 0,
  Let = 1,
  Var = 2,
}

interface DefUses {
  definitionKind: DefinitionKind;
  uses: Use[];
}

class Scope {
  readonly variables = new Map<string, DefUses>();
  readonly parent: Scope|null;

  constructor(parent: Scope|null) {
    this.parent = parent;
  }

  addUse(name: string, offset: number, isShorthandAssignmentProperty: boolean): void {
    const variable = this.variables.get(name);
    const use = {offset, scope: this, isShorthandAssignmentProperty};
    if (!variable) {
      this.variables.set(name, {definitionKind: DefinitionKind.None, uses: [use]});
      return;
    }
    variable.uses.push(use);
  }

  findBinders(name: string): DefUses[] {
    const result = [];
    let scope: Scope|null = this;
    while (scope !== null) {
      const defUse = scope.variables.get(name);
      if (defUse && defUse.definitionKind !== DefinitionKind.None) {
        result.push(defUse);
      }
      scope = scope.parent;
    }
    return result;
  }

  #mergeChildDefUses(name: string, defUses: DefUses): void {
    const variable = this.variables.get(name);
    if (!variable) {
      this.variables.set(name, defUses);
      return;
    }
    variable.uses.push(...defUses.uses);
    if (defUses.definitionKind === DefinitionKind.Var) {
      console.assert(variable.definitionKind !== DefinitionKind.Let);
      variable.definitionKind = defUses.definitionKind;
    } else {
      console.assert(defUses.definitionKind === DefinitionKind.None);
    }
  }

  addDefinition(
      name: string, offset: number, definitionKind: DefinitionKind.Let|DefinitionKind.Var,
      isShorthandAssignmentProperty: boolean): void {
    const variable = this.variables.get(name);
    const use = {offset, scope: this, isShorthandAssignmentProperty};
    if (!variable) {
      this.variables.set(name, {definitionKind, uses: [use]});
      return;
    }
    variable.definitionKind = definitionKind;
    variable.uses.push(use);
  }

  finalizeToParent(isFunctionScope: boolean): void {
    if (!this.parent) {
      console.error('Internal error: wrong nesting in scope analysis.');
      return;
    }

    // Move all unbound variables to the parent.
    const keysToRemove = [];
    for (const [name, defUse] of this.variables.entries()) {
      if (defUse.definitionKind === DefinitionKind.None ||
          (defUse.definitionKind === DefinitionKind.Var && !isFunctionScope)) {
        this.parent.#mergeChildDefUses(name, defUse);
        keysToRemove.push(name);
      }
    }
    keysToRemove.forEach(k => this.variables.delete(k));
  }
}

class ScopeVariableAnalysis {
  readonly #rootScope = new Scope(null);
  readonly #allNames = new Set<string>();
  #currentScope = this.#rootScope;

  getFreeVariables(): Map<string, Use[]> {
    const result = new Map<string, Use[]>();
    for (const [name, defUse] of this.#rootScope.variables) {
      if (defUse.definitionKind !== DefinitionKind.None) {
        // Skip bound variables.
        continue;
      }
      result.set(name, defUse.uses);
    }
    return result;
  }

  getAllNames(): Set<string> {
    return this.#allNames;
  }

  #pushScope(): void {
    this.#currentScope = new Scope(this.#currentScope);
  }

  #popScope(isFunctionContext: boolean): void {
    if (this.#currentScope.parent === null) {
      console.error('Internal error in scope analysis');
      return;
    }
    this.#currentScope.finalizeToParent(isFunctionContext);
    this.#currentScope = this.#currentScope.parent;
  }

  #addUse(name: string, offset: number, isShorthandAssignmentProperty: boolean): void {
    this.#allNames.add(name);
    this.#currentScope.addUse(name, offset, isShorthandAssignmentProperty);
  }

  #addDefinition(
      name: string, offset: number, definitionKind: DefinitionKind.Let|DefinitionKind.Var,
      isShorthandAssignmentProperty: boolean): void {
    this.#allNames.add(name);
    this.#currentScope.addDefinition(name, offset, definitionKind, isShorthandAssignmentProperty);
  }

  #processNodeAsDefinition(
      definitionKind: DefinitionKind.Let|DefinitionKind.Var,
      node: Acorn.ESTree.Pattern|Acorn.ESTree.AssignmentProperty|null): void {
    if (node === null) {
      return;
    }
    switch (node.type) {
      case 'ArrayPattern':
        node.elements.forEach(this.#processNodeAsDefinition.bind(this, definitionKind));
        break;
      case 'AssignmentPattern':
        this.#processNodeAsDefinition(definitionKind, node.left);
        this.processNode(node.right);
        break;
      case 'Identifier':
        this.#addDefinition(node.name, node.start, definitionKind, false);
        break;
      case 'MemberExpression':
        this.processNode(node.object);
        if (node.computed) {
          this.processNode(node.property);
        }
        break;
      case 'ObjectPattern':
        node.properties.forEach(this.#processNodeAsDefinition.bind(this, definitionKind));
        break;
      case 'Property':
        // This is AssignmentProperty inside an object pattern.
        if (node.shorthand) {
          console.assert(node.value === node.key);
          console.assert(node.value.type === 'Identifier');
          this.#addDefinition((node.value as Acorn.ESTree.Identifier).name, node.value.start, definitionKind, true);
        } else {
          if (node.computed) {
            this.processNode(node.key);
          }
          this.#processNodeAsDefinition(definitionKind, node.value);
        }
        break;
      case 'RestElement':
        this.#processNodeAsDefinition(definitionKind, node.argument);
        break;
    }
  }

  #processVariableDeclarator(
      definitionKind: DefinitionKind.Let|DefinitionKind.Var, decl: Acorn.ESTree.VariableDeclarator): void {
    this.#processNodeAsDefinition(definitionKind, decl.id);
    if (decl.init) {
      this.processNode(decl.init);
    }
  }

  processNode(node: Acorn.ESTree.Node): void {
    switch (node.type) {
      case 'AwaitExpression':
        this.processNode(node.argument);
        break;
      case 'ArrayExpression':
        node.elements.forEach(item => item && this.processNode(item));
        break;
      case 'ExpressionStatement':
        this.processNode(node.expression);
        break;
      case 'Program':
        console.assert(this.#currentScope === this.#rootScope);
        node.body.forEach(item => this.processNode(item));
        console.assert(this.#currentScope === this.#rootScope);
        break;
      case 'ArrayPattern':
        node.elements.forEach(item => item && this.processNode(item));
        break;
      case 'ArrowFunctionExpression':
        this.#pushScope();
        node.params.forEach(this.#processNodeAsDefinition.bind(this, DefinitionKind.Var));
        this.processNode(node.body);
        this.#popScope(true);
        break;
      case 'AssignmentExpression':
      case 'AssignmentPattern':
      case 'BinaryExpression':
      case 'LogicalExpression':
        this.processNode(node.left);
        this.processNode(node.right);
        break;
      case 'BlockStatement':
        this.#pushScope();
        node.body.forEach(this.processNode.bind(this));
        this.#popScope(false);
        break;
      case 'CallExpression':
        this.processNode(node.callee);
        node.arguments.forEach(this.processNode.bind(this));
        break;
      case 'VariableDeclaration': {
        const definitionKind = node.kind === 'var' ? DefinitionKind.Var : DefinitionKind.Let;
        node.declarations.forEach(this.#processVariableDeclarator.bind(this, definitionKind));
        break;
      }
      case 'CatchClause':
        this.#pushScope();
        if (node.param) {
          this.#processNodeAsDefinition(DefinitionKind.Let, node.param);
        }
        node.body.body.forEach(this.processNode.bind(this));
        this.#popScope(false);
        break;
      case 'ClassBody':
        node.body.forEach(this.processNode.bind(this));
        break;
      case 'ClassDeclaration':
        if (node.id) {
          this.#processNodeAsDefinition(DefinitionKind.Let, node.id);
        }
        this.#pushScope();
        if (node.superClass) {
          this.processNode(node.superClass);
        }
        this.processNode(node.body);
        this.#popScope(false);
        break;
      case 'ClassExpression':
        this.#pushScope();
        // Intentionally ignore the id.
        if (node.superClass) {
          this.processNode(node.superClass);
        }
        this.processNode(node.body);
        this.#popScope(false);
        break;
      case 'ChainExpression':
        this.processNode(node.expression);
        break;
      case 'ConditionalExpression':
        this.processNode(node.test);
        this.processNode(node.consequent);
        this.processNode(node.alternate);
        break;
      case 'DoWhileStatement':
        this.processNode(node.body);
        this.processNode(node.test);
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        this.#pushScope();
        this.processNode(node.left);
        this.processNode(node.right);
        this.processNode(node.body);
        this.#popScope(false);
        break;
      case 'ForStatement':
        this.#pushScope();
        if (node.init) {
          this.processNode(node.init);
        }
        if (node.test) {
          this.processNode(node.test);
        }
        if (node.update) {
          this.processNode(node.update);
        }
        this.processNode(node.body);
        this.#popScope(false);
        break;
      case 'FunctionDeclaration':
        if (node.id) {
          this.#processNodeAsDefinition(DefinitionKind.Var, node.id);
        }
        this.#pushScope();
        // TODO(jarin) Also add 'arguments', introduce new DefinitionKind to identify
        // variables that cannot be renamed.
        this.#addDefinition('this', -1, DefinitionKind.Let, false);
        node.params.forEach(this.#processNodeAsDefinition.bind(this, DefinitionKind.Let));
        this.processNode(node.body);
        this.#popScope(true);
        break;
      case 'FunctionExpression':
        // Id is intentionally ignored in function expressions.
        this.#pushScope();
        // TODO(jarin) Also add 'arguments', introduce new DefinitionKind to identify
        // variables that cannot be renamed.
        this.#addDefinition('this', -1, DefinitionKind.Let, false);
        node.params.forEach(this.#processNodeAsDefinition.bind(this, DefinitionKind.Let));
        this.processNode(node.body);
        this.#popScope(true);
        break;
      case 'Identifier':
        this.#addUse(node.name, node.start, false);
        break;
      case 'IfStatement':
        this.processNode(node.test);
        this.processNode(node.consequent);
        if (node.alternate) {
          this.processNode(node.alternate);
        }
        break;
      case 'LabeledStatement':
        this.processNode(node.body);
        break;
      case 'MetaProperty':
        break;
      case 'MethodDefinition':
        if (node.computed) {
          this.processNode(node.key);
        }
        this.processNode(node.value);
        break;
      case 'NewExpression':
        this.processNode(node.callee);
        node.arguments.forEach(this.processNode.bind(this));
        break;
      case 'MemberExpression':
        this.processNode(node.object);
        if (node.computed) {
          this.processNode(node.property);
        }
        break;
      case 'ObjectExpression':
        node.properties.forEach(this.processNode.bind(this));
        break;
      case 'ObjectPattern':
        node.properties.forEach(this.processNode.bind(this));
        break;
      case 'PrivateIdentifier':
        break;
      case 'PropertyDefinition':
        if (node.computed) {
          this.processNode(node.key);
        }
        if (node.value) {
          this.processNode(node.value);
        }
        break;
      case 'Property':
        if (node.shorthand) {
          console.assert(node.value === node.key);
          console.assert(node.value.type === 'Identifier');
          this.#addUse((node.value as Acorn.ESTree.Identifier).name, node.value.start, true);
        } else {
          if (node.computed) {
            this.processNode(node.key);
          }
          this.processNode(node.value);
        }
        break;
      case 'RestElement':
        this.#processNodeAsDefinition(DefinitionKind.Let, node.argument);
        break;
      case 'ReturnStatement':
        if (node.argument) {
          this.processNode(node.argument);
        }
        break;
      case 'SequenceExpression':
        node.expressions.forEach(this.processNode.bind(this));
        break;
      case 'SpreadElement':
        this.processNode(node.argument);
        break;
      case 'SwitchCase':
        if (node.test) {
          this.processNode(node.test);
        }
        node.consequent.forEach(this.processNode.bind(this));
        break;
      case 'SwitchStatement':
        this.processNode(node.discriminant);
        node.cases.forEach(this.processNode.bind(this));
        break;
      case 'TaggedTemplateExpression':
        this.processNode(node.tag);
        this.processNode(node.quasi);
        break;
      case 'TemplateLiteral':
        node.expressions.forEach(this.processNode.bind(this));
        break;
      case 'ThisExpression':
        this.#addUse('this', node.start, false);
        break;
      case 'ThrowStatement':
        this.processNode(node.argument);
        break;
      case 'TryStatement':
        this.processNode(node.block);
        if (node.handler) {
          this.processNode(node.handler);
        }
        if (node.finalizer) {
          this.processNode(node.finalizer);
        }
        break;
      case 'WithStatement':
        this.processNode(node.object);
        // TODO jarin figure how to treat the with body.
        this.processNode(node.body);
        break;
      case 'YieldExpression':
        if (node.argument) {
          this.processNode(node.argument);
        }
        break;
      case 'UnaryExpression':
      case 'UpdateExpression':
        this.processNode(node.argument);
        break;
      case 'WhileStatement':
        this.processNode(node.test);
        this.processNode(node.body);
        break;

      // Ignore, no expressions involved.
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'DebuggerStatement':
      case 'EmptyStatement':
      case 'Literal':
      case 'Super':
      case 'TemplateElement':
        break;
        // Ignore, cannot be used outside of a module.
      case 'ImportDeclaration':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
      case 'ImportSpecifier':
      case 'ImportExpression':
      case 'ExportAllDeclaration':
      case 'ExportDefaultDeclaration':
      case 'ExportNamedDeclaration':
      case 'ExportSpecifier':
        break;

      case 'VariableDeclarator':
        console.error('Should not encounter VariableDeclarator in general traversal.');
        break;
    }
  }
}
