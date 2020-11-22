// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This provides parsing for HTTP structured headers as specified in:
// https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19
// (the ABNF fragments are quoted from the spec, and the algorithms pretty much
//  follow what's written there).
//
// parseList and parseItem are the main entry points.
//
// Currently dictionary parsing and serialization are not implemented.

enum ResultKind {
  Error,
  List,
  InnerList,
  Parameter,
  Item,
  Integer,
  Decimal,
  String,
  Token,
  Binary,
  Boolean
}

export interface Error {
  kind: ResultKind.Error;
}

export interface Integer {
  kind: ResultKind.Integer;
  value: number;
}

export interface Decimal {
  kind: ResultKind.Decimal;
  value: number;
}

export interface String {
  kind: ResultKind.String;
  value: string;
}

export interface Token {
  kind: ResultKind.Token;
  value: string;
}

export interface Binary {
  kind: ResultKind.Binary;
  // This is undecoded base64
  value: string;
}

export interface Boolean {
  kind: ResultKind.Boolean;
  value: boolean;
}

//  bare-item = sf-integer / sf-decimal / sf-string / sf-token
//              / sf-binary / sf-boolean
export type BareItem = Integer|Decimal|String|Token|Binary|Boolean;

// parameter     = param-name [ "=" param-value ]
// param-value   = bare-item
export interface Parameter {
  kind: ResultKind.Parameter;
  name: string;
  value: BareItem;
}

// sf-item   = bare-item parameters
// parameters    = *( ";" *SP parameter )
export interface Item {
  kind: ResultKind.Item;
  value: BareItem;
  parameters: Parameter[];
}

// inner-list    = "(" *SP [ sf-item *( 1*SP sf-item ) *SP ] ")"
//                   parameters
// parameters    = *( ";" *SP parameter )
export interface InnerList {
  kind: ResultKind.InnerList;
  items: Item[];
  parameters: Parameter[];
}

// list-member = sf-item / inner-list
export type ListMember = Item|InnerList;

// sf-list = list-member *( OWS "," OWS list-member )
export interface List {
  kind: ResultKind.List;
  items: ListMember[];
}

class Input {
  private data: string;
  private pos: number;

  constructor(input: string) {
    this.data = input;
    this.pos = 0;
    // 4.2 step 2 is to discard any leading SP characters.
    this.skipSP();
  }

  peek(): string|undefined {
    return this.data[this.pos];
  }

  eat(): void {
    ++this.pos;
  }

  // Matches SP*.
  // SP = %x20, from RFC 5234
  skipSP(): void {
    while (this.data[this.pos] === ' ')
      ++this.pos;
  }

  // Matches OWS
  // OWS = *( SP / HTAB ) , from RFC 7230
  skipOWS(): void {
    while (this.data[this.pos] === ' ' || this.data[this.pos] === '\t')
      ++this.pos;
  }

  atEnd(): boolean {
    return (this.pos == this.data.length);
  }

  // 4.2 steps 6,7 --- checks for trailing characters.
  allParsed(): boolean {
    this.skipSP();
    return (this.pos == this.data.length);
  }
}

function _makeError(): Error {
  return {kind: ResultKind.Error};
}

// 4.2.1. Parsing a list
function _parseList(input: Input): List|Error {
  let result: List = {kind: ResultKind.List, items: []};

  while (!input.atEnd()) {
    let piece: ListMember|Error = _parseItemOrInnerList(input);
    if (piece.kind === ResultKind.Error)
      return piece;
    result.items.push(piece);
    input.skipOWS();
    if (input.atEnd())
      return result;

    if (input.peek() != ',')
      return _makeError();
    input.eat();
    input.skipOWS();

    // "If input_string is empty, there is a trailing comma; fail parsing."
    if (input.atEnd())
      return _makeError();
  }
  return result;  // this case corresponds to an empty list.
}

// 4.2.1.1.  Parsing an Item or Inner List
function _parseItemOrInnerList(input: Input): ListMember|Error {
  if (input.peek() == '(')
    return _parseInnerList(input);
  else
    return _parseItem(input);
}

// 4.2.1.2.  Parsing an Inner List
function _parseInnerList(input: Input): InnerList|Error {
  if (input.peek() != '(')
    return _makeError();
  input.eat();

  let result: InnerList = { kind: ResultKind.InnerList, items: [], parameters: [] } while (!input.atEnd()) {
    input.skipSP();
    if (input.peek() == ')') {
      input.eat();
      let params: Parameter[]|Error = _parseParameters(input);
      if (params.kind === ResultKind.Error)
        return params;
      result.parameters = params;
      return result;
    }
    let item: Item|Error = parseItem(input);
    if (item.kind === ResultKind.Error)
      return item;
    result.items.push(item);
    if (input.peek() != ' ' && input.peek() != ')')
      return _makeError();
  }

  // Didn't see ), so error.
  return _makeError();
}

// 4.2.3.  Parsing an Item
function _parseItem(input: Input): Item|Error {
  let bareItem: BareItem|Error = _parseBareItem(input);
  if (bareItem.kind === ResultKind.Error)
    return bareItem;
  let params: Parameter[]|Error = _parseParameters(input);
  if (params.kind === ResultKind.Error)
    return params;
  return {kind: ResultKind: Item, value: bareItem, parameters: params};
}

function _parseBareItem(input: Input): BareItem|Error {
  return _makeError();
}

function _parseParameters(input: Input): Parameter[]|Error {
  return _makeError();
}

export function parseItem(input: string): Item|Error {
  let i = new Input(input);
  let result: Item|Error = _parseItem(i);
  if (!i.allParsed())
    return _makeError();
  return result;
}

export function parseList(input: string): List|Error {
  // No need to look for trailing stuff here since _parseList does it already.
  return _parseList(new Input(input));
}
