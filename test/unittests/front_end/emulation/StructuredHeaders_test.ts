// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const {assert} = chai;
import * as Emulation from '../../../../front_end/emulation/emulation.js';
import StructuredHeaders = Emulation.StructuredHeaders;

function assertItemError(result: StructuredHeaders.Item|StructuredHeaders.Error): void {
  assert.strictEqual(result.kind, StructuredHeaders.ResultKind.ERROR);
}

function assertItemValue(
    result: StructuredHeaders.Item|StructuredHeaders.Error, expectedKind: StructuredHeaders.ResultKind,
    expected: string|number|boolean): void {
  if (result.kind === StructuredHeaders.ResultKind.ERROR) {
    assert.fail('Got error instead of Item containing kind ' + expectedKind);
    return;
  }
  const bareItem = result.value;
  if (bareItem.kind !== expectedKind) {
    assert.fail('Item type is ' + bareItem.kind + ' instead of ' + expectedKind);
    return;
  }

  assert.strictEqual(bareItem.value, expected);
}

function assertItemInteger(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  assertItemValue(result, StructuredHeaders.ResultKind.INTEGER, expected);
}

function assertItemDecimal(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: number): void {
  assertItemValue(result, StructuredHeaders.ResultKind.DECIMAL, expected);
}

function assertItemString(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.STRING, expected);
}

function assertItemToken(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.TOKEN, expected);
}

function assertItemBinary(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: string): void {
  assertItemValue(result, StructuredHeaders.ResultKind.BINARY, expected);
}

function assertItemBoolean(result: StructuredHeaders.Item|StructuredHeaders.Error, expected: boolean): void {
  assertItemValue(result, StructuredHeaders.ResultKind.BOOLEAN, expected);
}

function bareItemEquals(l: StructuredHeaders.BareItem, r: StructuredHeaders.BareItem): boolean {
  switch (l.kind) {
    case StructuredHeaders.ResultKind.INTEGER:
      return r.kind === StructuredHeaders.ResultKind.INTEGER && l.value === r.value;
    case StructuredHeaders.ResultKind.DECIMAL:
      return r.kind === StructuredHeaders.ResultKind.DECIMAL && l.value === r.value;
    case StructuredHeaders.ResultKind.STRING:
      return r.kind === StructuredHeaders.ResultKind.STRING && l.value === r.value;
    case StructuredHeaders.ResultKind.TOKEN:
      return r.kind === StructuredHeaders.ResultKind.TOKEN && l.value === r.value;
    case StructuredHeaders.ResultKind.BINARY:
      return r.kind === StructuredHeaders.ResultKind.BINARY && l.value === r.value;
    case StructuredHeaders.ResultKind.BOOLEAN:
      return r.kind === StructuredHeaders.ResultKind.BOOLEAN && l.value === r.value;
  }
}

function assertParams(
    result: StructuredHeaders.Parameters, expectParams: [string, StructuredHeaders.BareItem][]): void {
  assert.lengthOf(result.items, expectParams.length);
  for (let i = 0; i < expectParams.length; ++i) {
    assert.strictEqual(result.items[i].name.value, expectParams[i][0]);
    assert(bareItemEquals(result.items[i].value, expectParams[i][1]), 'Param ' + i + ' value matches');
  }
}

function assertItemParams(
    result: StructuredHeaders.Item|StructuredHeaders.Error,
    expectParams: [string, StructuredHeaders.BareItem][]): void {
  if (result.kind === StructuredHeaders.ResultKind.ERROR) {
    assert.fail('No params on parse error');
    return;
  }
  assertParams(result.parameters, expectParams);
}

