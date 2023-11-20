// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Host from '../../core/host/host.js';
import type * as Platform from '../../core/platform/platform.js';
import type * as SDK from '../../core/sdk/sdk.js';
import * as ElementsComponents from '../../panels/elements/components/components.js';
import * as CodeMirror from '../../third_party/codemirror.next/codemirror.next.js';
import * as InlineEditor from '../../ui/legacy/components/inline_editor/inline_editor.js';
import * as UI from '../../ui/legacy/legacy.js';

import {REGISTERED_PROPERTY_SECTION_NAME, type StylesSidebarPane} from './StylesSidebarPane.js';

const cssParser = CodeMirror.css.cssLanguage.parser;

export class SyntaxTree {
  constructor(readonly propertyValue: string, readonly rule: string, readonly tree: CodeMirror.SyntaxNode) {
  }

  text(node?: CodeMirror.SyntaxNode): string {
    if (!node) {
      node = this.tree;
    }
    return this.rule.substr(node.from, node.to - node.from);
  }

  subtree(node: CodeMirror.SyntaxNode): SyntaxTree {
    return new SyntaxTree(this.propertyValue, this.rule, node);
  }
}

interface SyntaxNodeRef {
  node: CodeMirror.SyntaxNode;
}

export abstract class TreeWalker {
  constructor(readonly ast: SyntaxTree) {
  }
  static walk<T extends TreeWalker, ArgTs>(
      this: {new(ast: SyntaxTree, ...args: ArgTs[]): T}, propertyValue: SyntaxTree, walkSuccessors: boolean,
      ...args: ArgTs[]): T {
    const instance = new this(propertyValue, ...args);
    instance.iterate(propertyValue.tree, walkSuccessors);
    return instance;
  }

  protected iterate(tree: CodeMirror.SyntaxNode, walkSuccessors: boolean): void {
    if (walkSuccessors) {
      tree.cursor().iterate(this.enter.bind(this), this.leave.bind(this));
    } else {
      // Customize the first step to avoid visiting siblings of `tree`
      if (this.enter(tree)) {
        tree.firstChild?.cursor().iterate(this.enter.bind(this), this.leave.bind(this));
      }
      this.leave(tree);
    }
  }

  protected enter(_node: SyntaxNodeRef): boolean {
    return true;
  }

  protected leave(_node: SyntaxNodeRef): void {
  }
}

export class Printer extends TreeWalker {
  #printedText: string[] = [];
  #indent = 0;

  protected override enter({node}: SyntaxNodeRef): boolean {
    const text = this.ast.text(node);
    this.#printedText.push(`${'|'.repeat(this.#indent)} ${node.name}${text !== node.name ? `: ${text}` : ''}`);
    this.#indent++;
    return true;
  }
  protected override leave(): void {
    this.#indent--;
  }

  get(): string {
    return this.#printedText.join('\n');
  }

  static log(ast: SyntaxTree): void {
    /* eslint-disable-next-line no-console */
    console.log(Printer.walk(ast, true).get());
  }
}

interface RenderingContext {
  ast: SyntaxTree;
  matchedResult: BottomUpTreeMatching;
}

interface Match {
  render(context: RenderingContext): Node[];
}

export interface Matcher {
  matches(node: CodeMirror.SyntaxNode, matching: BottomUpTreeMatching): Match|null;
}

type MatchKey = Platform.Brand.Brand<string, 'MatchKey'>;
export class BottomUpTreeMatching extends TreeWalker {
  #matchers: Matcher[] = [];
  #matchedNodes = new Map<MatchKey, Match>();

  #key(node: CodeMirror.SyntaxNode): MatchKey {
    return `${node.from}:${node.to}` as MatchKey;
  }

  constructor(ast: SyntaxTree, matchers: Matcher[]) {
    super(ast);
    this.#matchers.push(...matchers);
    this.#matchers.push(new TextMatcher());
  }

  protected override leave({node}: SyntaxNodeRef): void {
    for (const matcher of this.#matchers) {
      const match = matcher.matches(node, this);
      if (match) {
        this.#matchedNodes.set(this.#key(node), match);
        break;
      }
    }
  }

  addMatcher(matcher: Matcher): void {
    this.#matchers.push(matcher);
  }

  getMatch(node: CodeMirror.SyntaxNode): Match|undefined {
    return this.#matchedNodes.get(this.#key(node));
  }
}

