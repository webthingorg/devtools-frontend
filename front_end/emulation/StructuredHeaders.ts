// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This provides parsing for HTTP structured headers as specified in:
// https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19
// (the ABNF fragments are quoted from the spec, unless otherwise specified,
//  and the code pretty much just follows the algorithms given there).
//
// parseList and parseItem are the main entry points.
//
// Currently dictionary parsing and serialization are not implemented.

export enum ResultKind {
  Error,
  List,
  InnerList,
  ParamName,
  Parameter,
  Parameters,
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

export interface ParamName {
  kind: ResultKind.ParamName;
  value: string;
}

// parameter     = param-name [ "=" param-value ]
// param-value   = bare-item
export interface Parameter {
  kind: ResultKind.Parameter;
  name: ParamName;
  value: BareItem;
}

// parameters  = *( ";" *SP parameter )
export interface Parameters {
  kind: ResultKind.Parameters;
  items: Parameter[];
}

// sf-item   = bare-item parameters
export interface Item {
  kind: ResultKind.Item;
  value: BareItem;
  parameters: Parameters;
}

// inner-list    = "(" *SP [ sf-item *( 1*SP sf-item ) *SP ] ")"
//                   parameters
export interface InnerList {
  kind: ResultKind.InnerList;
  items: Item[];
  parameters: Parameters;
}

// list-member = sf-item / inner-list
export type ListMember = Item|InnerList;

// sf-list = list-member *( OWS "," OWS list-member )
export interface List {
  kind: ResultKind.List;
  items: ListMember[];
}

const CharMinus: number = '-'.charCodeAt(0);
const Char0: number = '0'.charCodeAt(0);
const Char9: number = '9'.charCodeAt(0);
const CharA: number = 'A'.charCodeAt(0);
const CharZ: number = 'Z'.charCodeAt(0);
const CharLowerA: number = 'a'.charCodeAt(0);
const CharLowerZ: number = 'z'.charCodeAt(0);
const CharDQuote: number = '"'.charCodeAt(0);
const CharColon: number = ':'.charCodeAt(0);
const CharQuestionMark: number = '?'.charCodeAt(0);
const CharStar: number = '*'.charCodeAt(0);
const CharUnderscore: number = '_'.charCodeAt(0);
const CharDot: number = '.'.charCodeAt(0);
const CharBackslash: number = '\\'.charCodeAt(0);
const CharSlash: number = '/'.charCodeAt(0);
const CharPlus: number = '+'.charCodeAt(0);
const CharEquals: number = '='.charCodeAt(0);
const CharExclamation: number = '!'.charCodeAt(0);
const CharHash: number = '#'.charCodeAt(0);
const CharDollar: number = '$'.charCodeAt(0);
const CharPercent: number = '%'.charCodeAt(0);
const CharAnd: number = '&'.charCodeAt(0);
const CharSQuote: number = '\''.charCodeAt(0);
const CharHat: number = '^'.charCodeAt(0);
const CharBacktick: number = '`'.charCodeAt(0);
const CharPipe: number = '|'.charCodeAt(0);
const CharTilde: number = '~'.charCodeAt(0);

// Note: structured headers operates over ASCII, not unicode, so these are
// all are indeed supposed to return false be aware of things outside 32-127
// range regardless of them being other kinds of digits or letters.
function IsDigit(charCode: number|undefined): boolean {
  // DIGIT = %x30-39 ; 0-9 (from RFC 5234)
  if (charCode === undefined) {
    return false;
  }
  return charCode >= Char0 && charCode <= Char9;
}

function IsAlpha(charCode: number|undefined): boolean {
  // ALPHA = %x41-5A / %x61-7A   ; A-Z / a-z (from RFC 5234)
  if (charCode === undefined) {
    return false;
  }
  return (charCode >= CharA && charCode <= CharZ) || (charCode >= CharLowerA && charCode <= CharLowerZ);
}

function IsLcAlpha(charCode: number|undefined): boolean {
  // lcalpha = %x61-7A ; a-z
  if (charCode === undefined) {
    return false;
  }
  return (charCode >= CharLowerA && charCode <= CharLowerZ);
}

function IsTChar(charCode: number|undefined): boolean {
  if (charCode === undefined) {
    return false;
  }

  // tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
  // "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA (from RFC 7230)
  if (IsDigit(charCode) || IsAlpha(charCode)) {
    return true;
  }
  switch (charCode) {
    case CharExclamation:
    case CharHash:
    case CharDollar:
    case CharPercent:
    case CharAnd:
    case CharSQuote:
    case CharStar:
    case CharPlus:
    case CharMinus:
    case CharDot:
    case CharHat:
    case CharUnderscore:
    case CharBacktick:
    case CharPipe:
    case CharTilde:
      return true;
    default:
      return false;
  }
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

  peekCharCode(): number|undefined {
    return (this.pos < this.data.length ? this.data.charCodeAt(this.pos) : undefined);
  }

  eat(): void {
    ++this.pos;
  }

  // Matches SP*.
  // SP = %x20, from RFC 5234
  skipSP(): void {
    while (this.data[this.pos] === ' ') {
      ++this.pos;
    }
  }

  // Matches OWS
  // OWS = *( SP / HTAB ) , from RFC 7230
  skipOWS(): void {
    while (this.data[this.pos] === ' ' || this.data[this.pos] === '\t') {
      ++this.pos;
    }
  }

  atEnd(): boolean {
    return (this.pos === this.data.length);
  }

  // 4.2 steps 6,7 --- checks for trailing characters.
  allParsed(): boolean {
    this.skipSP();
    return (this.pos === this.data.length);
  }
}

function _makeError(): Error {
  return {kind: ResultKind.Error};
}

// 4.2.1. Parsing a list
function _parseList(input: Input): List|Error {
  const result: List = {kind: ResultKind.List, items: []};

  while (!input.atEnd()) {
    const piece: ListMember|Error = _parseItemOrInnerList(input);
    if (piece.kind === ResultKind.Error) {
      return piece;
    }
    result.items.push(piece);
    input.skipOWS();
    if (input.atEnd()) {
      return result;
    }

    if (input.peek() != ',') {
      return _makeError();
    }
    input.eat();
    input.skipOWS();

    // "If input_string is empty, there is a trailing comma; fail parsing."
    if (input.atEnd()) {
      return _makeError();
    }
  }
  return result;  // this case corresponds to an empty list.
}

// 4.2.1.1.  Parsing an Item or Inner List
function _parseItemOrInnerList(input: Input): ListMember|Error {
  if (input.peek() === '(') {
    return _parseInnerList(input);
  }
  return _parseItem(input);
}

// 4.2.1.2.  Parsing an Inner List
function _parseInnerList(input: Input): InnerList|Error {
  if (input.peek() != '(') {
    return _makeError();
  }
  input.eat();

  const items: Item[] = [];
  while (!input.atEnd()) {
    input.skipSP();
    if (input.peek() === ')') {
      input.eat();
      const params: Parameters|Error = _parseParameters(input);
      if (params.kind === ResultKind.Error) {
        return params;
      }
      return {
        kind: ResultKind.InnerList,
        items: items,
        parameters: params,
      };
    }
    const item: Item|Error = _parseItem(input);
    if (item.kind === ResultKind.Error) {
      return item;
    }
    items.push(item);
    if (input.peek() != ' ' && input.peek() != ')') {
      return _makeError();
    }
  }

  // Didn't see ), so error.
  return _makeError();
}

// 4.2.3.  Parsing an Item
function _parseItem(input: Input): Item|Error {
  const bareItem: BareItem|Error = _parseBareItem(input);
  if (bareItem.kind === ResultKind.Error) {
    return bareItem;
  }
  const params: Parameters|Error = _parseParameters(input);
  if (params.kind === ResultKind.Error) {
    return params;
  }
  return {kind: ResultKind.Item, value: bareItem, parameters: params};
}

// 4.2.3.1.  Parsing a Bare Item
function _parseBareItem(input: Input): BareItem|Error {
  const upcoming = input.peekCharCode();
  if (upcoming === CharMinus || IsDigit(upcoming)) {
    return _parseIntegerOrDecimal(input);
  }
  if (upcoming === CharDQuote) {
    return _parseString(input);
  }
  if (upcoming === CharColon) {
    return _parseByteSequence(input);
  }
  if (upcoming == CharQuestionMark) {
    return _parseBoolean(input);
  }
  if (upcoming == CharStar || IsAlpha(upcoming)) {
    return _parseToken(input);
  }
  return _makeError();
}

// 4.2.3.2.  Parsing Parameters
function _parseParameters(input: Input): Parameters|Error {
  // The main noteworthy thing here is handling of duplicates and ordering:
  //
  // "Note that Parameters are ordered as serialized"
  //
  // "If parameters already contains a name param_name (comparing
  // character-for-character), overwrite its value."
  //
  // "Note that when duplicate Parameter keys are encountered, this has the
  // effect of ignoring all but the last instance."

  // To implement this, we use a map to delete array elements representing
  // duplicates, and then flatten out the holes.
  let items: Parameter[] = [];
  interface PosDict {
    [name: string]: number
  }

  const propPos: PosDict = {};
  while (!input.atEnd()) {
    if (input.peek() != ';') {
      break;
    }
    input.eat();
    input.skipSP();
    const paramName = _parseKey(input);
    if (paramName.kind === ResultKind.Error) {
      return paramName;
    }

    let paramValue: BareItem = {kind: ResultKind.Boolean, value: true};
    if (input.peek() === '=') {
      input.eat();
      const parsedParamValue: BareItem|Error = _parseBareItem(input);
      if (parsedParamValue.kind === ResultKind.Error) {
        return parsedParamValue;
      }
      paramValue = parsedParamValue;
    }

    items.push({kind: ResultKind.Parameter, name: paramName, value: paramValue});
    if (paramName.value in propPos) {
      delete items[propPos[paramName.value]];
    }
    propPos[paramName.value] = items.length - 1;
  }

  // Close holes.
  items = items.filter(() => true);

  return {kind: ResultKind.Parameters, items: items};
}

// 4.2.3.3.  Parsing a Key
function _parseKey(input: Input): ParamName|Error {
  let outputString: string = '';
  const first = input.peekCharCode();
  if (first != CharStar && !IsLcAlpha(first)) {
    return _makeError();
  }

  while (!input.atEnd()) {
    const upcoming = input.peekCharCode();
    if (!IsLcAlpha(upcoming) && !IsDigit(upcoming) && upcoming != CharUnderscore && upcoming != CharMinus &&
        upcoming != CharDot && upcoming != CharStar) {
      break;
    }
    outputString += input.peek();
    input.eat();
  }

  return {kind: ResultKind.ParamName, value: outputString};
}

// 4.2.4.  Parsing an Integer or Decimal
function _parseIntegerOrDecimal(input: Input): Integer|Decimal|Error {
  let resultKind = ResultKind.Integer;
  let sign: number = 1;
  let inputNumber = '';
  if (input.peek() === '-') {
    input.eat();
    sign = -1;
  }

  // This case includes end of input.
  if (!IsDigit(input.peekCharCode())) {
    return _makeError();
  }

  while (!input.atEnd()) {
    const char = input.peekCharCode();
    if (char != undefined && IsDigit(char)) {
      input.eat();
      inputNumber += String.fromCodePoint(char);
    } else if (char === CharDot && resultKind === ResultKind.Integer) {
      input.eat();
      if (inputNumber.length > 12) {
        return _makeError();
      }
      inputNumber += '.';
      resultKind = ResultKind.Decimal;
    } else {
      break;
    }
    if (resultKind === ResultKind.Integer && inputNumber.length > 15) {
      return _makeError();
    }
    if (resultKind === ResultKind.Decimal && inputNumber.length > 16) {
      return _makeError();
    }
  }

  if (resultKind === ResultKind.Integer) {
    const num = sign * Number.parseInt(inputNumber, 10);
    if (num < -999999999999999 || num > 999999999999999) {
      return _makeError();
    }
    return {kind: ResultKind.Integer, value: num};
  }
  const afterDot = inputNumber.length - 1 - inputNumber.indexOf('.');
  if (afterDot > 3 || afterDot == 0) {
    return _makeError();
  }
  return {kind: ResultKind.Decimal, value: sign * Number.parseFloat(inputNumber)};
}

// 4.2.5.  Parsing a String
function _parseString(input: Input): String|Error {
  let outputString = '';
  if (input.peek() != '"') {
    return _makeError();
  }
  input.eat();
  while (!input.atEnd()) {
    const char = input.peekCharCode();
    // can't happen due to atEnd(), but help the typechecker out.
    if (char === undefined) {
      return _makeError();
    }

    input.eat();
    if (char === CharBackslash) {
      if (input.atEnd()) {
        return _makeError();
      }
      const nextChar = input.peekCharCode();
      input.eat();
      if (nextChar != CharBackslash && nextChar != CharDQuote) {
        return _makeError();
      }
      outputString += String.fromCodePoint(nextChar);
    } else if (char === CharDQuote) {
      return {kind: ResultKind.String, value: outputString};
    } else if (char<0x20 || char>0x7e) {
      return _makeError();
    } else {
      outputString += String.fromCodePoint(char);
    }
  }

  // No closing quote.
  return _makeError();
}

// 4.2.6.  Parsing a Token
function _parseToken(input: Input): Token|Error {
  const first = input.peekCharCode();
  if (first != CharStar && !IsAlpha(first)) {
    return _makeError();
  }
  let outputString = '';
  while (!input.atEnd()) {
    const upcoming = input.peekCharCode();
    if (upcoming === undefined || !IsTChar(upcoming) && upcoming != CharColon && upcoming != CharSlash) {
      break;
    }
    input.eat();
    outputString += String.fromCodePoint(upcoming);
  }
  return {kind: ResultKind.Token, value: outputString};
}

// 4.2.7.  Parsing a Byte Sequence
function _parseByteSequence(input: Input): Binary|Error {
  let outputString = '';
  if (input.peek() != ':') {
    return _makeError();
  }
  input.eat();
  while (!input.atEnd()) {
    const char = input.peekCharCode();
    // can't happen due to atEnd(), but help the typechecker out.
    if (char === undefined) {
      return _makeError();
    }

    input.eat();
    if (char == CharColon) {
      return {kind: ResultKind.Binary, value: outputString};
    }
    if (IsDigit(char) || IsAlpha(char) || char === CharPlus || char === CharSlash || char === CharEquals) {
      outputString += String.fromCodePoint(char);
    } else {
      return _makeError();
    }
  }

  // No closing :
  return _makeError();
}

// 4.2.8.  Parsing a Boolean
function _parseBoolean(input: Input): Boolean|Error {
  if (input.peek() != '?') {
    return _makeError();
  }
  input.eat();
  if (input.peek() == '0') {
    input.eat();
    return {kind: ResultKind.Boolean, value: false};
  }
  if (input.peek() == '1') {
    input.eat();
    return {kind: ResultKind.Boolean, value: true};
  }
  return _makeError();
}

export function parseItem(input: string): Item|Error {
  const i = new Input(input);
  const result: Item|Error = _parseItem(i);
  if (!i.allParsed()) {
    return _makeError();
  }
  return result;
}

export function parseList(input: string): List|Error {
  // No need to look for trailing stuff here since _parseList does it already.
  return _parseList(new Input(input));
}