describe('StructuredHeaders', () => {
  describe('Parsing', () => {
    it('Basic integer parsing', () => {
      assertItemInteger(StructuredHeaders.parseItem('23'), 23);
      assertItemInteger(StructuredHeaders.parseItem('023'), 23);
      assertItemInteger(StructuredHeaders.parseItem('-100'), -100);
      assertItemInteger(StructuredHeaders.parseItem('-0'), 0);
      assertItemInteger(StructuredHeaders.parseItem('-999999999999999'), -999999999999999);
      assertItemInteger(StructuredHeaders.parseItem('999999999999999'), 999999999999999);
      assertItemError(StructuredHeaders.parseItem('1999999999999999'));
      assertItemError(StructuredHeaders.parseItem('-1999999999999999'));
      assertItemError(StructuredHeaders.parseItem('-'));
      assertItemError(StructuredHeaders.parseItem('--1'));
    });
    it('Basic decimal parsing', () => {
      assertItemDecimal(StructuredHeaders.parseItem('23.4'), 23.4);
      assertItemDecimal(StructuredHeaders.parseItem('023.4'), 23.4);
      assertItemDecimal(StructuredHeaders.parseItem('-100.3'), -100.3);
      assertItemDecimal(StructuredHeaders.parseItem('-100.32'), -100.32);
      assertItemDecimal(StructuredHeaders.parseItem('100.325'), 100.325);
      assertItemDecimal(StructuredHeaders.parseItem('-0.0'), -0);
      assertItemDecimal(StructuredHeaders.parseItem('-999999999999.999'), -999999999999.999);
      assertItemDecimal(StructuredHeaders.parseItem('999999999999.999'), 999999999999.999);
      assertItemError(StructuredHeaders.parseItem('.'));
      assertItemError(StructuredHeaders.parseItem('1.'));
      assertItemError(StructuredHeaders.parseItem('1.0000'));
      assertItemError(StructuredHeaders.parseItem('--1.0'));
      assertItemError(StructuredHeaders.parseItem('1999999999999.9'));
    });
    it('Basic string parsing', () => {
      assertItemString(StructuredHeaders.parseItem('"abcd"'), 'abcd');
      assertItemString(StructuredHeaders.parseItem('"a\\"\\\\"'), 'a"\\');
      assertItemError(StructuredHeaders.parseItem('"\\n"'));
      assertItemError(StructuredHeaders.parseItem('"\\"'));
      assertItemError(StructuredHeaders.parseItem('"foo'));
      assertItemError(StructuredHeaders.parseItem('"'));
    });
    it('Basic token parsing', () => {
      assertItemToken(StructuredHeaders.parseItem('abcd'), 'abcd');
      assertItemToken(StructuredHeaders.parseItem('*'), '*');
      assertItemToken(StructuredHeaders.parseItem('*z/foo:bar'), '*z/foo:bar');
      assertItemError(StructuredHeaders.parseItem('/far'));
    });
    it('Basic binary parsing', () => {
      assertItemBinary(StructuredHeaders.parseItem(':aBcd+/ef0=:'), 'aBcd+/ef0=');
      assertItemError(StructuredHeaders.parseItem(':foo'));
      assertItemError(StructuredHeaders.parseItem(':'));
    });
    it('Basic boolean parsing', () => {
      assertItemBoolean(StructuredHeaders.parseItem('?0'), false);
      assertItemBoolean(StructuredHeaders.parseItem('?1'), true);
      assertItemError(StructuredHeaders.parseItem('?01'));
      assertItemError(StructuredHeaders.parseItem('?2'));
      assertItemError(StructuredHeaders.parseItem('?'));
    });
    it('Parameter parsing', () => {
      const r1 = StructuredHeaders.parseItem('token; a=1; b=?0');
      assertItemToken(r1, 'token');
      assertItemParams(r1, [
        ['a', {kind: StructuredHeaders.ResultKind.INTEGER, value: 1}],
        ['b', {kind: StructuredHeaders.ResultKind.BOOLEAN, value: false}],
      ]);

      const r2 = StructuredHeaders.parseItem('toooken; a=1; b=?0; a=2; c=4.2; b=?1; a=4; b="hi"');
      assertItemToken(r2, 'toooken');
      assertItemParams(r2, [
        ['c', {kind: StructuredHeaders.ResultKind.DECIMAL, value: 4.2}],
        ['a', {kind: StructuredHeaders.ResultKind.INTEGER, value: 4}],
        ['b', {kind: StructuredHeaders.ResultKind.STRING, value: 'hi'}],
      ]);

      const r3 = StructuredHeaders.parseItem('token; a; b=?0');
      assertItemToken(r3, 'token');
      assertItemParams(r3, [
        ['a', {kind: StructuredHeaders.ResultKind.BOOLEAN, value: true}],
        ['b', {kind: StructuredHeaders.ResultKind.BOOLEAN, value: false}],
      ]);

      const r4 = StructuredHeaders.parseItem('token; *a123-456.789_0*');
      assertItemToken(r4, 'token');
      assertItemParams(r4, [
        ['*a123-456.789_0*', {kind: StructuredHeaders.ResultKind.BOOLEAN, value: true}],
      ]);

      assertItemError(StructuredHeaders.parseItem('token; A=1'));
      assertItemError(StructuredHeaders.parseItem('token; aA=1'));
      assertItemError(StructuredHeaders.parseItem('token ;a=1'));
      assertItemError(StructuredHeaders.parseItem('token; a=1;'));
    });
  });
});