export class Renderer extends TreeWalker {
  readonly #matchedResult: BottomUpTreeMatching;
  #output: Node[] = [];

  constructor(ast: SyntaxTree, matchedResult: BottomUpTreeMatching) {
    super(ast);
    this.#matchedResult = matchedResult;
  }

  static render(node: CodeMirror.SyntaxNode, context: RenderingContext): Node[] {
    const renderer = Renderer.walk(context.ast.subtree(node), false, context.matchedResult);
    return renderer.#output;
  }

  protected override enter({node}: SyntaxNodeRef): boolean {
    const match = this.#matchedResult.getMatch(node);
    if (match) {
      this.#output.push(...match.render(this.#context()));
      return false;
    }

    return true;
  }

  #context(): RenderingContext {
    return {ast: this.ast, matchedResult: this.#matchedResult};
  }
}

function siblings(node: CodeMirror.SyntaxNode|null): CodeMirror.SyntaxNode[] {
  const result = [];
  while (node) {
    result.push(node);
    node = node.nextSibling;
  }
  return result;
}

function children(node: CodeMirror.SyntaxNode): CodeMirror.SyntaxNode[] {
  return siblings(node.firstChild);
}

export class VariableMatch implements Match {
  constructor(
      readonly pane: StylesSidebarPane, readonly matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles,
      readonly style: SDK.CSSStyleDeclaration.CSSStyleDeclaration, readonly text: string, readonly name: string,
      readonly fallback: CodeMirror.SyntaxNode|null) {
  }

  render(context: RenderingContext): Node[] {
    const computedSingleValue = this.matchedStyles.computeSingleVariableValue(this.style, this.text);

    const fallbackHtml = this.fallback ? Renderer.render(this.fallback, context) : [];
    if (!computedSingleValue) {
      const text = document.createTextNode(this.text);
      return fallbackHtml.length === 0 ?
          [text] :
          [document.createTextNode(`var(${this.name}), `), ...fallbackHtml, document.createTextNode(')')];
    }

    const {computedValue, fromFallback} = computedSingleValue;

    const varSwatch = new InlineEditor.LinkSwatch.CSSVarSwatch();
    UI.UIUtils.createTextChild(varSwatch, this.text);
    varSwatch.data = {
      computedValue,
      variableName: this.name,
      fromFallback,
      fallbackHtml,
      onLinkActivate: this.#handleVarDefinitionActivate.bind(this),
    };

    if (varSwatch.link?.linkElement) {
      const {textContent} = varSwatch.link.linkElement;
      if (textContent) {
        const computedValueOfLink =
            textContent ? this.matchedStyles.computeSingleVariableValue(this.style, `var(${textContent})`) : null;
        this.pane.addPopover(
            varSwatch.link,
            () => this.#getVariablePopoverContents(textContent, computedValueOfLink?.computedValue ?? null));
      }
    }

    return [varSwatch];

    // FIXME if (!computedValue || !Common.Color.parse(computedValue)) {
    //  return varSwatch;
    // }

    // return this.processColor(computedValue, varSwatch);
  }

  #getRegisteredPropertyDetails(variableName: string): ElementsComponents.CSSVariableValueView.RegisteredPropertyDetails
      |undefined {
    const registration = this.matchedStyles.getRegisteredProperty(variableName);
    const goToDefinition = (): void => this.pane.jumpToSection(variableName, REGISTERED_PROPERTY_SECTION_NAME);
    return registration ? {registration, goToDefinition} : undefined;
  }

  #getVariablePopoverContents(variableName: string, computedValue: string|null): HTMLElement|undefined {
    return new ElementsComponents.CSSVariableValueView.CSSVariableValueView({
      variableName,
      value: computedValue ?? undefined,
      details: this.#getRegisteredPropertyDetails(variableName),
    });
  }

  #handleVarDefinitionActivate(): void {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.CustomPropertyLinkClicked);
    Host.userMetrics.swatchActivated(Host.UserMetrics.SwatchType.VarLink);
    this.pane.jumpToProperty(this.name) ||
        this.pane.jumpToProperty('initial-value', this.name, REGISTERED_PROPERTY_SECTION_NAME);
  }
}

export class VariableMatcher implements Matcher {
  constructor(
      readonly pane: StylesSidebarPane, readonly style: SDK.CSSStyleDeclaration.CSSStyleDeclaration,
      readonly matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles) {
  }
  matches(node: CodeMirror.SyntaxNode, matching: BottomUpTreeMatching): Match|null {
    const callee = node.getChild('Callee');
    const args = node.getChild('ArgList');
    if (node.name !== 'CallExpression' || !callee || (matching.ast.text(callee) !== 'var') || !args) {
      return null;
    }

    const [lparenNode, nameNode, parenOrCommaNode, fallbackNode, rparenNode] = children(args);

    if (lparenNode?.name !== '(' || nameNode?.name !== 'VariableName') {
      return null;
    }
    if (parenOrCommaNode?.name === ',') {
      if (!fallbackNode || rparenNode?.name !== ')') {
        return null;
      }
    } else if (parenOrCommaNode?.name !== ')') {
      return null;
    }

    const varName = matching.ast.text(nameNode);
    if (!varName.startsWith('--')) {
      return null;
    }

    return new VariableMatch(this.pane, this.matchedStyles, this.style, matching.ast.text(node), varName, fallbackNode);
  }
}

class LegacyRegexMatch implements Match {
  constructor(readonly text: string, readonly processor: (text: string) => Node | null) {
  }
  render(): Node[] {
    const rendered = this.processor(this.text);
    return rendered ? [rendered] : [];
  }
}

export class LegacyRegexMatcher implements Matcher {
  readonly regexp: RegExp;
  readonly processor: (text: string) => Node | null;
  constructor(regexp: RegExp, processor: (text: string) => Node | null) {
    this.regexp = new RegExp(regexp);
    this.processor = processor;
  }
  matches(node: CodeMirror.SyntaxNode, matching: BottomUpTreeMatching): Match|null {
    const text = matching.ast.text(node);
    this.regexp.lastIndex = 0;
    const match = this.regexp.exec(text);
    return match && match.index === 0 ? new LegacyRegexMatch(text, this.processor) : null;
  }
}

class TextMatch implements Match {
  constructor(readonly text: string) {
  }
  render(): Node[] {
    return [document.createTextNode(this.text)];
  }
}

class TextMatcher implements Matcher {
  matches(node: CodeMirror.SyntaxNode, matching: BottomUpTreeMatching): Match|null {
    if (!node.firstChild || node.name === 'NumberLiteral' /* may have a Unit child */) {
      // Leaf node, just emit text
      const text = matching.ast.text(node);
      if (text.length) {
        return new TextMatch(text);
      }
    }
    return null;
  }
}

export function tokenizePropertyValue(propertyValue: string): SyntaxTree|null {
  const fakePropertyName = '--property';
  const rule = `*{${fakePropertyName}: ${propertyValue};}`;
  const declaration = cssParser.parse(rule).topNode.getChild('RuleSet')?.getChild('Block')?.getChild('Declaration');
  if (!declaration) {
    return null;
  }

  const childNodes = children(declaration);
  if (childNodes.length < 3) {
    return null;
  }
  const [varName, colon, tree] = childNodes;
  if (!varName || !colon || !tree) {
    return null;
  }
  const ast = new SyntaxTree(propertyValue, rule, tree);
  if (ast.text(varName) !== fakePropertyName || colon.name !== ':') {
    return null;
  }
  return ast;
}

export function parsePropertyValue(text: string, matchers: Matcher[]): Node[] {
  const tree = tokenizePropertyValue(text);
  if (!tree) {
    return [];
  }
  const matchedResult = BottomUpTreeMatching.walk(tree, true, matchers);
  const context = {ast: matchedResult.ast, matchedResult};
  return siblings(tree.tree).map(node => Renderer.render(node, context)).flat();
}
